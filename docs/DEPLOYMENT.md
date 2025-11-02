# Cloud Deployment Guide

This guide explains how to deploy the Shark Detection System on an Ubuntu VM in the cloud.

## Prerequisites

- Ubuntu 20.04+ VM on cloud provider (AWS, Azure, GCP, DigitalOcean, etc.)
- SSH access to the VM
- At least 4GB RAM and 20GB disk space recommended
- A domain name (optional, for production)

## Quick Start

```bash
# 1. SSH into your VM
ssh username@your-vm-ip

# 2. Update system
sudo apt update && sudo apt upgrade -y

# 3. Install Docker
sudo apt install -y docker.io docker-compose

# 4. Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# 5. Clone your repository
git clone https://github.com/your-username/shark-detection-system.git
cd shark-detection-system

# 6. Set up environment variables
cp config/production.env.example config/production.env
nano config/production.env  # Edit with your values

# 7. Build and start services
sudo docker-compose -f docker-compose.prod.yml up -d --build

# 8. Seed initial data
sudo docker-compose exec -T api-gateway node /path/to/seed-data.js

# 9. Check status
sudo docker-compose -f docker-compose.prod.yml ps
sudo docker-compose -f docker-compose.prod.yml logs -f
```

## Deployment Steps

### 1. Initial VM Setup

```bash
# Connect to your VM
ssh user@your-vm-ip

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required tools
sudo apt install -y \
    git \
    curl \
    wget \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release
```

### 2. Install Docker

```bash
# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add your user to docker group (optional, avoids sudo)
sudo usermod -aG docker $USER

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
docker --version
docker compose version
```

### 3. Configure Firewall

```bash
# Allow HTTP, HTTPS, and application ports
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 3000/tcp    # Web Portal
sudo ufw allow 8000/tcp    # API Gateway
sudo ufw enable
sudo ufw status
```

### 4. Deploy Application

```bash
# Navigate to your project directory
cd shark-detection-system

# Configure environment
cp config/production.env.example config/production.env
nano config/production.env  # Edit with your production values

# Important: Update these in production.env:
# - REACT_APP_API_URL to your actual domain or IP
# - REACT_APP_TELSTRA_RAPIDAPI_KEY with your actual key
# - MongoDB credentials (if different)
```

### 5. Build and Start Services

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# For specific service
docker compose -f docker-compose.prod.yml logs -f web-portal
```

### 6. Seed Initial Data

```bash
# Option 1: Run seed script from host machine (recommended)
cd /path/to/shark-detection-system
node scripts/seed-data.js

# Option 2: Run seed using Node.js container
docker compose -f docker-compose.prod.yml run --rm -v $(pwd)/scripts:/scripts user-service node /scripts/seed-data.js

# Option 3: Copy and run from MongoDB container
docker compose -f docker-compose.prod.yml cp scripts/seed-data.js mongodb:/tmp/seed-data.js
docker compose -f docker-compose.prod.yml exec -T mongodb mongosh -u admin -p password --authenticationDatabase admin --eval "load('/tmp/seed-data.js')"
```

**Note**: The seed script needs Node.js and MongoDB driver, so Option 1 (from host) or Option 2 (using a Node.js container) is recommended.

### 7. Set Up Reverse Proxy (Optional but Recommended)

#### Using Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create configuration
sudo nano /etc/nginx/sites-available/shark-detection

# Add this configuration:
```

```nginx
upstream web_portal {
    server localhost:3000;
}

upstream api_gateway {
    server localhost:8000;
}

server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    # Web Portal
    location / {
        proxy_pass http://web_portal;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Gateway
    location /api {
        proxy_pass http://api_gateway;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/shark-detection /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

#### Using Caddy (Recommended for SSL)

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Copy Caddyfile (use the provided one with SSL certificates)
sudo cp caddy/Caddyfile /etc/caddy/Caddyfile

# Or create your own with your domain and SSL certificate paths
sudo nano /etc/caddy/Caddyfile
```

**See `caddy/README.md` for detailed setup with SSL certificates.**

```bash
# Validate configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Create log directory
sudo mkdir -p /var/log/caddy
sudo chown caddy:caddy /var/log/caddy

# Start Caddy
sudo systemctl reload caddy
sudo systemctl enable caddy

# Check status
sudo systemctl status caddy
```

### 8. Monitoring and Maintenance

#### Health Checks

```bash
# Check service status
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Check resources
docker stats

# Database health
docker compose -f docker-compose.prod.yml exec mongodb mongosh -u admin -p password --authenticationDatabase admin --eval "db.adminCommand('ping')"
```

#### Backup Database

```bash
# Create backup
docker compose -f docker-compose.prod.yml exec mongodb mongodump -u admin -p password --authenticationDatabase admin --archive=/data/db/backup-$(date +%Y%m%d).archive --db=sharkdetection

# Restore backup
docker compose -f docker-compose.prod.yml exec mongodb mongorestore -u admin -p password --authenticationDatabase admin --archive=/data/db/backup-YYYYMMDD.archive
```

#### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Restart specific service
docker compose -f docker-compose.prod.yml restart web-portal
```

#### Stop Application

```bash
# Stop all services
docker compose -f docker-compose.prod.yml down

# Stop and remove volumes (⚠️ deletes data)
docker compose -f docker-compose.prod.yml down -v
```

## Environment Configuration

### Production Environment Variables

Ensure `config/production.env` is properly configured:

```bash
# API Configuration
REACT_APP_API_URL=https://your-domain.com
REACT_APP_GEOFENCE_SERVICE_URL=http://geofence-service:8003
REACT_APP_NOTIFICATION_SERVICE_URL=http://notification-service:8004

# Telstra API Configuration
REACT_APP_TELSTRA_API_HOST=https://telstra-hackathon-apis.p-eu.rapidapi.com
REACT_APP_TELSTRA_RAPIDAPI_HOST=telstra-hackathon-apis.nokia.rapidapi.com
REACT_APP_TELSTRA_RAPIDAPI_KEY=your-production-key-here
```

### Security Recommendations

1. **Change Default Passwords**: Update MongoDB root password
2. **Use Strong JWT Secret**: Set JWT_SECRET in environment
3. **Enable HTTPS**: Use reverse proxy with SSL
4. **Firewall Rules**: Only expose necessary ports
5. **Regular Backups**: Set up automated database backups
6. **Monitor Logs**: Watch for suspicious activity
7. **Update Regularly**: Keep Docker and system packages updated

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check disk space
df -h

# Check memory
free -h

# Restart Docker
sudo systemctl restart docker
```

### Database Connection Issues

```bash
# Check MongoDB
docker compose -f docker-compose.prod.yml logs mongodb

# Test connection
docker compose -f docker-compose.prod.yml exec mongodb mongosh -u admin -p password --authenticationDatabase admin
```

### Application Not Accessible

```bash
# Check if services are running
docker compose -f docker-compose.prod.yml ps

# Check port binding
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :8000

# Check firewall
sudo ufw status
```

## Performance Optimization

### Resource Limits

Update `docker-compose.prod.yml` to add resource limits:

```yaml
web-portal:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 1G
      reservations:
        cpus: '0.5'
        memory: 512M
```

### MongoDB Configuration

For production, configure MongoDB replica set and enable authentication:

```yaml
mongodb:
  command: ["--replSet", "rs0"]
  # Add more configuration as needed
```

## Support

For issues or questions:
1. Check logs: `docker compose logs -f`
2. Review this deployment guide
3. Check GitHub issues
4. Contact development team

## Architecture

```
Internet
   ↓
Firewall (Ports 80, 443)
   ↓
Reverse Proxy (Nginx/Caddy)
   ↓
Web Portal (Port 3000)
   ↓
API Gateway (Port 8000)
   ↓
   ├── User Service
   ├── Device Service
   ├── Geofence Service
   ├── Notification Service
   ├── Shark Detection Service
   └── Drone Service
   ↓
MongoDB (Port 27017) + Redis (Port 6379)
```

