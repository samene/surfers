# Shark Detection System Architecture

## Overview

The Shark Detection System is a comprehensive IoT platform that integrates Nokia CAMARA APIs, 5G network slicing, and real-time geofencing to provide proactive shark detection alerts to beachgoers. The system enables surfers and other beach visitors to receive timely alerts when sharks are detected in their vicinity.

## System Architecture Flow

### High-Level Architecture

```mermaid
graph TB
    Admin[Admin Web Portal] --> UserService[User Service]
    Admin --> GeofenceService[Geofence Service]
    
    MobileApp[Mobile App] --> DeviceService[Device Service]
    MobileApp --> NotificationService[Notification Service]
    
    DeviceService --> CAMARA[CAMARA Geofencing API]
    DeviceService --> GeofenceService
    
    CAMARA --> Callback[Callback URL<br/>Notification Service]
    
    Drone[Drone] --> SharkDetection[Shark Detection Service]
    SharkDetection --> CAMARALoc[CAMARA Location API]
    SharkDetection --> QoD[Quality on Demand API<br/>5G Slice Request]
    SharkDetection --> NotificationService
    
    NotificationService --> GeofenceService
    NotificationService --> PushNotifications[Push Notifications]
    
    style Admin fill:#e1f5ff
    style MobileApp fill:#fff4e1
    style Drone fill:#ffe1f5
    style CAMARA fill:#e1ffe1
    style CAMARALoc fill:#e1ffe1
    style QoD fill:#e1ffe1
```

## Detailed Architecture Components

### 1. Beach and Geofence Management

Administrators use the web portal to manage beaches and create geofences around them.

```mermaid
sequenceDiagram
    participant Admin as Admin (Web Portal)
    participant UserService as User Service
    participant GeofenceService as Geofence Service
    participant DB as MongoDB

    Admin->>UserService: Create Beach (lat, lng, name)
    UserService->>DB: Save Beach Data
    DB-->>UserService: Beach Created
    
    Admin->>GeofenceService: Create Geofence (lat, lng, radius, beachId)
    GeofenceService->>DB: Save Geofence (with beach reference)
    DB-->>GeofenceService: Geofence Created
    GeofenceService-->>Admin: Success
    
    Note over Admin,DB: All beach and geofence data<br/>persisted in database
```

**Key Operations:**
- Admin creates beaches with latitude, longitude, and name
- Admin creates geofences around beaches using:
  - Center point (latitude, longitude)
  - Radius (in meters)
  - Association with beach ID
- All data is stored in MongoDB for persistence

### 2. User Subscription Process

When a user subscribes to alerts for a beach, the system automatically sets up CAMARA geofencing subscriptions.

```mermaid
sequenceDiagram
    participant User as User (Mobile App)
    participant DeviceService as Device Service
    participant UserService as User Service
    participant GeofenceService as Geofence Service
    participant CAMARA as Nokia CAMARA API
    participant DB as MongoDB

    User->>DeviceService: Register Device<br/>(phoneNumber, beachId, deviceInfo)
    DeviceService->>DB: Save Device Registration
    
    DeviceService->>UserService: Get Beach Details (beachId)
    UserService->>GeofenceService: Get Geofences for Beach
    GeofenceService-->>DeviceService: Return Geofence Data<br/>(lat, lng, radius)
    
    loop For each geofence
        DeviceService->>CAMARA: POST /subscriptions<br/>{phoneNumber, area, callbackURL}
        CAMARA-->>DeviceService: subscriptionId
        DeviceService->>DB: Save subscriptionId
    end
    
    DeviceService-->>User: Registration Complete
    
    Note over DeviceService,CAMARA: Mobile app subscribes to<br/>Nokia CAMARA geofencing API
```

**Subscription Flow:**
1. User registers device via mobile app with phone number and beach selection
2. Backend retrieves all geofences associated with the selected beach
3. For each geofence, the backend makes an API call to Nokia CAMARA Geofencing API with:
   - Device phone number
   - Geofence area (center point and radius)
   - Callback URL (backend endpoint)
4. CAMARA API returns a subscription ID
5. Subscription ID is stored in the database

### 3. New Beach/Geofence Notification

When new beaches or geofences are added, existing subscribers are notified.

```mermaid
sequenceDiagram
    participant Admin as Admin
    participant UserService as User Service
    participant GeofenceService as Geofence Service
    participant DeviceService as Device Service
    participant NotificationService as Notification Service
    participant Subscribers as Existing Subscribers

    Admin->>GeofenceService: Create New Geofence<br/>(or new Beach)
    GeofenceService->>DeviceService: Query Existing Subscribers
    
    DeviceService->>NotificationService: Send Notification<br/>(New Beach Available)
    NotificationService->>Subscribers: Push Notification<br/>"New beach added - Subscribe?"
    
    alt User Accepts
        Subscribers->>DeviceService: Subscribe to New Beach
        DeviceService->>CAMARA: Create Geofence Subscription
        CAMARA-->>DeviceService: subscriptionId
        DeviceService->>Subscribers: Subscription Confirmed
    end
    
    Note over Admin,Subscribers: Existing subscribers receive<br/>notifications about new beaches
```

**For New Geofences on Existing Subscribed Beaches:**
- When a new geofence is added to an already-subscribed beach, the mobile app automatically subscribes to the new geofence via CAMARA API
- No user intervention required

### 4. Geofence Entry Detection

When a subscriber enters a geofence area, CAMARA sends a callback to the backend.

```mermaid
sequenceDiagram
    participant User as User (Mobile Device)
    participant CAMARA as Nokia CAMARA API
    participant NotificationService as Notification Service<br/>(Callback Endpoint)
    participant GeofenceService as Geofence Service
    participant DB as MongoDB

    User->>CAMARA: Enters Geofence Area<br/>(Automatic Location Detection)
    CAMARA->>NotificationService: POST /api/camara/geofencing-callback<br/>{eventType: "area-entered", phoneNumber, location}
    
    NotificationService->>GeofenceService: Update User Location Status
    GeofenceService->>DB: Save User in Geofence<br/>(isInGeofence: true, currentGeofence)
    
    NotificationService->>DB: Log Geofence Entry Event
    
    Note over User,DB: System tracks which users<br/>are currently in geofences
```

**Geofence Entry Tracking:**
- CAMARA API automatically detects when a device enters a geofence area
- Callback is sent to the backend notification service endpoint
- Backend updates database:
  - User's current location status
  - Which geofence they entered
  - Timestamp of entry
- This information is used later to determine who should receive shark alerts

### 5. Shark Detection and Alert Flow

When a drone detects a shark, the system requests a 5G slice, streams video, and sends alerts to nearby users.

```mermaid
sequenceDiagram
    participant Drone as Surveillance Drone
    participant SharkDetection as Shark Detection Service
    participant CAMARALoc as CAMARA Location API
    participant QoD as Quality on Demand API<br/>(5G Slice)
    participant GeofenceService as Geofence Service
    participant NotificationService as Notification Service
    participant Users as Users in Geofence

    Drone->>SharkDetection: POST /api/sharks/report<br/>{sharkType, size, location, image}
    
    SharkDetection->>CAMARALoc: GET Location Info<br/>(for drone location)
    CAMARALoc-->>SharkDetection: Location Details
    
    SharkDetection->>QoD: POST Request Dedicated 5G Slice<br/>{bandwidth, latency, priority}
    QoD-->>SharkDetection: Slice Allocated
    
    SharkDetection->>Drone: Start Video Streaming<br/>(via 5G slice)
    Drone->>SharkDetection: Stream Video Feed
    
    SharkDetection->>GeofenceService: Find Users in Nearby Geofences<br/>(based on shark location)
    GeofenceService-->>SharkDetection: List of Users in Geofences
    
    loop For each user in geofence
        SharkDetection->>NotificationService: Send Alert<br/>(user, location, shark details)
        NotificationService->>Users: Push Notification<br/>(based on device type)
    end
    
    Note over Drone,Users: Complete flow from detection<br/>to alert delivery
```

**Shark Detection Process:**
1. **Detection**: Drone detects shark and reports to Shark Detection Service with:
   - Shark type and size
   - GPS location (latitude, longitude)
   - Detection image/video
   - Confidence score

2. **Location Retrieval**: Service uses CAMARA Location Retrieval API to get precise drone location

3. **5G Slice Request**: Service requests dedicated 5G network slice via Quality on Demand API:
   - High bandwidth for video streaming
   - Low latency for real-time alerts
   - Priority QoS parameters

4. **Video Streaming**: Once slice is allocated, drone streams high-quality video to backend via the dedicated 5G connection

5. **User Identification**: System queries geofence service to find all users currently inside geofences near the shark location

6. **Alert Distribution**: Push notifications are sent to identified users based on their device type (smartwatch, phone, fitness band)

### 6. Complete End-to-End Flow

```mermaid
graph LR
    subgraph "Setup Phase"
        A1[Admin Creates Beach] --> A2[Admin Creates Geofences]
        A2 --> A3[User Subscribes to Beach]
        A3 --> A4[Mobile App Subscribes to CAMARA API]
    end
    
    subgraph "Monitoring Phase"
        B1[User Enters Geofence] --> B2[CAMARA Sends Callback]
        B2 --> B3[Backend Tracks User Location]
    end
    
    subgraph "Detection Phase"
        C1[Drone Detects Shark] --> C2[Request 5G Slice]
        C2 --> C3[Stream Video via 5G]
        C3 --> C4[Find Users in Geofences]
        C4 --> C5[Send Push Notifications]
    end
    
    A4 --> B1
    B3 --> C4
    
    style A1 fill:#e1f5ff
    style A3 fill:#fff4e1
    style B1 fill:#e1ffe1
    style C1 fill:#ffe1f5
    style C5 fill:#ffe1e1
```

## Component Interactions

### API Integrations

#### Nokia CAMARA APIs

1. **Geofencing Subscriptions API**
   - **Endpoint**: `POST /subscriptions`
   - **Purpose**: Subscribe devices to geofence areas
   - **Payload**: Device phone number, geofence area (center + radius), callback URL
   - **Response**: Subscription ID

2. **Location Retrieval API**
   - **Endpoint**: `GET /location`
   - **Purpose**: Retrieve precise device/drone location
   - **Used By**: Shark Detection Service to get drone location

3. **Quality on Demand (QoD) API**
   - **Endpoint**: `POST /slice-request`
   - **Purpose**: Request dedicated 5G network slice
   - **Parameters**: Bandwidth, latency, QoS class, priority
   - **Used By**: Shark Detection Service for video streaming

#### Internal APIs

- **User Service**: Beach management, user accounts
- **Geofence Service**: Geofence CRUD operations, location checking
- **Device Service**: Device registration, CAMARA subscription management
- **Shark Detection Service**: Shark detection processing, alert triggering
- **Notification Service**: Push notification delivery, WebSocket connections
- **Drone Service**: Drone management and status tracking

## Data Flow Architecture

```mermaid
graph TD
    subgraph "Data Storage"
        MongoDB[(MongoDB)]
    end
    
    subgraph "Services"
        UserSvc[User Service]
        GeoSvc[Geofence Service]
        DevSvc[Device Service]
        SharkSvc[Shark Detection Service]
        NotifSvc[Notification Service]
    end
    
    subgraph "External"
        CAMARA[Nokia CAMARA APIs]
        Push[Push Notification Services]
    end
    
    UserSvc --> MongoDB
    GeoSvc --> MongoDB
    DevSvc --> MongoDB
    SharkSvc --> MongoDB
    NotifSvc --> MongoDB
    
    DevSvc <--> CAMARA
    SharkSvc <--> CAMARA
    NotifSvc --> Push
    
    style MongoDB fill:#e1e1ff
    style CAMARA fill:#e1ffe1
    style Push fill:#ffe1e1
```

## Technology Stack

- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Message Queue**: Kafka (for asynchronous processing)
- **Real-time Communication**: WebSocket (Socket.io)
- **External APIs**: Nokia CAMARA APIs
- **Deployment**: Docker containers orchestrated via Docker Compose
- **Reverse Proxy**: Caddy

## Key Features

1. **Proactive Geofencing**: CAMARA API automatically tracks user locations
2. **5G Network Slicing**: Dedicated network slices for high-quality video streaming
3. **Real-time Alerts**: Instant push notifications based on proximity
4. **Scalable Architecture**: Microservices-based design for horizontal scaling
5. **Multi-device Support**: Smartwatch, phone, and fitness band compatibility
6. **Location Tracking**: Persistent tracking of user locations within geofences

## Security Considerations

- API authentication and authorization
- Secure callback endpoints for CAMARA API
- Device identification via IMEI, IMSI, and phone number
- Encrypted communication channels
- User privacy compliance (location data handling)

## Scalability

- Microservices architecture allows independent scaling
- Kafka enables asynchronous processing of high-volume events
- MongoDB sharding support for large-scale data
- Stateless services for horizontal scaling
- Load balancing via API Gateway

---

## Deployment Diagram

![Deployment Diagram](./screenshots/deployment_architecture.png)

---

*This architecture document provides a comprehensive overview of the Shark Detection System's design, data flows, and component interactions. For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).*
