const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8003;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sharkdetection', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Geofence Schema
const geofenceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  center: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  radius: { type: Number, required: true }, // in meters
  beachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Beach' },
  isActive: { type: Boolean, default: true },
  alertLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) } // 24 hours
});

const Geofence = mongoose.model('Geofence', geofenceSchema);

// Device Location Schema
const deviceLocationSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  timestamp: { type: Date, default: Date.now },
  isInGeofence: { type: Boolean, default: false },
  currentGeofence: { type: mongoose.Schema.Types.ObjectId, ref: 'Geofence' }
});

const DeviceLocation = mongoose.model('DeviceLocation', deviceLocationSchema);

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// Routes

// Create geofence
app.post('/api/geofences', async (req, res) => {
  try {
    const { name, latitude, longitude, radius, beachId, alertLevel } = req.body;
    
    const geofence = new Geofence({
      name,
      center: { latitude, longitude },
      radius,
      beachId,
      alertLevel
    });
    
    await geofence.save();
    
    res.status(201).json({
      message: 'Geofence created successfully',
      geofence: {
        id: geofence._id,
        name: geofence.name,
        center: geofence.center,
        radius: geofence.radius,
        alertLevel: geofence.alertLevel,
        isActive: geofence.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all active geofences
app.get('/api/geofences', async (req, res) => {
  try {
    const geofences = await Geofence.find({ isActive: true });
    res.json(geofences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update device location and check geofence
app.post('/api/geofences/check-location', async (req, res) => {
  try {
    const { deviceId, userId, latitude, longitude } = req.body;
    
    // Save device location
    const deviceLocation = new DeviceLocation({
      deviceId,
      userId,
      location: { latitude, longitude }
    });
    
    // Check if device is in any active geofence
    const geofences = await Geofence.find({ isActive: true });
    let currentGeofence = null;
    let isInGeofence = false;
    
    for (const geofence of geofences) {
      const distance = calculateDistance(
        latitude, longitude,
        geofence.center.latitude, geofence.center.longitude
      );
      
      if (distance <= geofence.radius) {
        currentGeofence = geofence._id;
        isInGeofence = true;
        break;
      }
    }
    
    deviceLocation.isInGeofence = isInGeofence;
    deviceLocation.currentGeofence = currentGeofence;
    
    await deviceLocation.save();
    
    res.json({
      isInGeofence,
      currentGeofence,
      location: deviceLocation.location,
      timestamp: deviceLocation.timestamp
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get device location history
app.get('/api/geofences/device/:deviceId/locations', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 50 } = req.query;
    
    const locations = await DeviceLocation
      .find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('currentGeofence');
    
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deactivate geofence
app.put('/api/geofences/:id/deactivate', async (req, res) => {
  try {
    const geofence = await Geofence.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!geofence) {
      return res.status(404).json({ error: 'Geofence not found' });
    }
    
    res.json({ message: 'Geofence deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get geofence statistics
app.get('/api/geofences/stats', async (req, res) => {
  try {
    const totalGeofences = await Geofence.countDocuments();
    const activeGeofences = await Geofence.countDocuments({ isActive: true });
    const devicesInGeofences = await DeviceLocation.countDocuments({ isInGeofence: true });
    
    res.json({
      totalGeofences,
      activeGeofences,
      devicesInGeofences
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'geofence-service' });
});

app.listen(PORT, () => {
  console.log(`Geofence Service running on port ${PORT}`);
});
