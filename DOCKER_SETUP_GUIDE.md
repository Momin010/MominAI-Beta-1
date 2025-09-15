# 🚀 MominAI Backend Docker Setup Guide

## Complete Docker Containerization for Ubuntu Server

This guide provides step-by-step instructions to deploy the MominAI backend as a Docker container on your uncle's Ubuntu server in Turkey. Everything is copy-paste ready with beginner-friendly explanations.

---

## 📋 Prerequisites

### Server Requirements
- ✅ Ubuntu 20.04 LTS or later
- ✅ Root or sudo access
- ✅ 2GB RAM minimum (4GB recommended)
- ✅ 10GB free disk space
- ✅ Internet connection

### What You'll Need
- SSH access to your server
- Basic command line knowledge
- Your server's IP address or domain

---

## 1. 🔧 Installing Docker

### Step 1.1: Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
```

### Step 1.2: Install Required Packages
```bash
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
```

### Step 1.3: Add Docker's Official GPG Key
```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

### Step 1.4: Add Docker Repository
```bash
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### Step 1.5: Install Docker Engine
```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### Step 1.6: Start and Enable Docker
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### Step 1.7: Add User to Docker Group (Optional)
```bash
sudo usermod -aG docker $USER
```

### Step 1.8: Verify Installation
```bash
docker --version
docker run hello-world
```

**Expected Output:**
```
Docker version 24.x.x, build xxxxxx
Hello from Docker!
```

---

## 2. 🐳 Setting up MominAI Backend Container

### Step 2.1: Connect to Your Server
```bash
ssh user@your-server-ip
# Or if using domain:
ssh user@your-ide-domain.com
```

### Step 2.2: Create Project Directory
```bash
mkdir -p ~/mominai-backend
cd ~/mominai-backend
```

### Step 2.3: Download Project Files
```bash
# Clone the repository
git clone https://github.com/Momin010/MominAI-Beta-1.git .
```

### Step 2.4: Create Required Directories
```bash
# Create directories for persistent data
mkdir -p user-workspaces logs

# Set proper permissions
sudo chown -R $USER:$USER user-workspaces logs
```

### Step 2.5: Build and Start the Container
```bash
# Build and start the backend
docker-compose up -d --build
```

### Step 2.6: Verify Container is Running
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f mominai-backend
```

**Expected Output:**
```
mominai-backend    docker-entrypoint.sh npm start   Up      0.0.0.0:3001->3001/tcp
```

---

## 3. 🔒 Security and Firewall Setup

### Step 3.1: Install UFW Firewall
```bash
sudo apt install -y ufw
```

### Step 3.2: Configure Basic Firewall Rules
```bash
# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow MominAI backend port
sudo ufw allow 3001

# Enable firewall
sudo ufw --force enable
```

### Step 3.3: Verify Firewall Status
```bash
sudo ufw status
```

**Expected Output:**
```
Status: active

To                         Action      From
--                         ------      ----
22                         ALLOW       Anywhere
80                         ALLOW       Anywhere
443                        ALLOW       Anywhere
3001                       ALLOW       Anywhere
22 (v6)                    ALLOW       Anywhere (v6)
80 (v6)                    ALLOW       Anywhere (v6)
443 (v6)                   ALLOW       Anywhere (v6)
3001 (v6)                 ALLOW       Anywhere (v6)
```

### Step 3.4: Secure Docker Socket (Advanced)
```bash
# Create docker group if it doesn't exist
sudo groupadd docker

# Add your user to docker group
sudo usermod -aG docker $USER

# Restart docker service
sudo systemctl restart docker
```

### Step 3.5: Container Security Best Practices
The Docker setup includes:
- ✅ Non-root user execution
- ✅ Read-only filesystem with tmpfs
- ✅ No new privileges
- ✅ Minimal base image (Alpine Linux)
- ✅ Health checks enabled

---

## 4. 📊 Starting and Monitoring

### Step 4.1: Start the Backend
```bash
cd ~/mominai-backend
docker-compose up -d
```

### Step 4.2: Check Health Status
```bash
# Quick health check
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "sessions": 0,
  "containers": 0,
  "docker": true,
  "uptime": 123.45
}
```

### Step 4.3: Monitor Container Logs
```bash
# View real-time logs
docker-compose logs -f mominai-backend

# View last 100 lines
docker-compose logs --tail=100 mominai-backend
```

### Step 4.4: Monitor Resource Usage
```bash
# Check container resource usage
docker stats mominai-backend

# Check disk usage
df -h

# Check memory usage
free -h
```

### Step 4.5: View Active Sessions
```bash
# List all containers
docker ps

# Check specific session
curl http://localhost:3001/session/session123
```

---

## 5. 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue 1: Container Won't Start
```bash
# Check container logs
docker-compose logs mominai-backend

# Check Docker service status
sudo systemctl status docker

# Restart Docker service
sudo systemctl restart docker

# Try rebuilding
docker-compose down
docker-compose up -d --build
```

#### Issue 2: Port Already in Use
```bash
# Check what's using port 3001
sudo lsof -i :3001

# Kill the process
sudo kill -9 <PID>

# Or change port in docker-compose.yml
# Edit the ports section to use a different port
```

#### Issue 3: Permission Denied
```bash
# Fix Docker socket permissions
sudo chmod 666 /var/run/docker.sock

# Or add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

#### Issue 4: Out of Disk Space
```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a -f

# Remove old images
docker image prune -f
```

#### Issue 5: Container Health Check Failing
```bash
# Check container health
docker ps

# Inspect container
docker inspect mominai-backend

# Check health logs
docker logs mominai-backend 2>&1 | grep -i health
```

#### Issue 6: WebSocket Connection Issues
```bash
# Test WebSocket connection
curl -I http://localhost:3001

# Check firewall rules
sudo ufw status

# Verify container networking
docker network ls
```

#### Issue 7: High Memory Usage
```bash
# Check memory usage
docker stats

# Restart container
docker-compose restart mominai-backend

# Check for memory leaks in logs
docker-compose logs mominai-backend | grep -i memory
```

### Quick Diagnostic Commands
```bash
# Full system check
echo "=== Docker Status ==="
sudo systemctl status docker
echo -e "\n=== Container Status ==="
docker-compose ps
echo -e "\n=== Resource Usage ==="
docker stats --no-stream
echo -e "\n=== Recent Logs ==="
docker-compose logs --tail=20 mominai-backend
```

---

## 6. 💾 Backup and Maintenance

### Daily Maintenance Tasks

#### Task 1: Monitor Logs and Clean Up
```bash
# Check log sizes
du -sh logs/

# Clean old logs (keep last 7 days)
find logs/ -name "*.log" -mtime +7 -delete

# Clean Docker system
docker system prune -f
```

#### Task 2: Update Docker Images
```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d
```

#### Task 3: Check System Resources
```bash
# Monitor disk usage
df -h

# Monitor memory
free -h

# Check running processes
ps aux --sort=-%mem | head -10
```

### Backup Procedures

#### Backup 1: User Workspaces
```bash
# Create backup directory
mkdir -p ~/backups/$(date +%Y%m%d)

# Backup user workspaces
cp -r user-workspaces ~/backups/$(date +%Y%m%d)/

# Compress backup
cd ~/backups/$(date +%Y%m%d)
tar -czf user-workspaces-backup.tar.gz user-workspaces/
```

#### Backup 2: Configuration Files
```bash
# Backup docker-compose.yml
cp docker-compose.yml ~/backups/$(date +%Y%m%d)/

# Backup environment files
cp .env ~/backups/$(date +%Y%m%d)/ 2>/dev/null || true
```

#### Backup 3: Database/Data (if applicable)
```bash
# If you add a database later, backup here
# mongodump, pg_dump, etc.
```

### Automated Backup Script
Create a backup script:
```bash
nano ~/backup-mominai.sh
```

Add this content:
```bash
#!/bin/bash
BACKUP_DIR=~/backups/$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Stop containers for consistent backup
cd ~/mominai-backend
docker-compose stop

# Backup data
cp -r user-workspaces $BACKUP_DIR/
cp docker-compose.yml $BACKUP_DIR/

# Restart containers
docker-compose start

# Compress backup
cd $BACKUP_DIR/..
tar -czf mominai-backup-$(date +%Y%m%d_%H%M%S).tar.gz $(basename $BACKUP_DIR)

echo "Backup completed: $BACKUP_DIR"
```

Make it executable:
```bash
chmod +x ~/backup-mominai.sh
```

### Maintenance Schedule
- **Daily**: Check logs, monitor resources
- **Weekly**: Clean up old logs and Docker images
- **Monthly**: Full backup, update Docker images
- **Quarterly**: Review and optimize configuration

---

## 🚀 Advanced Configuration

### Environment Variables
Create a `.env` file for custom settings:
```bash
nano .env
```

Add configuration:
```env
NODE_ENV=production
PORT=3001
USER_WORKSPACE_BASE=/home/ide/users
CONTAINER_CPU_LIMIT=0.5
CONTAINER_MEMORY_LIMIT=512m
SESSION_IDLE_TIMEOUT=1800000
MAX_SESSIONS=50
```

### Scaling Configuration
For higher loads, modify `docker-compose.yml`:
```yaml
services:
  mominai-backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Load Balancing (Advanced)
For multiple servers:
```bash
# Install nginx
sudo apt install nginx

# Configure upstream
sudo nano /etc/nginx/sites-available/mominai
```

Add load balancer config:
```nginx
upstream mominai_backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    # Add more servers as needed
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://mominai_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🎯 Success Checklist

- ✅ **Docker installed and running**
- ✅ **Project files downloaded**
- ✅ **Container built and started**
- ✅ **Health endpoint responding**
- ✅ **Firewall configured**
- ✅ **Security measures in place**
- ✅ **Backup procedures set up**
- ✅ **Monitoring configured**

---

## 📞 Support and Monitoring

### Health Check Endpoint
```bash
# Continuous monitoring
watch -n 30 curl -s http://localhost:3001/health
```

### Log Rotation
```bash
# Install logrotate
sudo apt install logrotate

# Configure log rotation
sudo nano /etc/logrotate.d/mominai
```

Add:
```
/home/user/mominai-backend/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
```

### System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop

# Monitor in real-time
htop
```

---

## 🔄 Updates and Upgrades

### Update MominAI Backend
```bash
cd ~/mominai-backend

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Update Docker
```bash
# Update Docker packages
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io

# Restart service
sudo systemctl restart docker
```

---

## 🚨 Emergency Procedures

### Stop Everything
```bash
cd ~/mominai-backend
docker-compose down
```

### Full Reset
```bash
# Stop and remove everything
docker-compose down -v --remove-orphans

# Clean up Docker
docker system prune -a -f

# Remove all data (CAUTION!)
sudo rm -rf user-workspaces logs
```

### Quick Restart
```bash
# Restart Docker service
sudo systemctl restart docker

# Restart containers
cd ~/mominai-backend
docker-compose restart
```

---

## 📋 Command Reference

### Essential Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart mominai-backend

# Rebuild and restart
docker-compose up -d --build

# Check status
docker-compose ps

# View resource usage
docker stats
```

### Docker Management
```bash
# List all containers
docker ps -a

# List images
docker images

# Clean up
docker system prune -f

# Remove specific container
docker rm mominai-backend

# Remove image
docker rmi mominai-backend
```

---

**🎉 Your MominAI backend is now running securely in Docker!**

**Access your IDE at:** `http://your-server-ip:3001`

**Monitor health at:** `http://your-server-ip:3001/health`

**Need help?** Check the troubleshooting section or contact support with your server logs.