# 🚀 Shark Detection System - Deployment

Welcome! This guide will help you deploy the system on your Ubuntu cloud VM.

## 📖 Choose Your Path

### 🏃‍♂️ Fast Track (10 minutes)
**For experienced users who want to deploy quickly**

→ **Start here:** [`QUICK_DEPLOY.md`](QUICK_DEPLOY.md)

### 📚 Step-by-Step Guide
**For detailed instructions and understanding**

→ **Start here:** [`DEPLOYMENT.md`](DEPLOYMENT.md)

### 📋 Summary & Overview
**For quick reference and checklist**

→ **Start here:** [`CLOUD_DEPLOYMENT_SUMMARY.md`](CLOUD_DEPLOYMENT_SUMMARY.md)

## 🎯 Quick Start (TL;DR)

```bash
# 1. Package
./package-for-deployment.sh

# 2. Transfer to VM
scp shark-detection-system-*.tar.gz user@vm-ip:/tmp/

# 3. Deploy
ssh user@vm-ip
tar -xzf /tmp/shark-detection-system-*.tar.gz
cd shark-detection-system-*
sudo bash deploy.sh
```

**Access:** http://your-vm-ip:3000  
**Login:** `admin` / `***`

## 📦 What You Need

- ✅ Ubuntu 20.04+ VM (4GB RAM, 20GB disk)
- ✅ Docker installed (or use our installer)
- ✅ SSH access to VM
- ✅ Your Telstra RapidAPI key (for configuration)

## 🔐 Configuration Required

**Before deploying**, you must configure:

1. **Telstra API Key** - In `config/production.env`
2. **Domain/IP Settings** - Update URLs
3. **Security** - Passwords and secrets

## 📞 Need Help?

1. Check [`DEPLOYMENT.md`](DEPLOYMENT.md) troubleshooting
2. Review Docker logs: `docker compose logs -f`
3. See issues section in documentation

## 📂 Documentation Index

| Document | Purpose | Read When |
|----------|---------|-----------|
| **START_HERE.md** | This file | First time? |
| **QUICK_DEPLOY.md** | Fast setup | In a hurry |
| **DEPLOYMENT.md** | Full guide | Need details |
| **CLOUD_DEPLOYMENT_SUMMARY.md** | Reference | Quick lookup |
| **README.md** | Project overview | Understanding system |
| **config/README.md** | Environment setup | Configuring secrets |

## 🎉 Ready?

**Local Development?**  
→ See [`README.md`](README.md) Quick Start

**Cloud Deployment?**  
→ Choose one:
   - **Fast:** [`QUICK_DEPLOY.md`](QUICK_DEPLOY.md) 
   - **Detailed:** [`DEPLOYMENT.md`](DEPLOYMENT.md)

---

**Have questions?** Start with [`DEPLOYMENT.md`](DEPLOYMENT.md) or check the troubleshooting sections.

