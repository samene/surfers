# Quick Deployment Guide

Fastest way to deploy the Shark Detection System on Ubuntu cloud VMs.

## 🚀 One-Command Deployment

```bash
# On your Ubuntu VM, run:
curl -fsSL https://raw.githubusercontent.com/your-repo/setup.sh | sudo bash
```

Or manually:

## 📋 Step-by-Step (10 minutes)

### 1️⃣ Transfer Files to VM

```bash
# On your local machine
./package-for-deployment.sh

# Transfer to VM (replace with your details)
scp shark-detection-system-*.tar.gz user@your-vm-ip:/tmp/
```

### 2️⃣ On Ubuntu VM

```bash
# SSH into VM
ssh user@your-vm-ip

# Extract package
cd /opt
sudo tar -xzf /tmp/shark-detection-system-*.tar.gz
cd shark-detection-system-*

# Install Docker (if needed)
curl -fsSL https://get.docker.com | sudo sh

# Configure environment
sudo cp config/production.env.example config/production.env
sudo nano config/production.env  # Add your RapidAPI key

# Deploy!
# Export env vars so they're available during build
sudo bash -c 'export $(cat config/production.env | grep -v "^#" | xargs) && docker compose -f docker-compose.prod.yml up -d --build'

# Check status
sudo docker compose -f docker-compose.prod.yml ps

# Seed initial data (important!)
sudo npm install  # Install dependencies
sudo npm run seed  # Run seed script
```

### 3️⃣ Access Application

```
Web Portal: http://your-vm-ip:3000
Admin Login:
  Username: admin
  Password: ***
```

## 🔧 Useful Commands

```bash
# View logs
sudo docker compose -f docker-compose.prod.yml logs -f

# Restart services
sudo docker compose -f docker-compose.prod.yml restart

# Stop everything
sudo docker compose -f docker-compose.prod.yml down

# Update application
sudo docker compose -f docker-compose.prod.yml pull
sudo docker compose -f docker-compose.prod.yml up -d --build
```

## 📝 Important Configuration

Before starting, **must configure** `config/production.env`:

1. `REACT_APP_TELSTRA_RAPIDAPI_KEY` - Your RapidAPI key
2. MongoDB credentials (if changed from defaults)
3. Update `REACT_APP_API_URL` to your domain/IP

See `config/README.md` for details.

## 🌐 Production Setup (SSL + Domain)

For production with HTTPS and custom domain:

```bash
# Install Nginx reverse proxy
sudo apt install nginx

# Configure (see DEPLOYMENT.md)
sudo nano /etc/nginx/sites-available/shark-detection

# Enable and restart
sudo nginx -t
sudo systemctl restart nginx
```

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't access on port 3000 | Check firewall: `sudo ufw allow 3000` |
| Services won't start | Check logs: `docker compose logs` |
| Database errors | Verify MongoDB credentials in docker-compose |
| Low on disk space | Run cleanup: `docker system prune -a` |

## 📊 Minimum Requirements

- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 20GB minimum
- **CPU**: 2 cores minimum
- **OS**: Ubuntu 20.04+ or Debian 11+

## 🔐 Security Checklist

- ✅ Change default MongoDB password
- ✅ Configure strong JWT_SECRET
- ✅ Set up HTTPS (use reverse proxy)
- ✅ Configure firewall
- ✅ Regular database backups
- ✅ Keep Docker updated

See `DEPLOYMENT.md` for comprehensive instructions.

