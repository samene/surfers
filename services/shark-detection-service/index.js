const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Kafka } = require('kafkajs');
const multer = require('multer');
require('dotenv').config();

const app = express();
// Increase JSON body size to allow base64 images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
const PORT = process.env.PORT || 8005;

// Middleware
app.use(cors());
// Serve persisted images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static('uploads'));

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/shark-images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'shark-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sharkdetection', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Kafka configuration
const kafka = new Kafka({
  clientId: 'shark-detection-service',
  brokers: [process.env.KAFKA_BROKER_URL || 'localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'shark-detection-group' });

// Enhanced Shark Detection Schema
const sharkDetectionSchema = new mongoose.Schema({
  detectionId: { type: String, required: true, unique: true },
  droneName: { type: String, required: true },
  sharkType: { type: String, required: true },
  size: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy: { type: Number, required: true }, // Detection accuracy percentage
  imageUrl: { type: String },
  detectionDate: { type: Date, default: Date.now },
  beachName: { type: String },
  isVerified: { type: Boolean, default: false },
  alertSent: { type: Boolean, default: false },
  metadata: {
    weather: { type: String },
    waterTemperature: { type: Number },
    visibility: { type: String },
    notes: { type: String }
  }
});

const SharkDetection = mongoose.model('SharkDetection', sharkDetectionSchema);

// Beach Schema
const beachSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  radius: { type: Number, default: 500 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Beach = mongoose.model('Beach', beachSchema);

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

// Helper function to find nearest beach
async function findNearestBeach(latitude, longitude) {
  const beaches = await Beach.find({ isActive: true });
  let nearestBeach = null;
  let minDistance = Infinity;
  
  for (const beach of beaches) {
    const distance = calculateDistance(
      latitude, longitude,
      beach.location.latitude, beach.location.longitude
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestBeach = beach;
    }
  }
  
  return nearestBeach;
}

// Initialize Kafka producer
async function initializeKafka() {
  try {
    await producer.connect();
    console.log('Kafka producer connected');
  } catch (error) {
    console.error('Failed to connect Kafka producer:', error);
  }
}

// Initialize Kafka consumer
async function initializeConsumer() {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'shark-detections', fromBeginning: true });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const detectionData = JSON.parse(message.value.toString());
          console.log('Processing shark detection from Kafka:', detectionData);
          
          // Process the detection (save to database, send alerts, etc.)
          await processSharkDetection(detectionData);
        } catch (error) {
          console.error('Error processing Kafka message:', error);
        }
      },
    });
    
    console.log('Kafka consumer connected and listening');
  } catch (error) {
    console.error('Failed to connect Kafka consumer:', error);
  }
}

// Process shark detection from Kafka
async function processSharkDetection(detectionData) {
  try {
    // Find nearest beach
    const nearestBeach = await findNearestBeach(detectionData.latitude, detectionData.longitude);
    
    // Create detection record
    const detection = new SharkDetection({
      detectionId: detectionData.detectionId,
      droneName: detectionData.droneName,
      sharkType: detectionData.sharkType,
      size: detectionData.size,
      latitude: detectionData.latitude,
      longitude: detectionData.longitude,
      accuracy: detectionData.accuracy,
      imageUrl: detectionData.imageUrl,
      beachName: nearestBeach ? nearestBeach.name : 'Unknown Beach',
      metadata: detectionData.metadata || {}
    });
    
    await detection.save();
    
    // Send alerts if needed (without creating geofences)
    if (nearestBeach && detectionData.accuracy > 70) {
      try {
        // Send notification without creating geofence
        await axios.post('http://notification-service:8004/api/notifications/send', {
          type: 'shark_alert',
          title: '🦈 SHARK DETECTED!',
          message: `A ${detectionData.size} ${detectionData.sharkType} shark has been detected near ${nearestBeach.name} by ${detectionData.droneName}. Please exit the water immediately!`,
          latitude: detectionData.latitude,
          longitude: detectionData.longitude,
          beachId: nearestBeach._id,
          alertLevel: 'high'
        });
        
        detection.alertSent = true;
        await detection.save();
        
        console.log('Shark detection processed and alerts sent');
      } catch (error) {
        console.error('Error sending alerts:', error.message);
      }
    }
  } catch (error) {
    console.error('Error processing shark detection:', error);
  }
}

// REST Endpoint for drones to report shark detections
app.post('/api/sharks/report', upload.single('image'), async (req, res) => {
  try {
    const { droneName, sharkType, size, latitude, longitude, accuracy, metadata, imageUrl: imageUrlFromBody, imageBase64 } = req.body;
    
    // Validate required fields
    if (!droneName || !sharkType || !size || !latitude || !longitude || !accuracy) {
      return res.status(400).json({ 
        error: 'Missing required fields: droneName, sharkType, size, latitude, longitude, accuracy' 
      });
    }
    
    // Generate unique detection ID
    const detectionId = `DET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare detection data
    // If imageBase64 is provided, decode and persist to disk
    let persistedImageUrl = null;
    try {
      if (imageBase64 && typeof imageBase64 === 'string') {
        // Strip possible data URL prefix
        const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        const uploadDir = path.join(__dirname, 'uploads', 'shark-images');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        persistedImageUrl = `/uploads/shark-images/${filename}`;
      }
    } catch (imgErr) {
      console.error('Failed to persist base64 image:', imgErr.message);
    }

    const detectionData = {
      detectionId,
      droneName,
      sharkType,
      size,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: parseFloat(accuracy),
      imageUrl: req.file ? `/uploads/shark-images/${req.file.filename}` : (persistedImageUrl || imageUrlFromBody || null),
      metadata: metadata ? JSON.parse(metadata) : {},
      timestamp: new Date().toISOString()
    };
    
    // Send to Kafka topic (if available) or process directly
    try {
      await producer.send({
        topic: 'shark-detections',
        messages: [{
          key: detectionId,
          value: JSON.stringify(detectionData)
        }]
      });
    } catch (kafkaError) {
      console.log('Kafka not available, processing detection directly:', kafkaError.message);
      // Process detection directly if Kafka is not available
      await processSharkDetection(detectionData);
    }
    
    res.json({
      success: true,
      message: 'Shark detection reported successfully',
      detectionId,
      data: detectionData
    });
    
  } catch (error) {
    console.error('Error reporting shark detection:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get shark detections with time filtering
app.get('/api/sharks/detections', async (req, res) => {
  try {
    const { 
      limit = 50, 
      beachName, 
      droneName,
      sharkType,
      timeFilter = 'all' // '12h', '2d', '5d', 'all'
    } = req.query;
    
    // Build query
    const query = {};
    
    if (beachName) query.beachName = beachName;
    if (droneName) query.droneName = droneName;
    if (sharkType) query.sharkType = sharkType;
    
    // Apply time filter
    if (timeFilter !== 'all') {
      let hoursBack;
      switch (timeFilter) {
        case '12h':
          hoursBack = 12;
          break;
        case '2d':
          hoursBack = 48;
          break;
        case '5d':
          hoursBack = 120;
          break;
        default:
          hoursBack = 24;
      }
      
      query.detectionDate = {
        $gte: new Date(Date.now() - hoursBack * 60 * 60 * 1000)
      };
    }
    
    const detections = await SharkDetection
      .find(query)
      .sort({ detectionDate: -1 })
      .limit(parseInt(limit));
    
    res.json(detections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get detection by ID
app.get('/api/sharks/detections/:detectionId', async (req, res) => {
  try {
    const { detectionId } = req.params;
    
    const detection = await SharkDetection.findOne({ detectionId });
    
    if (!detection) {
      return res.status(404).json({ error: 'Detection not found' });
    }
    
    res.json(detection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get shark detection statistics
app.get('/api/sharks/stats', async (req, res) => {
  try {
    const { timeFilter = 'all' } = req.query;
    
    let timeQuery = {};
    if (timeFilter !== 'all') {
      let hoursBack;
      switch (timeFilter) {
        case '12h':
          hoursBack = 12;
          break;
        case '2d':
          hoursBack = 48;
          break;
        case '5d':
          hoursBack = 120;
          break;
        default:
          hoursBack = 24;
      }
      
      timeQuery.detectionDate = {
        $gte: new Date(Date.now() - hoursBack * 60 * 60 * 1000)
      };
    }
    
    const totalDetections = await SharkDetection.countDocuments(timeQuery);
    const alertsSent = await SharkDetection.countDocuments({ ...timeQuery, alertSent: true });
    
    // Group by shark type
    const sharkTypeStats = await SharkDetection.aggregate([
      { $match: timeQuery },
      { $group: { _id: '$sharkType', count: { $sum: 1 } } }
    ]);
    
    // Group by drone
    const droneStats = await SharkDetection.aggregate([
      { $match: timeQuery },
      { $group: { _id: '$droneName', count: { $sum: 1 } } }
    ]);
    
    // Group by beach
    const beachStats = await SharkDetection.aggregate([
      { $match: timeQuery },
      { $group: { _id: '$beachName', count: { $sum: 1 } } }
    ]);
    
    res.json({
      totalDetections,
      alertsSent,
      sharkTypeStats,
      droneStats,
      beachStats,
      timeFilter
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify detection (admin function)
app.put('/api/sharks/detections/:detectionId/verify', async (req, res) => {
  try {
    const { detectionId } = req.params;
    const { isVerified } = req.body;
    
    const detection = await SharkDetection.findOneAndUpdate(
      { detectionId },
      { isVerified },
      { new: true }
    );
    
    if (!detection) {
      return res.status(404).json({ error: 'Detection not found' });
    }
    
    res.json(detection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'shark-detection-service',
    kafka: producer ? 'connected' : 'disconnected'
  });
});

// Initialize services
async function startServices() {
  try {
    // Try to initialize Kafka, but don't fail if it's not available
    try {
      await initializeKafka();
      await initializeConsumer();
      console.log('Kafka integration enabled');
    } catch (kafkaError) {
      console.log('Kafka not available, running without Kafka integration:', kafkaError.message);
    }
    
    app.listen(PORT, () => {
      console.log(`Shark Detection Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start services:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await producer.disconnect();
  await consumer.disconnect();
  process.exit(0);
});

startServices();