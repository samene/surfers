#!/bin/bash

# Shark Detection System Deployment Script
# For Ubuntu/Debian cloud VMs

set -e  # Exit on error

echo "🌊 Shark Detection System - Deployment Script"
echo "=============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run with sudo${NC}"
   exit 1
fi

# Update system
echo -e "\n${GREEN}[1/8]${NC} Updating system packages..."
apt update && apt upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo -e "\n${GREEN}[2/8]${NC} Installing Docker..."
    apt install -y docker.io docker-compose
    systemctl start docker
    systemctl enable docker
else
    echo -e "\n${YELLOW}[2/8]${NC} Docker already installed"
fi

# Install Docker Compose plugin if not present
if ! docker compose version &> /dev/null; then
    echo -e "\n${GREEN}[3/8]${NC} Installing Docker Compose..."
    apt install -y docker-compose-plugin
else
    echo -e "\n${YELLOW}[3/8]${NC} Docker Compose already installed"
fi

# Configure firewall
echo -e "\n${GREEN}[4/8]${NC} Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp      # SSH
    ufw allow 80/tcp      # HTTP
    ufw allow 443/tcp     # HTTPS
    ufw allow 3000/tcp    # Web Portal
    ufw allow 8000/tcp    # API Gateway
    ufw --force enable
    echo -e "${GREEN}✅ Firewall configured${NC}"
else
    echo -e "${YELLOW}UFW not found, skipping firewall configuration${NC}"
fi

# Check if project directory exists
if [ ! -d "shark-detection-system" ]; then
    echo -e "\n${RED}Error: shark-detection-system directory not found${NC}"
    echo "Please run this script from the directory containing the project"
    exit 1
fi

cd shark-detection-system

# Set up environment file
echo -e "\n${GREEN}[5/8]${NC} Setting up environment..."
if [ ! -f "config/production.env" ]; then
    cp config/production.env.example config/production.env
    echo -e "${YELLOW}⚠️  Created config/production.env${NC}"
    echo -e "${YELLOW}⚠️  Please edit it with your actual credentials:${NC}"
    echo -e "   ${GREEN}sudo nano config/production.env${NC}"
    read -p "Press Enter after updating the production.env file..."
else
    echo -e "${GREEN}✅ Production environment file exists${NC}"
fi

# Build and start services
echo -e "\n${GREEN}[6/8]${NC} Building Docker images..."

# Export environment variables from production.env for build args
if [ -f "config/production.env" ]; then
    export $(cat config/production.env | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded from config/production.env"
fi

docker compose -f docker-compose.prod.yml build

echo -e "\n${GREEN}[7/8]${NC} Starting services..."
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo -e "\n${GREEN}[8/8]${NC} Waiting for services to start..."
sleep 15

# Seed initial data
echo -e "\n${GREEN}Seeding database with initial data...${NC}"
if [ -f "scripts/seed-data.js" ]; then
    # Try to run seed using user-service container with volume mount
    docker compose -f docker-compose.prod.yml run --rm -v $(pwd)/scripts:/scripts user-service node /scripts/seed-data.js || {
        echo -e "${YELLOW}Note: Could not seed via container${NC}"
        echo -e "${YELLOW}You may need to run manually:${NC}"
        echo -e "   cd $(pwd) && npm install && npm run seed"
    }
else
    echo -e "${YELLOW}Note: Seed script not found, skipping automatic seeding${NC}"
fi

# Show status
echo -e "\n${GREEN}Deployment Summary${NC}"
echo "==================="
docker compose -f docker-compose.prod.yml ps

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}Access the application:${NC}"
echo "   Web Portal: http://your-server-ip:3000"
echo "   API Gateway: http://your-server-ip:8000"
echo ""
echo -e "${YELLOW}Admin Login:${NC}"
echo "   Username: admin"
echo "   Password: ****"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "   View logs:     sudo docker compose -f docker-compose.prod.yml logs -f"
echo "   Stop services: sudo docker compose -f docker-compose.prod.yml down"
echo "   Restart:       sudo docker compose -f docker-compose.prod.yml restart"
echo ""
echo -e "${GREEN}Happy surfing! 🏄${NC}"

