const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sharkdetection', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  subscribedBeaches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Beach' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Beach Schema
const beachSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  radius: { type: Number, default: 500 }, // meters
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Beach = mongoose.model('Beach', beachSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Routes

// Register new user
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, username, email, password, phone, emergencyContact } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = new User({
      name,
      username,
      email,
      password: hashedPassword,
      phone,
      emergencyContact
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login user
app.post('/api/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username or email
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
app.get('/api/users/profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('subscribedBeaches');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      emergencyContact: user.emergencyContact,
      subscribedBeaches: user.subscribedBeaches
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subscribe to beach
app.post('/api/users/:userId/subscribe-beach', async (req, res) => {
  try {
    const { beachId } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.subscribedBeaches.includes(beachId)) {
      user.subscribedBeaches.push(beachId);
      await user.save();
    }
    
    res.json({ message: 'Successfully subscribed to beach' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all beaches
app.get('/api/beaches', async (req, res) => {
  try {
    const beaches = await Beach.find({ isActive: true });
    res.json(beaches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create beach (admin function)
app.post('/api/beaches', async (req, res) => {
  try {
    const { name, latitude, longitude, radius } = req.body;
    
    const beach = new Beach({
      name,
      location: { latitude, longitude },
      radius: radius || 500
    });
    
    await beach.save();
    res.status(201).json(beach);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'user-service' });
});

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});
