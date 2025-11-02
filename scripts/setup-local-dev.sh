#!/bin/bash

# Local Development Environment Setup
# This script helps set up the correct environment variables for local development

echo "🔧 Setting up local development environment..."

# Create .env file for frontend if it doesn't exist
if [ ! -f ./frontend/web-portal/.env ]; then
    echo "Creating .env file for frontend..."
    cat > ./frontend/web-portal/.env << EOF
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GEOFENCE_SERVICE_URL=http://localhost:8003
REACT_APP_NOTIFICATION_SERVICE_URL=http://localhost:8004
EOF
    echo "✅ Created .env file for frontend"
else
    echo "✅ .env file already exists for frontend"
fi

# Create .env file for geofence service if it doesn't exist
if [ ! -f ./services/geofence-service/.env ]; then
    echo "Creating .env file for geofence service..."
    cat > ./services/geofence-service/.env << EOF
PORT=8003
MONGODB_URI=mongodb://localhost:27017/sharkdetection
SERVICE_URL=http://localhost:8003
EOF
    echo "✅ Created .env file for geofence service"
else
    echo "✅ .env file already exists for geofence service"
fi

# Create .env file for notification service if it doesn't exist
if [ ! -f ./services/notification-service/.env ]; then
    echo "Creating .env file for notification service..."
    cat > ./services/notification-service/.env << EOF
PORT=8004
MONGODB_URI=mongodb://localhost:27017/sharkdetection
REDIS_URL=redis://localhost:6379
EOF
    echo "✅ Created .env file for notification service"
else
    echo "✅ .env file already exists for notification service"
fi

echo ""
echo "🎉 Local development environment setup complete!"
echo ""
echo "To start the services locally:"
echo "1. Start MongoDB: mongod"
echo "2. Start Redis: redis-server"
echo "3. Start services:"
echo "   - cd services/geofence-service && npm start"
echo "   - cd services/notification-service && npm start"
echo "   - cd services/api-gateway && npm start"
echo "4. Start frontend:"
echo "   - cd frontend/web-portal && npm start"
echo ""
echo "Or use Docker Compose:"
echo "   docker-compose up -d"
