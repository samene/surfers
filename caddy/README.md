# Caddy Reverse Proxy Configuration

This directory contains the Caddy configuration for the **Surfers.** Shark Detection System.

## Files

- `Caddyfile` - Main Caddy configuration

## Overview

Caddy acts as a reverse proxy providing:
- SSL/TLS termination with custom certificates
- Reverse proxy to web portal (port 3000) and API gateway (port 8000)
- Security headers
- Compression (zstd and gzip)
- JSON logging

## Setup Instructions

### 1. Install Caddy

```bash
# On Ubuntu/Debian
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### 2. Prepare SSL Certificates

```bash
# Option A: Use existing Let's Encrypt certificates
sudo cp /etc/letsencrypt/live/surfers.it.com/fullchain.pem /etc/caddy/cert.pem
sudo cp /etc/letsencrypt/live/surfers.it.com/privkey.pem /etc/caddy/key
sudo chown caddy:caddy /etc/caddy/cert.pem /etc/caddy/key

# Option B: Use your own certificates
# Place your cert.pem and key files in /etc/caddy/
sudo chmod 644 /etc/caddy/cert.pem
sudo chmod 600 /etc/caddy/key
sudo chown caddy:caddy /etc/caddy/cert.pem /etc/caddy/key
```

### 3. Copy Caddyfile

```bash
# Copy Caddyfile to Caddy's configuration directory
sudo cp caddy/Caddyfile /etc/caddy/Caddyfile

# Or if using project directory
sudo cp /path/to/shark-detection-system/caddy/Caddyfile /etc/caddy/Caddyfile
```

### 4. Create Log Directory

```bash
sudo mkdir -p /var/log/caddy
sudo chown caddy:caddy /var/log/caddy
```

### 5. Test Configuration

```bash
# Validate Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile

# Test syntax
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
```

### 6. Start Caddy

```bash
# Reload Caddy with new configuration
sudo systemctl reload caddy

# Or restart if not running
sudo systemctl restart caddy

# Check status
sudo systemctl status caddy

# Enable auto-start
sudo systemctl enable caddy
```

### 7. Verify Setup

```bash
# Check Caddy is running
sudo systemctl status caddy

# View logs
sudo journalctl -u caddy -f

# Test HTTPS connection
curl -v https://surfers.it.com

# Test API endpoint
curl -v https://surfers.it.com/api/health
```

## Configuration Details

### Domain & TLS

```caddyfile
surfers.it.com {
    tls /etc/caddy/cert.pem /etc/caddy/key
    ...
}
```

- Domain: `surfers.it.com`
- Uses custom SSL certificates from `/etc/caddy/`
- HTTPS automatically enforced

### Compression

```caddyfile
encode zstd gzip
```

- **zstd**: Modern, high-performance compression (preferred)
- **gzip**: Fallback for older clients
- Compresses responses to save bandwidth

### Reverse Proxy Rules

1. **API Gateway** (`/api/*`): Proxies to `localhost:8000`
   - Routes all API requests to backend
   - Headers: Host, X-Forwarded-Proto, X-Forwarded-For
   - Handled **first** to catch API requests

2. **Web Portal** (`/`): Proxies to `localhost:3000`
   - Serves the React application
   - Catches all other requests
   - Headers: Host, X-Forwarded-Proto, X-Forwarded-For

### Security Headers

```caddyfile
header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    X-Content-Type-Options "nosniff"
    X-Frame-Options "SAMEORIGIN"
    X-XSS-Protection "1; mode=block"
    Referrer-Policy "strict-origin-when-cross-origin"
    Permissions-Policy "geolocation=(), microphone=(), camera=()"
    -Server
}
```

**Purpose**:
- **HSTS**: Forces HTTPS for 1 year, includes subdomains, preloads into browser
- **X-Content-Type-Options**: Prevents MIME type sniffing attacks
- **X-Frame-Options**: Prevents clickjacking by blocking iframes
- **X-XSS-Protection**: Basic XSS protection for older browsers
- **Referrer-Policy**: Controls what referrer information is sent
- **Permissions-Policy**: Disables geolocation, microphone, camera
- **-Server**: Removes server header for security

### Logging

```caddyfile
log {
    output file /var/log/caddy/surfers.access.log
    format json
}
```

- **Location**: `/var/log/caddy/surfers.access.log`
- **Format**: JSON for easy parsing and analysis
- **Auto-rotation**: Handled by logrotate

## Firewall Configuration

```bash
# Allow only HTTPS (443)
sudo ufw allow 443/tcp

# Remove direct HTTP access (optional but recommended)
sudo ufw delete allow 3000/tcp  # Web portal
sudo ufw delete allow 8000/tcp  # API gateway

# Verify
sudo ufw status
```

## Troubleshooting

### Caddy won't start

```bash
# Check for syntax errors
sudo caddy validate --config /etc/caddy/Caddyfile

# View recent logs
sudo journalctl -u caddy -n 50 --no-pager

# Check if Caddy is running
sudo systemctl status caddy
```

### Certificate file not found

```bash
# Verify certificates exist
ls -la /etc/caddy/cert.pem /etc/caddy/key

# Check permissions (should be readable by caddy user)
sudo ls -l /etc/caddy/
# cert.pem should be 644 (rw-r--r--)
# key should be 600 (rw-------)

# Fix permissions
sudo chmod 644 /etc/caddy/cert.pem
sudo chmod 600 /etc/caddy/key
sudo chown caddy:caddy /etc/caddy/cert.pem /etc/caddy/key
```

### 502 Bad Gateway

```bash
# Check if services are running
docker compose -f docker-compose.prod.yml ps

# Check if services are listening
sudo netstat -tlnp | grep -E "3000|8000"
# Should show:
# tcp  0  0 0.0.0.0:3000  0.0.0.0:*  LISTEN
# tcp  0  0 0.0.0.0:8000  0.0.0.0:*  LISTEN

# Restart services
docker compose -f docker-compose.prod.yml restart
```

### Can't connect to backend

```bash
# Test backend connectivity from server
curl http://localhost:3000
curl http://localhost:8000/api/health

# Check Docker networking
docker compose -f docker-compose.prod.yml logs web-portal | tail -50
docker compose -f docker-compose.prod.yml logs api-gateway | tail -50

# Check service health
curl http://localhost:8000/health
```

### Compression not working

```bash
# Test compression
curl -v -H "Accept-Encoding: zstd, gzip" https://surfers.it.com/static/js/main.js

# Should see Content-Encoding header in response
# If not, check browser DevTools Network tab
```

## Certificate Renewal

### Using Let's Encrypt

If you're using Let's Encrypt certificates:

```bash
# Certbot should auto-renew, but verify
sudo certbot renew --dry-run

# Copy renewed certificates to Caddy
sudo cp /etc/letsencrypt/live/surfers.it.com/fullchain.pem /etc/caddy/cert.pem
sudo cp /etc/letsencrypt/live/surfers.it.com/privkey.pem /etc/caddy/key

# Reload Caddy
sudo systemctl reload caddy
```

### Automated Renewal Hook

Create a renewal hook:

```bash
sudo nano /etc/letsencrypt/renewal-hooks/deploy/update-caddy.sh
```

```bash
#!/bin/bash
# Update Caddy certificates
cp /etc/letsencrypt/live/surfers.it.com/fullchain.pem /etc/caddy/cert.pem
cp /etc/letsencrypt/live/surfers.it.com/privkey.pem /etc/caddy/key
chown caddy:caddy /etc/caddy/cert.pem /etc/caddy/key

# Reload Caddy
systemctl reload caddy
```

```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/update-caddy.sh
```

## Alternative: Automatic SSL (Let Caddy Manage)

If you prefer Caddy to automatically obtain certificates:

```caddyfile
surfers.it.com {
    # Remove: tls /etc/caddy/cert.pem /etc/caddy/key
    # Caddy will auto-obtain Let's Encrypt certificates
    
    encode zstd gzip
    handle /api/* {
        reverse_proxy localhost:8000 {
            header_up Host {host}
            header_up X-Forwarded-Proto {scheme}
            header_up X-Forwarded-For {remote}
        }
    }
    handle {
        reverse_proxy localhost:3000 {
            header_up Host {host}
            header_up X-Forwarded-Proto {scheme}
            header_up X-Forwarded-For {remote}
        }
    }
    
    # ... rest of config
}
```

**Note**: Requires port 80 and 443 to be accessible for Let's Encrypt validation.

## Monitoring

### View Access Logs

```bash
# Real-time log viewing
sudo tail -f /var/log/caddy/surfers.access.log

# Parse JSON logs (requires jq)
sudo cat /var/log/caddy/surfers.access.log | jq '.'

# Filter by status code
sudo tail -100 /var/log/caddy/surfers.access.log | grep '"status":500'
```

### Caddy Admin API

```bash
# Check Caddy metrics (if admin API enabled)
curl http://localhost:2019/metrics

# View configuration
curl http://localhost:2019/config/
```

## Additional Resources

- **Caddy Documentation**: https://caddyserver.com/docs/
- **Caddyfile Syntax**: https://caddyserver.com/docs/caddyfile/concepts
- **Security Headers Guide**: https://owasp.org/www-project-secure-headers/

## Files Created

- `/etc/caddy/Caddyfile` - Main configuration
- `/etc/caddy/cert.pem` - SSL certificate
- `/etc/caddy/key` - Private key
- `/var/log/caddy/surfers.access.log` - Access logs

---

**Stay Safe. Stay Informed. Surfers.** 🏄‍♂️🌊
