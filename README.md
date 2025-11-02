# 🌊 Surfers. 🦈

<div align="center">

**AI-Powered Shark Alerts Powered by 5G Network Slicing**

[![5G](https://img.shields.io/badge/5G-Network%20Slicing-green)](https://www.nokia.com/networks/5g/)
[![CAMARA](https://img.shields.io/badge/CAMARA-API%20Integration-blue)](https://camaraproject.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.0-blue)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-brightgreen)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue)](https://www.docker.com/)

*Real-Time Shark Detection and Alert System for Australian Beaches*

</div>

---

## 🎯 Overview

**Surfers.** is an **AI-powered** shark detection system leveraging **5G network slicing** and **CAMARA APIs** (Linux Foundation open source project) to provide proactive shark detection alerts to beachgoers. The system integrates **AI-driven drone surveillance** with **5G network capabilities** to enable surfers and other beach visitors to receive timely alerts when sharks are detected in their vicinity.

### Key Features

✨ **AI-Powered Detection** - Advanced drone surveillance with real-time shark detection  
📡 **5G Network Slicing** - Ultra-low latency video streaming via dedicated network slices  
📍 **Smart Geofencing** - Automatic location tracking via CAMARA Geofencing API (Linux Foundation)  
🚨 **Real-Time Alerts** - Instant push notifications based on proximity and geofence entry  
🌐 **Multi-Device Support** - Smartwatch, phone, and fitness band compatibility  
🗺️ **Interactive Maps** - Real-time visualization of beaches, geofences, and detections  
📊 **Comprehensive Dashboard** - Live metrics, 5G slice monitoring, and detection analytics  

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Admin Web Portal (React)                      │
│                  ┌─────────────────────────────────┐               │
│                  │  User Management                │               │
│                  │  Beach & Geofence Management    │               │
│                  │  Dashboard & Analytics           │               │
│                  └─────────────────────────────────┘               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                          Mobile App (React)                         │
│                  ┌─────────────────────────────────┐               │
│                  │  Device Registration            │               │
│                  │  Beach Subscription             │               │
│                  │  Alert Reception               │               │
│                  └─────────────────────────────────┘               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │    API Gateway       │
                    │    (Port 8000)      │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼────────┐  ┌─────────▼──────────┐  ┌───────▼─────────┐
│  User Service  │  │  Device Service    │  │ Geofence Service│
│   (8001)       │  │   (8002)           │  │    (8003)       │
└────────────────┘  └────────────────────┘  └─────────────────┘
        │                      │                      │
        │            ┌─────────▼──────────┐           │
        │            │ Notification Svc   │           │
        │            │   (8004)           │           │
        │            └─────────┬──────────┘           │
        │                      │                      │
        │            ┌─────────▼──────────┐           │
        │            │ Shark Detection    │           │
        │            │    (8005)          │           │
        │            └─────────┬──────────┘           │
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   MongoDB Database  │
                    └─────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼────────┐  ┌─────────▼──────────┐  ┌───────▼─────────┐
│  CAMARA        │  │ CAMARA Location    │  │ Quality on Demand│
│  Geofencing    │  │ Retrieval API      │  │  (5G Slice) API  │
│  API           │  │                   │  │                  │
└────────────────┘  └────────────────────┘  └─────────────────┘
```

### Architecture Flow

1. **Admin Setup**: Creates beaches and geofences → Saved to MongoDB
2. **User Subscription**: Mobile app registers → Backend subscribes to CAMARA API with callback URL
3. **Geofence Entry**: User enters geofence → CAMARA sends callback → Backend tracks location
4. **Shark Detection**: Drone detects shark → Requests 5G slice → Streams video → Finds users in geofences → Sends alerts

For detailed architecture diagrams and flow explanations, see **[Architecture Documentation](docs/ARCHITECTURE.md)**.

---

## 🔧 Microservices

The system is built using a **microservices architecture** with 7 backend services:

| Service | Port | Description |
|---------|------|-------------|
| **API Gateway** | 8000 | Central entry point for all API requests, request routing, and authentication |
| **User Service** | 8001 | User authentication, registration, and beach management |
| **Device Service** | 8002 | Device registration, CAMARA API subscription management, and location tracking |
| **Geofence Service** | 8003 | Geofence CRUD operations, location checking, and geofence analytics |
| **Notification Service** | 8004 | Real-time push notifications, WebSocket connections, and alert broadcasting |
| **Shark Detection Service** | 8005 | Shark detection processing, 5G slice requests, and alert triggering |
| **Drone Service** | 8006 | Drone fleet management, status tracking, and maintenance scheduling |

### Service Responsibilities

#### 🌐 API Gateway (Port 8000)
- Routes requests to appropriate microservices
- Handles authentication and authorization
- Manages WebSocket connections
- Provides unified API endpoint

#### 👤 User Service (Port 8001)
- User registration and authentication (JWT-based)
- Beach creation and management (latitude, longitude, name)
- User profile management
- Emergency contact management

#### 📱 Device Service (Port 8002)
- Device registration (smartwatch, phone, fitness band)
- CAMARA Geofencing API integration (Linux Foundation open source project)
- Device location tracking
- Subscriber management (phone number, IMEI, IMSI)
- Beach subscription management

#### 📍 Geofence Service (Port 8003)
- Geofence creation (center point + radius)
- Real-time location checking
- Geofence-to-beach associations
- Geofence entry/exit tracking
- Distance calculations

#### 🔔 Notification Service (Port 8004)
- Real-time push notifications via WebSocket
- Push notification delivery (FCM integration)
- Notification history and read status
- Device subscription management
- Alert broadcasting to subscribed users

#### 🦈 Shark Detection Service (Port 8005)
- Receives shark detection reports from drones
- Integrates with CAMARA Location Retrieval API
- Requests dedicated 5G network slices via Quality on Demand API
- Coordinates video streaming from drones
- Identifies users in nearby geofences
- Triggers alert distribution

#### 🚁 Drone Service (Port 8006)
- Drone fleet management
- Drone status tracking (in_flight, charging, maintenance)
- Battery level monitoring
- Flight time tracking
- 5G slice information management
- Maintenance scheduling

---

## 🔌 External API Integrations

### CAMARA APIs

**CAMARA** (Common API Management and Real-time Analytics) is an open source project within the **Linux Foundation** that defines, develops, and tests APIs for Telco network capabilities exposed through APIs. The following CAMARA APIs are made available for this hackathon by **Telstra** in conjunction with **Nokia**:

#### 1. **Geofencing Subscriptions API**
- **Purpose**: Subscribe devices to geofence areas for automatic location tracking
- **Used By**: Device Service
- **Flow**: When user subscribes to a beach, backend creates CAMARA subscription with phone number, geofence coordinates, and callback URL

#### 2. **Location Retrieval API**
- **Purpose**: Retrieve precise device/drone location information
- **Used By**: Shark Detection Service
- **Flow**: When drone detects shark, service retrieves precise location for proximity calculations

#### 3. **Quality on Demand (QoD) API**
- **Purpose**: Request dedicated 5G network slices for high-bandwidth, low-latency video streaming
- **Used By**: Shark Detection Service
- **Flow**: On shark detection, service requests dedicated 5G slice with specified bandwidth, latency, and QoS parameters for real-time video streaming

---

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose** installed
- **Node.js** 16+ (for local development)
- **MongoDB** (or use Docker)
- **Git**

### Using Docker Compose (Recommended)

1. **Clone and start services**:
   ```bash
   git clone <repository-url>
   cd shark-detection-system
   docker-compose up -d
   ```

2. **Access the applications**:
   - 🌐 **Web Portal**: http://localhost:3000
   - 📱 **Mobile App**: http://localhost:3001
   - 🔌 **API Gateway**: http://localhost:8000

3. **Test CAMARA geofencing integration**:
   ```bash
   ./scripts/test-camara-geofencing.sh
   ```

4. **Seed initial data** (optional):
   ```bash
   npm install
   npm run seed
   ```

### Local Development

1. **Setup environment**:
   ```bash
   ./scripts/setup-local-dev.sh
   ```

2. **Start services individually**:
   ```bash
   # Terminal 1: MongoDB
   mongod
   
   # Terminal 2: Services
   cd services/api-gateway && npm start
   cd services/user-service && npm start
   cd services/device-service && npm start
   # ... (start other services)
   
   # Terminal 3: Frontend
   cd frontend/web-portal && npm start
   ```

---

## ☁️ Cloud Deployment

### Quick Deploy (10 minutes)

1. **Package for deployment**:
   ```bash
   ./package-for-deployment.sh
   ```

2. **Transfer to Ubuntu VM**:
   ```bash
   scp shark-detection-system-*.tar.gz user@your-vm-ip:/tmp/
   ```

3. **Deploy on VM**:
   ```bash
   ssh user@your-vm-ip
   tar -xzf /tmp/shark-detection-system-*.tar.gz
   cd shark-detection-system-*
   
   # Configure environment
   cp config/production.env.example config/production.env
   nano config/production.env  # Add your credentials
   
   # Deploy
   sudo docker compose -f docker-compose.prod.yml up -d --build
   
   # Seed data
   sudo npm install
   sudo npm run seed
   ```

4. **Access**:
   - Web Portal: http://your-vm-ip:3000
   - Admin Login: `admin` / (see config)

📖 **For detailed deployment instructions**: See [DEPLOYMENT.md](docs/DEPLOYMENT.md)  
🚀 **For quick deployment**: See [QUICK_DEPLOY.md](docs/QUICK_DEPLOY.md)

---

## 📚 Documentation

### 🎯 Getting Started
- **[START_HERE.md](docs/START_HERE.md)** - First steps for new users and developers
- **[USER_GUIDE.md](docs/USER_GUIDE.md)** - Complete user manual with feature walkthroughs
- **[DEMO_GUIDE.md](docs/DEMO_GUIDE.md)** - Demo scenarios and walkthroughs

### 🏗️ Architecture & Technical
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Comprehensive system architecture with diagrams
  - High-level architecture diagrams
  - Component interactions
  - Data flow diagrams
  - API integration details
- **[PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md)** - Project overview and technology stack

### 🚀 Deployment
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Complete cloud deployment guide
  - Ubuntu VM setup
  - Docker configuration
  - Reverse proxy setup (Caddy)
  - SSL certificates
  - Troubleshooting
- **[QUICK_DEPLOY.md](docs/QUICK_DEPLOY.md)** - Fast deployment script (10 minutes)

### 📋 Configuration
- **[config/README.md](config/README.md)** - Environment variable configuration guide
- **[caddy/README.md](caddy/README.md)** - Reverse proxy setup documentation

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB (with Mongoose ODM)
- **Message Queue**: Kafka (for asynchronous processing)
- **Caching** (Optional/Future): Redis - Reserved for future features (caching, rate limiting, session storage)
- **Real-time**: WebSocket (Socket.io)
- **Authentication**: JWT (JSON Web Tokens)

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **Maps**: React Leaflet + OpenStreetMap
- **State Management**: React Context API
- **Routing**: React Router

### External Integrations
- **5G APIs**: CAMARA APIs (Linux Foundation open source project, made available by Telstra in conjunction with Nokia)
  - Geofencing Subscriptions API
  - Location Retrieval API
  - Quality on Demand API (5G Network Slicing)
- **Notifications**: FCM (Firebase Cloud Messaging)

### Deployment & DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Caddy
- **Version Control**: Git

---

## 🔑 Key Features Explained

### 1. Beach & Geofence Management
Administrators create beaches with coordinates and then create geofences around them using radius and center point (latitude, longitude). All data is persisted in MongoDB.

### 2. User Subscription Flow
When users subscribe to alerts for a beach:
1. Mobile app sends registration with phone number and beach selection
2. Backend retrieves all geofences for that beach
3. For each geofence, backend calls CAMARA API to subscribe
4. CAMARA API monitors device location and sends callbacks on geofence entry/exit

### 3. New Beach/Geofence Notifications
- When new beaches are added, existing subscribers receive notifications to subscribe
- When new geofences are added to already-subscribed beaches, mobile app automatically subscribes via CAMARA API

### 4. Geofence Entry Detection
- CAMARA API automatically detects when users enter geofence areas
- Callbacks are sent to backend notification service
- Backend updates database to track which users are currently in geofences
- This information is used to determine who should receive shark alerts

### 5. Shark Detection & Alert Flow
When a drone detects a shark:
1. Drone reports detection with location, shark type, size, and image
2. Service uses CAMARA Location API to get precise drone location
3. Service requests dedicated 5G network slice via Quality on Demand API
4. Once slice is allocated, drone streams high-quality video via 5G
5. System queries geofence service to find users in nearby geofences
6. Push notifications are sent to identified users based on device type

---

## 🔐 Security & Configuration

### Environment Variables

All sensitive credentials are stored in environment files:

- **Development**: `config/development.env` (gitignored)
- **Production**: `config/production.env` (gitignored)
- **Templates**: `config/*.env.example` (included in repo)

**Required Configuration**:
- MongoDB connection string
- JWT secret keys
- CAMARA API credentials (provided by Telstra)
- Push notification service keys
- Domain/IP settings

See **[config/README.md](config/README.md)** for detailed configuration guide.

### Admin Credentials (Demo)

**Default Login**:
- **Username**: `admin`
- **Password**: (see `config/production.env.example`)

> ⚠️ **Important**: Change default credentials before production use!

---

## 📊 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout

### Devices
- `POST /api/devices/register` - Register device/subscriber
- `GET /api/devices` - List all devices
- `GET /api/devices/:deviceId` - Get device details
- `POST /api/devices/:deviceId/location` - Update device location
- `POST /api/devices/:deviceId/subscribe-beach` - Subscribe to beach

### Geofences
- `POST /api/geofences` - Create geofence
- `GET /api/geofences` - List all geofences
- `POST /api/geofences/check-location` - Check if location is in geofence
- `PUT /api/geofences/:id/deactivate` - Deactivate geofence

### Notifications
- `POST /api/notifications/send` - Send notification
- `GET /api/notifications/user/:userId` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

### Shark Detection
- `POST /api/sharks/report` - Report shark detection (from drone)
- `GET /api/sharks/detections` - Get shark detection history
- `GET /api/sharks/stats` - Get detection statistics

### Beaches
- `POST /api/beaches` - Create beach (admin only)
- `GET /api/beaches` - List all beaches
- `GET /api/beaches/:id` - Get beach details

---

## 🤝 Contributing

This project was developed for a hackathon demonstration showcasing 5G network slicing, CAMARA API integration, and real-time IoT alert systems.

For questions, improvements, or issues:
1. Check the [Documentation](docs/) for detailed guides
2. Review troubleshooting sections in [DEPLOYMENT.md](docs/DEPLOYMENT.md)
3. Open an issue for bugs or feature requests

---

## 📝 License

This project was developed for a hackathon demonstration organized by **Telstra** in conjunction with **Nokia**, showcasing **AI-powered** shark detection leveraging **5G network slicing** and **CAMARA APIs** (Linux Foundation open source project). See individual components for their respective licenses.

---

## 🙏 Acknowledgments

This project was developed for a hackathon organized by **Telstra** in conjunction with **Nokia**.

- **CAMARA Project** (Linux Foundation) - Open source project defining Telco network APIs
- **Telstra** - Hackathon organizer and provider of CAMARA APIs access
- **Nokia** - Co-organizer and collaborator in making CAMARA APIs available
- **OpenStreetMap** - Mapping services
- **React & Node.js** communities - Excellent frameworks

---

<div align="center">

### 🌊 Stay Safe. Stay Informed. Surfers. 🦈

**Real-Time Shark Alerts Powered by 5G Network Slicing**

[📖 Documentation](docs/) • [🚀 Quick Start](#-quick-start) • [🏗️ Architecture](docs/ARCHITECTURE.md)

</div>
