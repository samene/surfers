const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8006;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sharkdetection', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Drone Schema
const droneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  range: { type: Number, required: true }, // in kilometers
  batteryCapacity: { type: Number, required: true }, // in mAh
  currentBatteryLevel: { type: Number, min: 0, max: 100, default: 100 },
  status: { 
    type: String, 
    enum: ['in_flight', 'charging', 'maintenance'], 
    default: 'charging' 
  },
  hdResolution: { type: String, required: true }, // e.g., "4K", "1080p"
  phoneNumber: { type: String, required: false, unique: true },
  imeiNumber: { type: String, required: true, unique: true },
  ipAddress: { type: String, required: true },
  flightTime: { type: Number, default: 0 }, // in minutes
  maxFlightTime: { type: Number, required: true }, // in minutes
  lastMaintenanceDate: { type: Date, default: Date.now },
  nextMaintenanceDate: { type: Date },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    altitude: { type: Number }
  },
  patrollingBeach: { type: String, required: true },
  sliceInfo: {
    sliceName: { type: String },
    latency: { type: String },
    bandwidth: { type: String },
    priority: { type: String },
    qosClass: { type: String },
    sliceId: { type: String },
    plmn: { type: String }
  },
  lastSharkDetection: {
    timestamp: { type: Date },
    location: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    confidence: { type: Number, min: 0, max: 100 },
    imageUrl: { type: String },
    sharkType: { type: String }
  },
  totalSharkDetections: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Drone = mongoose.model('Drone', droneSchema);

// Routes

// Get all drones
app.get('/api/drones', async (req, res) => {
  try {
    const drones = await Drone.find({}).sort({ createdAt: -1 });
    res.json(drones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get drone statistics
app.get('/api/drones/stats', async (req, res) => {
  try {
    const totalDrones = await Drone.countDocuments();
    const activeDrones = await Drone.countDocuments({ status: 'active' });
    const inFlightDrones = await Drone.countDocuments({ status: 'in_flight' });
    const totalSharkDetections = await Drone.aggregate([
      { $group: { _id: null, total: { $sum: '$totalSharkDetections' } } }
    ]);
    
    res.json({
      totalDrones,
      activeDrones,
      inFlightDrones,
      totalSharkDetections: totalSharkDetections[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get drone by ID
app.get('/api/drones/:id', async (req, res) => {
  try {
    const drone = await Drone.findById(req.params.id);
    if (!drone) {
      return res.status(404).json({ error: 'Drone not found' });
    }
    res.json(drone);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new drone
app.post('/api/drones', async (req, res) => {
  try {
    const {
      name,
      brand,
      model,
      range,
      batteryCapacity,
      hdResolution,
      imeiNumber,
      ipAddress,
      maxFlightTime
    } = req.body;

    const drone = new Drone({
      name,
      brand,
      model,
      range,
      batteryCapacity,
      hdResolution,
      imeiNumber,
      ipAddress,
      maxFlightTime
    });

    await drone.save();
    res.status(201).json({
      message: 'Drone created successfully',
      drone
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update drone status
app.put('/api/drones/:id/status', async (req, res) => {
  try {
    const { status, location, batteryLevel } = req.body;
    
    const updateData = { status };
    if (location) updateData.location = location;
    if (batteryLevel !== undefined) updateData.currentBatteryLevel = batteryLevel;
    
    const drone = await Drone.findByIdAndUpdate(
      req.params.id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );
    
    if (!drone) {
      return res.status(404).json({ error: 'Drone not found' });
    }
    
    res.json({
      message: 'Drone status updated successfully',
      drone
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record shark detection
app.post('/api/drones/:id/shark-detection', async (req, res) => {
  try {
    const { location, confidence, imageUrl, sharkType } = req.body;
    
    const sharkDetection = {
      timestamp: new Date(),
      location,
      confidence,
      imageUrl,
      sharkType
    };
    
    const drone = await Drone.findByIdAndUpdate(
      req.params.id,
      {
        lastSharkDetection: sharkDetection,
        $inc: { totalSharkDetections: 1 },
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!drone) {
      return res.status(404).json({ error: 'Drone not found' });
    }
    
    res.json({
      message: 'Shark detection recorded successfully',
      drone
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'drone-service' });
});

app.listen(PORT, () => {
  console.log(`Drone Service running on port ${PORT}`);
});
