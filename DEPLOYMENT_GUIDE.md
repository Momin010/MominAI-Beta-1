# 🚀 Production Deployment Guide - Docker Multi-User IDE

## 🎯 **DEPLOY TO YOUR UNCLE'S SERVER IN TURKEY**

This guide will help you deploy the fully containerized, multi-user IDE to any Linux server with Docker support.

---

## 📋 **PREREQUISITES**

### **Server Requirements:**
- ✅ **Ubuntu/Debian/CentOS** Linux server
- ✅ **Root or sudo access**
- ✅ **Internet connection** for Docker pulls
- ✅ **At least 2GB RAM** (4GB recommended)
- ✅ **10GB free disk space**

### **Software Requirements:**
- ✅ **Docker** (will be installed)
- ✅ **Node.js** (comes with Docker container)
- ✅ **Git** (for cloning repository)

---

## 🚀 **STEP-BY-STEP DEPLOYMENT**

### **Step 1: Connect to Server**
```bash
# SSH into your uncle's server
ssh user@your-server-ip

# Or if using a domain
ssh user@your-ide-domain.com
```

### **Step 2: Install Docker**
```bash
# Download and install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (optional, for non-root usage)
sudo usermod -aG docker $USER

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Verify Docker installation
docker --version
docker run hello-world
```

### **Step 3: Clone Repository**
```bash
# Clone the repository
git clone https://github.com/Momin010/MominAI-Beta-1.git
cd MominAI-Beta-1

# If you want a specific version (optional)
# git checkout main
```

### **Step 4: Setup Directory Structure**
```bash
# Create user workspace directory
sudo mkdir -p /home/ide/users
sudo chown -R $USER:$USER /home/ide

# Verify permissions
ls -la /home/ide/
```

### **Step 5: Install Server Dependencies**
```bash
# Navigate to server directory
cd server

# Install Node.js dependencies
npm install

# Verify installation
ls -la node_modules/
```

### **Step 6: Configure Environment (Optional)**
```bash
# Create environment file if needed
# Most settings use defaults, but you can customize:

# nano .env
# Add custom settings:
# PORT=3001
# USER_WORKSPACE_BASE=/home/ide/users
```

### **Step 7: Start the Server**
```bash
# Start the Docker containerized IDE server
npm start

# You should see output like:
# 🚀 Docker VM Bridge Server running on port 3001
# 📡 WebSocket endpoint: ws://localhost:3001
# 🐳 Docker Network: ide-network
# 📁 Workspace Base: /home/ide/users
# ⏱️ Session Timeout: 30 minutes
# 👥 Max Sessions: 50
```

### **Step 8: Setup Reverse Proxy (Optional but Recommended)**
```bash
# Install nginx
sudo apt update
sudo apt install nginx

# Create nginx configuration
sudo nano /etc/nginx/sites-available/ide

# Add this configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/ide /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### **Step 9: Setup SSL with Let's Encrypt (Optional)**
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Follow the prompts to configure SSL
```

---

## 🔍 **VERIFICATION STEPS**

### **Check Server Health:**
```bash
# Test health endpoint
curl http://localhost:3001/health

# Should return JSON like:
{
  "status": "ok",
  "sessions": 0,
  "containers": 0,
  "docker": true,
  "uptime": 123.45
}
```

### **Check Docker Containers:**
```bash
# List running containers
docker ps

# Check Docker networks
docker network ls

# Should see 'ide-network' created automatically
```

### **Test WebSocket Connection:**
```bash
# Use a WebSocket testing tool or browser
# Connect to: ws://your-server-ip:3001/session/test123
```

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues:**

#### **1. Docker Permission Denied:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again, or run:
newgrp docker
```

#### **2. Port Already in Use:**
```bash
# Check what's using port 3001
sudo lsof -i :3001

# Kill the process or change port in .env
# PORT=3002
```

#### **3. Docker Network Issues:**
```bash
# Remove and recreate network
docker network rm ide-network
docker network create ide-network
```

#### **4. Workspace Permission Issues:**
```bash
# Fix permissions
sudo chown -R $USER:$USER /home/ide
chmod 755 /home/ide
```

#### **5. Server Not Starting:**
```bash
# Check logs
cd server
npm start 2>&1 | tee server.log

# Check for Docker availability
docker version
```

---

## 📊 **MONITORING & MANAGEMENT**

### **View Active Sessions:**
```bash
# Check server health
curl http://localhost:3001/health

# View specific session
curl http://localhost:3001/session/session123
```

### **Manage Docker Containers:**
```bash
# List all IDE containers
docker ps --filter name=ide_session

# View container logs
docker logs ide_session_abc123

# Stop specific container
docker kill ide_session_abc123
```

### **Server Management:**
```bash
# Restart server
cd MominAI-Beta-1/server
npm start

# Stop server (Ctrl+C)

# Run in background with PM2
npm install -g pm2
pm2 start index.js --name "ide-server"
pm2 save
pm2 startup
```

---

## 🔒 **SECURITY CONSIDERATIONS**

### **✅ Already Implemented:**
- **Container Isolation**: Each user in separate Docker container
- **Resource Limits**: CPU (0.5 cores) and memory (512MB) per user
- **File System Isolation**: Per-user workspace directories
- **Network Isolation**: Custom Docker network
- **Idle Cleanup**: Automatic session cleanup after 30 minutes

### **🔧 Additional Security (Optional):**

#### **1. Firewall Configuration:**
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3001/tcp  # IDE Server
sudo ufw --force enable
```

#### **2. SSL/TLS Encryption:**
```bash
# Already covered in Step 9
# Use Let's Encrypt for free SSL certificates
```

#### **3. User Authentication (Future):**
```bash
# Consider adding authentication layer
# - JWT tokens
# - OAuth integration
# - API key authentication
```

---

## 📈 **SCALING CONSIDERATIONS**

### **Current Limits:**
- **50 concurrent users** (configurable)
- **512MB RAM per user**
- **0.5 CPU cores per user**
- **30-minute idle timeout**

### **Scaling Up:**
```bash
# Increase limits in server/index.js
const CONFIG = {
    MAX_SESSIONS: 100,        // More users
    CONTAINER_MEMORY_LIMIT: '1g',  // More RAM
    CONTAINER_CPU_LIMIT: '1.0',    // More CPU
    SESSION_IDLE_TIMEOUT: 60 * 60 * 1000  // 1 hour timeout
};
```

### **Load Balancing (Advanced):**
```bash
# Use nginx for load balancing
# Deploy multiple server instances
# Use Redis for session sharing
```

---

## 🎯 **ACCESS YOUR IDE**

### **Direct Access:**
```
http://your-server-ip:3001
```

### **Domain Access (with nginx):**
```
http://your-domain.com
```

### **SSL Access (with Let's Encrypt):**
```
https://your-domain.com
```

---

## 🚨 **EMERGENCY COMMANDS**

### **Stop All Containers:**
```bash
# Stop all IDE containers
docker kill $(docker ps -q --filter name=ide_session)

# Remove all stopped containers
docker container prune -f
```

### **Reset Everything:**
```bash
# Stop server
pkill -f "node.*index.js"

# Clean up Docker
docker system prune -a -f

# Reset workspace
sudo rm -rf /home/ide/users/*
```

### **Full System Restart:**
```bash
# Restart Docker
sudo systemctl restart docker

# Restart nginx (if used)
sudo systemctl restart nginx

# Restart IDE server
cd MominAI-Beta-1/server && npm start
```

---

## 🎉 **SUCCESS CHECKLIST**

- ✅ **Docker installed and running**
- ✅ **Repository cloned**
- ✅ **Dependencies installed**
- ✅ **Workspace directory created**
- ✅ **Server started successfully**
- ✅ **Health endpoint returns OK**
- ✅ **WebSocket connections work**
- ✅ **Multiple users can connect**
- ✅ **Containers auto-create per user**
- ✅ **File system isolation working**
- ✅ **Resource limits enforced**

---

## 📞 **SUPPORT**

If you encounter issues:

1. **Check server logs**: `cd server && npm start 2>&1 | tee logs.txt`
2. **Verify Docker**: `docker version && docker ps`
3. **Test connectivity**: `curl http://localhost:3001/health`
4. **Check permissions**: `ls -la /home/ide/`
5. **Review firewall**: `sudo ufw status`

**Your multi-user IDE is now live and ready for production use!** 🚀✨

**Multiple users can now collaborate simultaneously with complete isolation and security!** 🐳🔒