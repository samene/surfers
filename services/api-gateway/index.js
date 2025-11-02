const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { Server } = require('socket.io');
const http = require('http');
require('dotenv').config();

const app = express();
// Increase body size limit to handle base64 images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Service URLs
const services = {
  user: process.env.USER_SERVICE_URL || 'http://user-service:8001',
  device: process.env.DEVICE_SERVICE_URL || 'http://device-service:8002',
  geofence: process.env.GEOFENCE_SERVICE_URL || 'http://geofence-service:8003',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:8004',
  sharkDetection: process.env.SHARK_DETECTION_SERVICE_URL || 'http://shark-detection-service:8005',
  drone: process.env.DRONE_SERVICE_URL || 'http://drone-service:8006'
};

// Direct API calls for user service (bypassing proxy middleware)
app.use('/api/users', async (req, res) => {
  try {
    const axios = require('axios');
    const url = `${services.user}/api/users${req.url === '/' ? '' : req.url}`;
    console.log('Direct call to user service:', req.method, url);
    
    const response = await axios({
      method: req.method,
      url: url,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      timeout: 30000
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('User service error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Service unavailable' });
    }
  }
});

// Direct API calls for beaches (also handled by user service)
app.use('/api/beaches', async (req, res) => {
  try {
    const axios = require('axios');
    const url = `${services.user}/api/beaches${req.url === '/' ? '' : req.url}`;
    console.log('Direct call to beaches:', req.method, url);
    
    const response = await axios({
      method: req.method,
      url: url,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      timeout: 30000
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Beaches service error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Service unavailable' });
    }
  }
});

// Direct API calls for devices
app.use('/api/devices', async (req, res) => {
  try {
    const axios = require('axios');
    const url = `${services.device}/api/devices${req.url === '/' ? '' : req.url}`;
    console.log('Direct call to device service:', req.method, url);
    
    const response = await axios({
      method: req.method,
      url: url,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      timeout: 30000
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Device service error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Service unavailable' });
    }
  }
});

// Direct API calls for geofences
app.use('/api/geofences', async (req, res) => {
  try {
    const axios = require('axios');
    const url = `${services.geofence}/api/geofences${req.url === '/' ? '' : req.url}`;
    console.log('Direct call to geofence service:', req.method, url);
    
    const response = await axios({
      method: req.method,
      url: url,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      timeout: 30000
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Geofence service error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Service unavailable' });
    }
  }
});

// Direct API calls for drones
app.use('/api/drones', async (req, res) => {
  try {
    const axios = require('axios');
    
    // Handle stats endpoint separately
    if (req.url === '/stats') {
      const url = `${services.drone}/api/drones/stats`;
      console.log('Direct call to drone service:', req.method, url);
      
      const response = await axios({
        method: req.method,
        url: url,
        data: req.body,
        headers: {
          'Content-Type': 'application/json',
          ...req.headers
        },
        timeout: 30000
      });
      
      res.status(response.status).json(response.data);
      return;
    }
    
    const url = `${services.drone}/api/drones${req.url === '/' ? '' : req.url}`;
    console.log('Direct call to drone service:', req.method, url);
    
    const response = await axios({
      method: req.method,
      url: url,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      timeout: 30000
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Drone service error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Service unavailable' });
    }
  }
});

// Direct API calls for shark detection service
app.use('/api/sharks', async (req, res) => {
  try {
    const axios = require('axios');
    const url = `${services.sharkDetection}/api/sharks${req.url === '/' ? '' : req.url}`;
    console.log('Direct call to shark detection service:', req.method, url);
    
    const response = await axios({
      method: req.method,
      url: url,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      timeout: 30000
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Shark detection service error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Service unavailable' });
    }
  }
});

// Serve uploaded images from shark-detection-service through the gateway
app.use('/uploads', async (req, res) => {
  try {
    const axios = require('axios');
    const url = `${services.sharkDetection}${req.originalUrl}`; // preserve /uploads/...
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
      timeout: 30000
    });
    // Forward content headers
    Object.entries(response.headers).forEach(([k, v]) => {
      if (k.toLowerCase().startsWith('content-')) {
        res.setHeader(k, v);
      }
    });
    response.data.pipe(res);
  } catch (error) {
    console.error('Uploads proxy error:', error.message);
    if (error.response) {
      res.status(error.response.status).end();
    } else {
      res.status(500).end();
    }
  }
});

app.use('/api/notifications', createProxyMiddleware({
  target: services.notification,
  changeOrigin: true,
  timeout: 10000,
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Service unavailable' });
  }
}));

app.use('/api/sharks', createProxyMiddleware({
  target: services.sharkDetection,
  changeOrigin: true,
  timeout: 10000,
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Service unavailable' });
  }
}));

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('subscribe', (data) => {
    socket.join(data.room);
    console.log(`Client ${socket.id} subscribed to room: ${data.room}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: Object.keys(services)
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'API Gateway is working' });
});

// Test user service connectivity
app.get('/test-user-service', async (req, res) => {
  try {
    const axios = require('axios');
    const response = await axios.get(`${services.user}/health`, { timeout: 5000 });
    res.json({ 
      message: 'User service is accessible', 
      status: response.data,
      serviceUrl: services.user
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'User service not accessible', 
      message: error.message,
      serviceUrl: services.user
    });
  }
});

// Test user service registration directly
app.post('/test-register', async (req, res) => {
  try {
    const axios = require('axios');
    const response = await axios.post(`${services.user}/api/users/register`, req.body, { 
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
    res.json({ 
      message: 'Registration successful via direct call', 
      data: response.data,
      serviceUrl: services.user
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Registration failed via direct call', 
      message: error.message,
      serviceUrl: services.user
    });
  }
});

// Broadcast notifications to connected clients
app.post('/broadcast', (req, res) => {
  const { room, message } = req.body;
  io.to(room).emit('notification', message);
  res.json({ success: true, message: 'Notification broadcasted' });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Available services:', Object.keys(services));
});

module.exports = { app, io };
