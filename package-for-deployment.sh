#!/bin/bash

# Package Shark Detection System for Cloud Deployment
# This script creates a deployment-ready archive

set -e

echo "📦 Packaging Shark Detection System for Deployment"
echo "=================================================="

# Configuration
VERSION=$(date +%Y%m%d-%H%M%S)
ARCHIVE_NAME="shark-detection-system-${VERSION}.tar.gz"
TEMP_DIR=$(mktemp -d)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create deployment directory
echo -e "\n${GREEN}[1/5]${NC} Creating deployment package..."
mkdir -p "${TEMP_DIR}/shark-detection-system"

# Copy project files
echo -e "${GREEN}[2/5]${NC} Copying project files..."

# Copy Docker files
cp docker-compose.prod.yml "${TEMP_DIR}/shark-detection-system/"
cp docker-compose.yml "${TEMP_DIR}/shark-detection-system/"

# Copy configuration
mkdir -p "${TEMP_DIR}/shark-detection-system/config"
cp -r config/*.example "${TEMP_DIR}/shark-detection-system/config/"
cp config/README.md "${TEMP_DIR}/shark-detection-system/config/"

# Copy deployment documentation
cp DEPLOYMENT.md "${TEMP_DIR}/shark-detection-system/"
cp README.md "${TEMP_DIR}/shark-detection-system/" 2>/dev/null || true
cp PROJECT_SUMMARY.md "${TEMP_DIR}/shark-detection-system/" 2>/dev/null || true

# Copy Dockerfiles and service directories
echo -e "${GREEN}[3/5]${NC} Copying services..."
cp -r services "${TEMP_DIR}/shark-detection-system/"
cp -r frontend "${TEMP_DIR}/shark-detection-system/"
cp -r scripts "${TEMP_DIR}/shark-detection-system/"
cp -r docker "${TEMP_DIR}/shark-detection-system/" 2>/dev/null || true
cp -r caddy "${TEMP_DIR}/shark-detection-system/" 2>/dev/null || true

# Copy package files
cp package.json "${TEMP_DIR}/shark-detection-system/"
cp .gitignore "${TEMP_DIR}/shark-detection-system/"

# Create deployment README
cat > "${TEMP_DIR}/shark-detection-system/DEPLOY-README.txt" << 'EOF'
================================================
Shark Detection System - Deployment Package
================================================

QUICK START
-----------

1. Extract this archive on your Ubuntu VM:
   tar -xzf shark-detection-system-*.tar.gz
   cd shark-detection-system

2. Set up environment variables:
   cd config
   cp production.env.example production.env
   nano production.env  # Edit with your credentials

3. Run deployment script:
   sudo bash ../deploy.sh

   OR manually:
   sudo docker compose -f docker-compose.prod.yml up -d --build

4. Seed initial data:
   cd scripts
   node seed-data.js  # May need to run inside container

5. Access the application:
   http://your-server-ip:3000

ADMIN CREDENTIALS
-----------------
Username: admin
Password: ***

IMPORTANT
---------
- This package does NOT include sensitive credentials
- You MUST configure config/production.env before deploying
- Minimum requirements: 4GB RAM, 20GB disk space
- See DEPLOYMENT.md for detailed instructions

SUPPORT
-------
For issues, check:
- DEPLOYMENT.md for detailed setup instructions
- Docker logs: docker compose logs -f
- Service status: docker compose ps

================================================
EOF

# Create .env template instructions
cat > "${TEMP_DIR}/shark-detection-system/config/SETUP-INSTRUCTIONS.txt" << 'EOF'
ENVIRONMENT SETUP INSTRUCTIONS
==============================

1. Copy the example file to create your environment file:
   cp production.env.example production.env

2. Edit production.env with your actual values:
   nano production.env

3. Required configuration:
   - REACT_APP_TELSTRA_RAPIDAPI_KEY: Your RapidAPI key from Telstra
   - MongoDB credentials (if different from defaults)
   - Update any URLs to match your server's IP or domain

4. Never commit the .env file to version control!

For more details, see config/README.md
EOF

# Create a startup script
cat > "${TEMP_DIR}/shark-detection-system/start.sh" << 'EOF'
#!/bin/bash
# Quick start script for Shark Detection System

set -e

echo "🌊 Starting Shark Detection System..."

# Check if environment is configured
if [ ! -f "config/production.env" ]; then
    echo "❌ Error: config/production.env not found"
    echo "Please run: cp config/production.env.example config/production.env"
    echo "Then edit it with your credentials"
    exit 1
fi

# Start services
echo "Starting services..."
docker compose -f docker-compose.prod.yml up -d

echo "✅ Services started!"
echo ""
echo "Check status: docker compose -f docker-compose.prod.yml ps"
echo "View logs:    docker compose -f docker-compose.prod.yml logs -f"
echo "Access app:   http://localhost:3000"
EOF

chmod +x "${TEMP_DIR}/shark-detection-system/start.sh"

# Create a stop script
cat > "${TEMP_DIR}/shark-detection-system/stop.sh" << 'EOF'
#!/bin/bash
# Stop Shark Detection System

echo "🛑 Stopping Shark Detection System..."
docker compose -f docker-compose.prod.yml down
echo "✅ Services stopped"
EOF

chmod +x "${TEMP_DIR}/shark-detection-system/stop.sh"

# Create backup script
cat > "${TEMP_DIR}/shark-detection-system/backup.sh" << 'EOF'
#!/bin/bash
# Backup database script

BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).archive"

echo "📦 Creating backup..."
docker compose -f docker-compose.prod.yml exec -T mongodb mongodump \
    -u admin \
    -p password \
    --authenticationDatabase admin \
    --archive=$BACKUP_FILE \
    --db=sharkdetection

echo "✅ Backup created: $BACKUP_FILE"
echo "Restore with: docker compose exec mongodb mongorestore --archive=$BACKUP_FILE"
EOF

chmod +x "${TEMP_DIR}/shark-detection-system/backup.sh"

# Create monitoring script
cat > "${TEMP_DIR}/shark-detection-system/monitor.sh" << 'EOF'
#!/bin/bash
# Monitor Shark Detection System

echo "📊 System Status"
echo "================"
docker compose -f docker-compose.prod.yml ps
echo ""
echo "📈 Resource Usage"
echo "================="
docker stats --no-stream
echo ""
echo "💾 Disk Usage"
echo "============="
df -h | grep -E 'Filesystem|/dev/'
echo ""
echo "🔗 Recent Logs"
echo "=============="
docker compose -f docker-compose.prod.yml logs --tail=20
EOF

chmod +x "${TEMP_DIR}/shark-detection-system/monitor.sh"

# Create the archive
echo -e "${GREEN}[4/5]${NC} Creating archive..."
cd "${TEMP_DIR}"
tar -czf "${ARCHIVE_NAME}" shark-detection-system/

# Move to current directory
mv "${ARCHIVE_NAME}" "${OLDPWD}/"

# Cleanup
echo -e "${GREEN}[5/5]${NC} Cleaning up..."
cd "${OLDPWD}"
rm -rf "${TEMP_DIR}"

# Show summary
echo ""
echo -e "${GREEN}✅ Package created successfully!${NC}"
echo ""
echo "📦 Archive: ${ARCHIVE_NAME}"
echo "📊 Size: $(du -h ${ARCHIVE_NAME} | cut -f1)"
echo ""
echo "Next steps:"
echo "  1. Transfer this file to your cloud VM"
echo "  2. Extract: tar -xzf ${ARCHIVE_NAME}"
echo "  3. Follow DEPLOY-README.txt instructions"
echo "  4. Or run: sudo bash deploy.sh"
echo ""
echo -e "${YELLOW}⚠️  Remember to configure config/production.env before starting!${NC}"

