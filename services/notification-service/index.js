const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const axios = require('axios');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8004;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sharkdetection', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Notification Schema
const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deviceId: { type: String },
  beachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Beach' },
  geofenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Geofence' },
  location: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  alertLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  isRead: { type: Boolean, default: false },
  sentAt: { type: Date, default: Date.now },
  readAt: { type: Date }
});

const Notification = mongoose.model('Notification', notificationSchema);

// Device Schema
const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deviceType: { type: String, enum: ['smartwatch', 'fitness_band', 'phone'], default: 'smartwatch' },
  fcmToken: { type: String },
  isActive: { type: Boolean, default: true },
  subscribedBeaches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Beach' }],
  createdAt: { type: Date, default: Date.now }
});

const Device = mongoose.model('Device', deviceSchema);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected to notification service:', socket.id);
  
  socket.on('subscribe-user', (data) => {
    socket.join(`user-${data.userId}`);
    console.log(`Client ${socket.id} subscribed to user notifications: ${data.userId}`);
  });
  
  socket.on('subscribe-beach', (data) => {
    socket.join(`beach-${data.beachId}`);
    console.log(`Client ${socket.id} subscribed to beach notifications: ${data.beachId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected from notification service:', socket.id);
  });
});

// Routes

// Send notification
app.post('/api/notifications/send', async (req, res) => {
  try {
    const { 
      type, 
      title, 
      message, 
      userId, 
      deviceId, 
      beachId, 
      geofenceId, 
      latitude, 
      longitude, 
      alertLevel 
    } = req.body;
    
    // Create notification record
    const notification = new Notification({
      type,
      title,
      message,
      userId,
      deviceId,
      beachId,
      geofenceId,
      location: latitude && longitude ? { latitude, longitude } : undefined,
      alertLevel
    });
    
    await notification.save();
    
    // If beachId is provided, send to all users subscribed to that beach
    if (beachId) {
      const devices = await Device.find({ 
        subscribedBeaches: beachId,
        isActive: true 
      }).populate('userId');
      
      for (const device of devices) {
        // Send WebSocket notification
        io.to(`user-${device.userId._id}`).emit('notification', {
          id: notification._id,
          type,
          title,
          message,
          alertLevel,
          location: notification.location,
          timestamp: notification.sentAt
        });
        
        // Send push notification (simulated)
        if (device.fcmToken) {
          console.log(`Sending push notification to device ${device.deviceId}: ${title}`);
          // In a real implementation, you would send to FCM here
        }
      }
      
      res.json({
        message: 'Notification sent successfully',
        notification: {
          id: notification._id,
          type,
          title,
          message,
          alertLevel,
          sentAt: notification.sentAt
        },
        recipients: devices.length
      });
    } else if (userId) {
      // Send to specific user
      io.to(`user-${userId}`).emit('notification', {
        id: notification._id,
        type,
        title,
        message,
        alertLevel,
        location: notification.location,
        timestamp: notification.sentAt
      });
      
      res.json({
        message: 'Notification sent successfully',
        notification: {
          id: notification._id,
          type,
          title,
          message,
          alertLevel,
          sentAt: notification.sentAt
        }
      });
    } else {
      res.status(400).json({ error: 'Either userId or beachId must be provided' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user notifications
app.get('/api/notifications/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, unreadOnly = false } = req.query;
    
    const query = { userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    const notifications = await Notification
      .find(query)
      .sort({ sentAt: -1 })
      .limit(parseInt(limit));
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register device for notifications
app.post('/api/notifications/register-device', async (req, res) => {
  try {
    const { deviceId, userId, deviceType, fcmToken, subscribedBeaches } = req.body;
    
    const device = new Device({
      deviceId,
      userId,
      deviceType,
      fcmToken,
      subscribedBeaches: subscribedBeaches || []
    });
    
    await device.save();
    
    res.json({
      message: 'Device registered successfully',
      device: {
        id: device._id,
        deviceId: device.deviceId,
        deviceType: device.deviceType,
        subscribedBeaches: device.subscribedBeaches
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Device already registered' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Update device subscriptions
app.put('/api/notifications/device/:deviceId/subscriptions', async (req, res) => {
  try {
    const { subscribedBeaches } = req.body;
    
    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      { subscribedBeaches },
      { new: true }
    );
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json({
      message: 'Device subscriptions updated',
      device: {
        id: device._id,
        deviceId: device.deviceId,
        subscribedBeaches: device.subscribedBeaches
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notification statistics
app.get('/api/notifications/stats', async (req, res) => {
  try {
    const totalNotifications = await Notification.countDocuments();
    const unreadNotifications = await Notification.countDocuments({ isRead: false });
    const highAlertNotifications = await Notification.countDocuments({ alertLevel: 'high' });
    const registeredDevices = await Device.countDocuments({ isActive: true });
    
    res.json({
      totalNotifications,
      unreadNotifications,
      highAlertNotifications,
      registeredDevices
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'notification-service' });
});

server.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});

module.exports = { app, io };
