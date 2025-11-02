const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8002;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sharkdetection', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// CAMARA Geofencing API client
async function createCamaraGeofenceSubscription(phoneNumber, beach) {
  // Mock the CAMARA API response since there's no server to host it
  // In production, this would make a real API call to:
  // POST /subscriptions on the CAMARA geofencing service
  const subscriptionPayload = {
    device: {
      phoneNumber: phoneNumber
    },
    area: {
      areaType: 'CIRCLE',
      center: {
        latitude: beach.location.latitude,
        longitude: beach.location.longitude
      },
      radius: beach.radius
    },
    types: [
      'org.camaraproject.geofencing-subscriptions.v0.area-entered',
      'org.camaraproject.geofencing-subscriptions.v0.area-left'
    ],
    sink: process.env.CAMARA_CALLBACK_URL || 'http://localhost:8004/api/camara/geofencing-callback',
    protocol: 'HTTP',
    config: {
      subscriptionDetail: {
        initialEvent: false,
        subscriptionMaxEvents: 100,
        subscriptionExpireTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      }
    }
  };
  
  // Mock 201 response for now
  console.log('📡 CAMARA Geofencing Subscription (mocked):', JSON.stringify(subscriptionPayload, null, 2));
  
  // In production, this would be:
  // const response = await axios.post('http://camara-geofencing-service/subscriptions', subscriptionPayload);
  // return response.data;
  
  return {
    status: 201,
    data: {
      subscriptionId: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      subscriptionExpireTime: subscriptionPayload.config.subscriptionDetail.subscriptionExpireTime
    }
  };
}

// Helper to fetch beach details from user service
async function fetchBeachDetails(beachId) {
  try {
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:8001';
    const response = await axios.get(`${userServiceUrl}/api/beaches`, { timeout: 5000 });
    const beaches = response.data;
    return beaches.find(b => b._id.toString() === beachId.toString());
  } catch (error) {
    console.error('Error fetching beach details:', error.message);
    return null;
  }
}

// Device Schema (now used for subscribers)
const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Made optional for admin-only access
  deviceType: { type: String, enum: ['smartwatch', 'fitness_band', 'phone', 'smartphone'], required: true },
  deviceName: { type: String, required: true },
  simCardNumber: { type: String, required: true },
  batteryLevel: { type: Number, min: 0, max: 100, default: 100 },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  subscribedBeaches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Beach' }],
  settings: {
    alertSound: { type: Boolean, default: true },
    vibration: { type: Boolean, default: true },
    locationTracking: { type: Boolean, default: true },
    emergencyMode: { type: Boolean, default: false }
  },
  // New subscriber fields
  phoneNumber: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  imei: { type: String, required: true, unique: true },
  imsi: { type: String, required: true, unique: true },
  phoneModel: { type: String, required: true },
  lastKnownLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    timestamp: { type: Date, default: Date.now }
  },
  geofencingSubscribed: { type: Boolean, default: false },
  subscribedGeofences: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Geofence' }],
  alertsSent: { type: Number, default: 0 },
  lastAlertSent: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Device = mongoose.model('Device', deviceSchema);

// Device Location Schema
const deviceLocationSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number },
    altitude: { type: Number }
  },
  timestamp: { type: Date, default: Date.now },
  isInWater: { type: Boolean, default: false },
  waterDepth: { type: Number },
  heartRate: { type: Number },
  temperature: { type: Number }
});

const DeviceLocation = mongoose.model('DeviceLocation', deviceLocationSchema);

// Routes

// Register new subscriber (device)
app.post('/api/devices/register', async (req, res) => {
  try {
    const { 
      deviceId, 
      userId, 
      deviceType, 
      deviceName, 
      simCardNumber, 
      subscribedBeaches = [],
      // New subscriber fields
      phoneNumber,
      fullName,
      imei,
      imsi,
      phoneModel,
      lastKnownLocation
    } = req.body;
    
    // Check if device already exists
    const existingDevice = await Device.findOne({ 
      $or: [
        { deviceId },
        { phoneNumber },
        { imei },
        { imsi }
      ]
    });
    if (existingDevice) {
      return res.status(400).json({ error: 'Subscriber already registered' });
    }
    
    const device = new Device({
      deviceId,
      userId, // Optional for admin-only access
      deviceType,
      deviceName,
      simCardNumber,
      subscribedBeaches,
      phoneNumber,
      fullName,
      imei,
      imsi,
      phoneModel,
      lastKnownLocation
    });
    
    await device.save();
    
    // Create CAMARA geofencing subscriptions for each beach
    if (subscribedBeaches.length > 0 && phoneNumber) {
      for (const beachId of subscribedBeaches) {
        try {
          const beach = await fetchBeachDetails(beachId);
          if (beach) {
            const camaraResponse = await createCamaraGeofenceSubscription(phoneNumber, beach);
            console.log(`✅ CAMARA subscription created for ${beach.name}:`, camaraResponse.data.subscriptionId);
          }
        } catch (error) {
          console.error('⚠️ CAMARA subscription failed for beach:', error.message);
          // Continue even if CAMARA call fails
        }
      }
    }
    
    res.status(201).json({
      message: 'Subscriber registered successfully',
      device: {
        id: device._id,
        deviceId: device.deviceId,
        phoneNumber: device.phoneNumber,
        fullName: device.fullName,
        phoneModel: device.phoneModel,
        deviceType: device.deviceType,
        deviceName: device.deviceName,
        imei: device.imei,
        imsi: device.imsi,
        isOnline: device.isOnline,
        batteryLevel: device.batteryLevel,
        lastSeen: device.lastSeen,
        subscribedBeaches: device.subscribedBeaches,
        geofencingSubscribed: device.geofencingSubscribed,
        alertsSent: device.alertsSent,
        createdAt: device.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update device location
app.post('/api/devices/:deviceId/location', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { 
      latitude, 
      longitude, 
      accuracy, 
      altitude, 
      isInWater, 
      waterDepth, 
      heartRate, 
      temperature 
    } = req.body;
    
    // Find device
    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Update device online status
    device.isOnline = true;
    device.lastSeen = new Date();
    await device.save();
    
    // Save location data
    const deviceLocation = new DeviceLocation({
      deviceId,
      userId: device.userId,
      location: { latitude, longitude, accuracy, altitude },
      isInWater,
      waterDepth,
      heartRate,
      temperature
    });
    
    await deviceLocation.save();
    
    // Check geofence status
    try {
      const geofenceResponse = await axios.post('http://geofence-service:8003/api/geofences/check-location', {
        deviceId,
        userId: device.userId,
        latitude,
        longitude
      });
      
      res.json({
        message: 'Location updated successfully',
        location: {
          latitude,
          longitude,
          timestamp: deviceLocation.timestamp,
          isInWater,
          heartRate,
          temperature
        },
        geofenceStatus: geofenceResponse.data
      });
    } catch (error) {
      console.error('Error checking geofence:', error.message);
      res.json({
        message: 'Location updated successfully',
        location: {
          latitude,
          longitude,
          timestamp: deviceLocation.timestamp,
          isInWater,
          heartRate,
          temperature
        }
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all devices
app.get('/api/devices', async (req, res) => {
  try {
    const devices = await Device.find({});
    
    res.json(devices.map(device => ({
      id: device._id,
      deviceId: device.deviceId,
      userId: device.userId,
      deviceType: device.deviceType,
      deviceName: device.deviceName,
      simCardNumber: device.simCardNumber,
      batteryLevel: device.batteryLevel,
      isOnline: device.isOnline,
      lastSeen: device.lastSeen,
      subscribedBeaches: device.subscribedBeaches,
      settings: device.settings,
      // New subscriber fields
      phoneNumber: device.phoneNumber,
      fullName: device.fullName,
      imei: device.imei,
      imsi: device.imsi,
      phoneModel: device.phoneModel,
      lastKnownLocation: device.lastKnownLocation,
      geofencingSubscribed: device.geofencingSubscribed,
      subscribedGeofences: device.subscribedGeofences,
      alertsSent: device.alertsSent,
      lastAlertSent: device.lastAlertSent,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get device statistics (must be before /api/devices/:deviceId)
app.get('/api/devices/stats', async (req, res) => {
  try {
    console.log('📊 Getting device statistics');
    const totalDevices = await Device.countDocuments();
    const onlineDevices = await Device.countDocuments({ isOnline: true });
    const lowBatteryDevices = await Device.countDocuments({ batteryLevel: { $lt: 20 } });
    
    console.log(`📊 Stats: total=${totalDevices}, online=${onlineDevices}, lowBattery=${lowBatteryDevices}`);
    
    res.json({
      totalDevices,
      onlineDevices,
      lowBatteryDevices
    });
  } catch (error) {
    console.error('❌ Error getting device stats:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get device information
app.get('/api/devices/:deviceId', async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.deviceId })
      .populate('userId')
      .populate('subscribedBeaches');
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json({
      id: device._id,
      deviceId: device.deviceId,
      deviceType: device.deviceType,
      deviceName: device.deviceName,
      simCardNumber: device.simCardNumber,
      batteryLevel: device.batteryLevel,
      isOnline: device.isOnline,
      lastSeen: device.lastSeen,
      subscribedBeaches: device.subscribedBeaches,
      settings: device.settings,
      user: {
        id: device.userId._id,
        name: device.userId.name,
        email: device.userId.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's devices
app.get('/api/devices/user/:userId', async (req, res) => {
  try {
    const devices = await Device.find({ userId: req.params.userId });
    
    res.json(devices.map(device => ({
      id: device._id,
      deviceId: device.deviceId,
      deviceType: device.deviceType,
      deviceName: device.deviceName,
      batteryLevel: device.batteryLevel,
      isOnline: device.isOnline,
      lastSeen: device.lastSeen,
      subscribedBeaches: device.subscribedBeaches,
      settings: device.settings
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update device settings
app.put('/api/devices/:deviceId/settings', async (req, res) => {
  try {
    const { settings } = req.body;
    
    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      { 
        settings: { ...device.settings, ...settings },
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json({
      message: 'Device settings updated successfully',
      settings: device.settings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subscribe device to beach
app.post('/api/devices/:deviceId/subscribe-beach', async (req, res) => {
  try {
    const { beachId } = req.body;
    
    const device = await Device.findOne({ deviceId: req.params.deviceId });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Check if already subscribed
    if (device.subscribedBeaches.includes(beachId)) {
      return res.json({ message: 'Already subscribed to this beach' });
    }
    
    // Fetch beach details for CAMARA API
    const beach = await fetchBeachDetails(beachId);
    if (!beach) {
      return res.status(404).json({ error: 'Beach not found' });
    }
    
    // Create CAMARA geofencing subscription
    try {
      const camaraResponse = await createCamaraGeofenceSubscription(device.phoneNumber, beach);
      console.log('✅ CAMARA subscription created:', camaraResponse.data.subscriptionId);
    } catch (error) {
      console.error('⚠️ CAMARA subscription failed (continuing with local subscription):', error.message);
      // Continue with local subscription even if CAMARA call fails
    }
    
    // Add beach to device's subscribed beaches
    device.subscribedBeaches.push(beachId);
    await device.save();
    
    res.json({ message: 'Successfully subscribed to beach' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unsubscribe device from beach
app.delete('/api/devices/:deviceId/subscribe-beach/:beachId', async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.deviceId });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    device.subscribedBeaches = device.subscribedBeaches.filter(
      beachId => beachId.toString() !== req.params.beachId
    );
    
    await device.save();
    
    res.json({ message: 'Successfully unsubscribed from beach' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get device location history
app.get('/api/devices/:deviceId/locations', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const locations = await DeviceLocation
      .find({ deviceId: req.params.deviceId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update battery level
app.put('/api/devices/:deviceId/battery', async (req, res) => {
  try {
    const { batteryLevel } = req.body;
    
    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      { 
        batteryLevel,
        lastSeen: new Date(),
        isOnline: true
      },
      { new: true }
    );
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json({
      message: 'Battery level updated',
      batteryLevel: device.batteryLevel,
      lastSeen: device.lastSeen
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'device-service' });
});

app.listen(PORT, () => {
  console.log(`Device Service running on port ${PORT}`);
});
