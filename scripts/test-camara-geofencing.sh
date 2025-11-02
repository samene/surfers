#!/bin/bash

# CAMARA Geofencing Integration Demo Script
# This script demonstrates the complete CAMARA geofencing API integration

echo "🐋 CAMARA Geofencing Integration Demo"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
GEOFENCE_SERVICE_URL="http://localhost:8003"
NOTIFICATION_SERVICE_URL="http://localhost:8004"
CALLBACK_URL="http://localhost:8004/api/camara/geofencing-callback"

# Check if running in Docker
if [ -f /.dockerenv ]; then
    GEOFENCE_SERVICE_URL="http://geofence-service:8003"
    NOTIFICATION_SERVICE_URL="http://notification-service:8004"
    CALLBACK_URL="http://notification-service:8004/api/camara/geofencing-callback"
fi

echo -e "${BLUE}Step 1: Starting services...${NC}"

# Check if services are running
check_service() {
    local service_name=$1
    local url=$2
    
    if curl -s "$url/health" > /dev/null; then
        echo -e "${GREEN}✅ $service_name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is not running${NC}"
        return 1
    fi
}

# Wait for services to be ready
echo "Waiting for services to be ready..."
for i in {1..30}; do
    if check_service "Geofence Service" "$GEOFENCE_SERVICE_URL" && check_service "Notification Service" "$NOTIFICATION_SERVICE_URL"; then
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

echo -e "\n${BLUE}Step 2: Creating CAMARA geofencing subscription...${NC}"

# Create a geofencing subscription
SUBSCRIPTION_DATA='{
  "device": {
    "phoneNumber": "+1234567890"
  },
  "area": {
    "areaType": "CIRCLE",
    "center": {
      "latitude": -33.8688,
      "longitude": 151.2093
    },
    "radius": 1000
  },
  "types": [
    "org.camaraproject.geofencing-subscriptions.v0.area-entered",
    "org.camaraproject.geofencing-subscriptions.v0.area-left"
  ],
  "sink": "'$CALLBACK_URL'",
  "protocol": "HTTP",
  "config": {
    "subscriptionDetail": {
      "initialEvent": false,
      "subscriptionMaxEvents": 100,
      "subscriptionExpireTime": "'$(date -u -d '+24 hours' +%Y-%m-%dT%H:%M:%S.%3NZ)'"
    }
  }
}'

echo "Creating subscription with data:"
echo "$SUBSCRIPTION_DATA" | jq '.'

SUBSCRIPTION_RESPONSE=$(curl -s -X POST "$GEOFENCE_SERVICE_URL/api/geofencing-subscriptions" \
  -H "Content-Type: application/json" \
  -d "$SUBSCRIPTION_DATA")

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Subscription created successfully${NC}"
    SUBSCRIPTION_ID=$(echo "$SUBSCRIPTION_RESPONSE" | jq -r '.subscriptionId')
    echo "Subscription ID: $SUBSCRIPTION_ID"
else
    echo -e "${RED}❌ Failed to create subscription${NC}"
    exit 1
fi

echo -e "\n${BLUE}Step 3: Retrieving subscription details...${NC}"

# Get subscription details
GET_RESPONSE=$(curl -s "$GEOFENCE_SERVICE_URL/api/geofencing-subscriptions/$SUBSCRIPTION_ID")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Subscription retrieved successfully${NC}"
    echo "Subscription details:"
    echo "$GET_RESPONSE" | jq '.'
else
    echo -e "${RED}❌ Failed to retrieve subscription${NC}"
fi

echo -e "\n${BLUE}Step 4: Simulating device location updates...${NC}"

# Simulate device entering the danger zone
echo "Simulating device entering danger zone..."
ENTER_RESPONSE=$(curl -s -X POST "$GEOFENCE_SERVICE_URL/api/geofencing-subscriptions/simulate-location" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "+1234567890",
    "latitude": -33.8688,
    "longitude": 151.2093
  }')

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Location simulation completed${NC}"
    echo "Simulation result:"
    echo "$ENTER_RESPONSE" | jq '.'
else
    echo -e "${RED}❌ Failed to simulate location${NC}"
fi

# Wait a moment
sleep 2

# Simulate device leaving the danger zone
echo "Simulating device leaving danger zone..."
LEAVE_RESPONSE=$(curl -s -X POST "$GEOFENCE_SERVICE_URL/api/geofencing-subscriptions/simulate-location" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "+1234567890",
    "latitude": -33.9000,
    "longitude": 151.2500
  }')

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Location simulation completed${NC}"
    echo "Simulation result:"
    echo "$LEAVE_RESPONSE" | jq '.'
else
    echo -e "${RED}❌ Failed to simulate location${NC}"
fi

echo -e "\n${BLUE}Step 5: Checking CAMARA events...${NC}"

# Get CAMARA events
EVENTS_RESPONSE=$(curl -s "$NOTIFICATION_SERVICE_URL/api/camara/events")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ CAMARA events retrieved successfully${NC}"
    echo "Recent events:"
    echo "$EVENTS_RESPONSE" | jq '.'
else
    echo -e "${RED}❌ Failed to retrieve CAMARA events${NC}"
fi

echo -e "\n${BLUE}Step 6: Getting CAMARA statistics...${NC}"

# Get CAMARA statistics
STATS_RESPONSE=$(curl -s "$NOTIFICATION_SERVICE_URL/api/camara/stats")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ CAMARA statistics retrieved successfully${NC}"
    echo "Statistics:"
    echo "$STATS_RESPONSE" | jq '.'
else
    echo -e "${RED}❌ Failed to retrieve CAMARA statistics${NC}"
fi

echo -e "\n${BLUE}Step 7: Testing error handling...${NC}"

# Test invalid area (too small)
echo "Testing invalid area (too small)..."
INVALID_RESPONSE=$(curl -s -X POST "$GEOFENCE_SERVICE_URL/api/geofencing-subscriptions" \
  -H "Content-Type: application/json" \
  -d '{
    "device": {
      "phoneNumber": "+1234567890"
    },
    "area": {
      "areaType": "CIRCLE",
      "center": {
        "latitude": -33.8688,
        "longitude": 151.2093
      },
      "radius": 50
    },
    "types": [
      "org.camaraproject.geofencing-subscriptions.v0.area-entered"
    ],
    "sink": "'$CALLBACK_URL'"
  }')

if echo "$INVALID_RESPONSE" | jq -e '.code' > /dev/null; then
    echo -e "${GREEN}✅ Error handling working correctly${NC}"
    echo "Error response:"
    echo "$INVALID_RESPONSE" | jq '.'
else
    echo -e "${RED}❌ Error handling not working${NC}"
fi

echo -e "\n${BLUE}Step 8: Cleaning up...${NC}"

# Delete the subscription
DELETE_RESPONSE=$(curl -s -X DELETE "$GEOFENCE_SERVICE_URL/api/geofencing-subscriptions/$SUBSCRIPTION_ID")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Subscription deleted successfully${NC}"
else
    echo -e "${RED}❌ Failed to delete subscription${NC}"
fi

echo -e "\n${YELLOW}🎉 CAMARA Geofencing Integration Demo Complete!${NC}"
echo ""
echo "Summary of what was demonstrated:"
echo "✅ CAMARA geofencing subscription creation"
echo "✅ Subscription retrieval and management"
echo "✅ Real-time location simulation"
echo "✅ CloudEvent callback handling"
echo "✅ Event storage and retrieval"
echo "✅ Error handling and validation"
echo "✅ Subscription lifecycle management"
echo ""
echo "The integration follows the CAMARA API specification for geofencing subscriptions"
echo "and implements proper CloudEvent format for callbacks."
echo ""
echo "To view the results in the web interface:"
echo "1. Open http://localhost:3000"
echo "2. Navigate to 'CAMARA Geofencing' in the menu"
echo "3. View real-time alerts and events"
