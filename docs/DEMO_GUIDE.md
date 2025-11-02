# 🦈 Shark Detection System - Demo Guide

## 🎯 Hackathon Demo Overview

This MVP demonstrates a real-time shark detection and alert system for surfers using IoT devices, geofencing, and drone surveillance.

## 🏗️ Architecture Highlights

### Microservices Architecture
- **API Gateway**: Routes requests and handles WebSocket connections
- **User Service**: Manages surfer registration and authentication
- **Device Service**: Handles wearable device registration and tracking
- **Geofence Service**: Creates and manages geofenced zones around beaches
- **Notification Service**: Real-time alerts via WebSocket and push notifications
- **Shark Detection Service**: Simulates drone detection and triggers alerts

### Technology Stack
- **Backend**: Node.js, Express.js, MongoDB, Redis
- **Frontend**: React.js with Tailwind CSS
- **Real-time**: WebSocket, Socket.io
- **Maps**: React Leaflet with OpenStreetMap
- **Deployment**: Docker Compose

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js (for seeding data)

### 1. Start the System
```bash
# Clone and navigate to the project
cd shark-detection-system

# Start all services
npm run dev

# Wait for all services to be ready (about 2-3 minutes)
```

### 2. Seed Demo Data
```bash
# In a new terminal
npm run seed
```

### 3. Access the Application
- **Web Portal**: http://localhost:3000
- **API Gateway**: http://localhost:8000/health

## 🎭 Demo Scenarios

### Scenario 1: User Registration & Device Setup
1. **Register a new user**
   - Go to http://localhost:3000/register
   - Fill in user details and emergency contact
   - Login with the new account

2. **Register a wearable device**
   - Navigate to "Devices" page
   - Click "Add Device"
   - Enter device details (Device ID, Type, Name, SIM Card)
   - Subscribe to beaches for alerts

### Scenario 2: Beach Management & Geofencing
1. **View Beach Map**
   - Go to "Beach Map" page
   - See pre-loaded Sydney beaches (Bondi, Manly, Cronulla, etc.)
   - Select a beach from dropdown

2. **Create Geofence Zone**
   - Click "Create Geofence"
   - Click on map to set center point
   - Adjust radius (default 500m)
   - Confirm creation

3. **View Active Geofences**
   - See colored circles on map (red=high, orange=medium, green=low alert)
   - View geofence list with details

### Scenario 3: Shark Detection Simulation
1. **Simulate Shark Detection**
   - Go to "Detection Center" page
   - Click "Simulate Detection" button
   - Watch real-time alert generation

2. **View Detection Results**
   - See shark detection details (type, size, behavior, confidence)
   - View geofence creation around detection point
   - Check notification sending to subscribed devices

3. **Monitor System Stats**
   - View detection statistics
   - See shark type distribution
   - Monitor alert system status

### Scenario 4: Real-time Notifications
1. **Device Location Updates**
   - Simulate device entering geofenced area
   - Watch real-time geofence status updates

2. **Alert Broadcasting**
   - Shark detection triggers notifications
   - WebSocket connections receive real-time alerts
   - Multiple devices get notified simultaneously

## 🔧 Demo Accounts

### Pre-loaded Demo Users
- **Email**: john@example.com | **Password**: password
- **Email**: sarah@example.com | **Password**: password  
- **Email**: alex@example.com | **Password**: password

### Demo Beaches
- Bondi Beach (-33.8915, 151.2767)
- Manly Beach (-33.7969, 151.2843)
- Cronulla Beach (-34.0544, 151.1556)
- Coogee Beach (-33.9209, 151.2603)
- Maroubra Beach (-33.9500, 151.2594)

### Demo Devices
- Apple Watch Series 9 (DEVICE-001) - 85% battery
- Samsung Galaxy Watch 6 (DEVICE-002) - 72% battery
- Garmin Fenix 7 (DEVICE-003) - 45% battery

## 🎯 Key Features Demonstrated

### 1. **IoT Device Management**
- Device registration with 5G SIM cards
- Battery level monitoring
- Online/offline status tracking
- Beach subscription management

### 2. **Geofencing Technology**
- Interactive map with click-to-create geofences
- Real-time zone monitoring
- Distance calculations and boundary detection
- Visual geofence representation

### 3. **Shark Detection Simulation**
- AI-powered shark detection (simulated)
- Multiple shark types (white, tiger, bull)
- Size and behavior classification
- Confidence scoring

### 4. **Real-time Alert System**
- WebSocket-based notifications
- Multi-device alert broadcasting
- Emergency contact integration
- Alert level classification (high/medium/low)

### 5. **Microservices Architecture**
- Service separation and independence
- API gateway routing
- Database per service pattern
- Horizontal scalability

## 🔍 Technical Deep Dive

### API Endpoints
- `POST /api/users/register` - User registration
- `POST /api/devices/register` - Device registration
- `POST /api/geofences` - Create geofence
- `POST /api/sharks/simulate` - Simulate detection
- `POST /api/notifications/send` - Send alerts

### WebSocket Events
- `subscribe-user` - Subscribe to user notifications
- `subscribe-beach` - Subscribe to beach alerts
- `notification` - Receive real-time alerts

### Database Collections
- `users` - Surfer profiles and emergency contacts
- `devices` - Wearable device information
- `beaches` - Beach locations and settings
- `geofences` - Active geofenced zones
- `sharkdetections` - Detection records
- `notifications` - Alert history

## 🚨 Troubleshooting

### Common Issues
1. **Services not starting**: Check Docker is running
2. **Database connection errors**: Wait for MongoDB to fully initialize
3. **Map not loading**: Check internet connection for OpenStreetMap tiles
4. **WebSocket errors**: Ensure API Gateway is running on port 8000

### Useful Commands
```bash
# View service logs
npm run logs

# Restart specific service
docker-compose restart api-gateway

# Clean up everything
npm run clean

# Check service health
curl http://localhost:8000/health
```

## 🎪 Hackathon Presentation Tips

### 1. **Start with the Problem**
- Surfing safety concerns
- Shark attack statistics
- Need for real-time alerts

### 2. **Show the Solution**
- Live demo of device registration
- Interactive geofence creation
- Shark detection simulation

### 3. **Highlight Innovation**
- IoT + AI + Geofencing combination
- Real-time notification system
- Microservices scalability

### 4. **Demonstrate Impact**
- Multiple beaches covered
- Instant alert delivery
- Emergency contact integration

## 🔮 Future Enhancements

### Phase 2 Features
- Mobile app for surfers
- Machine learning shark detection
- Weather integration
- Social features (surfing groups)

### Scalability Considerations
- Kubernetes deployment
- Multi-region support
- Advanced analytics dashboard
- Integration with marine authorities

## 📞 Support

For demo issues or questions:
- Check the logs: `npm run logs`
- Restart services: `npm run dev`
- Clean restart: `npm run clean && npm run dev`

---

**Ready to demo? Start with: `npm run dev` and navigate to http://localhost:3000**
