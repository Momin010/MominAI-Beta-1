# 🚀 COMPLETE MominAI Go-Live Guide
## Step-by-Step Instructions for Deploying to Your Uncle's Server

**Last Updated:** September 14, 2025
**Version:** 1.0

---

## 📋 **OVERVIEW**

This guide will take you from local development to full production deployment on your uncle's cloud server. We'll deploy:

- **Frontend**: React/Vite app on mominai.dev (your custom domain)
- **Backend**: Node.js + Docker on your uncle's Ubuntu server
- **Database**: MySQL (local installation)
- **Domain**: mominai.dev with SSL

**Total Time:** 2-3 hours
**Difficulty:** Beginner-Friendly
**Cost:** ~$10-20/month (domain + minimal hosting)

---

## 🎯 **WHAT WE'LL ACCOMPLISH**

✅ **Landing Page**: `https://mominai.dev`
✅ **IDE Platform**: `https://dev.mominai.dev`
✅ **Secure Connections**: SSL certificates everywhere
✅ **User Isolation**: Each user gets their own Docker container
✅ **AI Integration**: Multi-modal AI (OpenAI + Google + OpenRouter)
✅ **Database**: MySQL with automated table creation
✅ **Payment Processing**: Stripe integration ready

---

## 📋 **PREREQUISITES CHECKLIST**

### **What You Need:**
- [ ] GitHub account
- [ ] Domain name (mominai.dev) - $10-15/year
- [ ] Web hosting (Hostinger/DigitalOcean) - $5-10/month
- [ ] Stripe account (free to start)
- [ ] OpenRouter API key ($5 credit)
- [ ] Google AI API key (free tier available)
- [ ] OpenAI API key (optional, for ChatGPT)

### **What Your Uncle Provides:**
- [ ] Ubuntu server access
- [ ] Root/sudo permissions
- [ ] Internet connection
- [ ] Server IP address

---

## 🚀 **STEP-BY-STEP DEPLOYMENT**

### **STEP 1: Prepare Your Local Environment (15 minutes)**

#### **1.1 Update Environment Variables**
```bash
# Copy environment templates
cp .env.example .env
cp server/.env.example server/.env
```

#### **1.2 Get Your API Keys**
1. **OpenRouter API**: https://openrouter.ai/keys
   - Sign up and get your API key
   - Add $5 credit for testing

2. **Google AI API**: https://makersuite.google.com/app/apikey
   - Create API key (free tier available)
   - Enable Generative AI API

3. **OpenAI API** (Optional): https://platform.openai.com/api-keys
   - Create API key for ChatGPT access
   - Add credits for testing

4. **Stripe Setup** (Optional for now):
   - Go to https://stripe.com
   - Create account
   - Get publishable and secret keys

#### **1.3 Update .env Files**
Edit your `.env` file:
```env
# MULTI-MODAL AI APIs (All keys provided)
VITE_OPENROUTER_API_KEY=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
OPENAI_API_KEY=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
GOOGLE_API_KEY=AIzaSyArqz2wZq_KiokUYrvhWn8oEfRlUFHCFaQ

# Database - MySQL (will be configured on server)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mominai_db
DB_USER=mominai_user
DB_PASSWORD=your_secure_mysql_password_here

# Payments
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51RVscQRuLspPzO0ET5AGii3dnImVLTV3z6hjwqYRlHcCwmWrSlmcAvuLGczS9ntA0KAZcOxHM8kMs8EJ4G1J6KzF00csfuowX0
STRIPE_SECRET_KEY=sk_test_51RVscQRuLspPzO0EGaoA6yEtm2lqkjY2LuVkJwruto8PcWgYFxDdmDoJjklEpno6ZqScVAcYcIEHFMAyfRqfF7up00mJvDCSS9
```

Edit `server/.env`:
```env
# Production settings
NODE_ENV=production
PORT=3001

# CORS - Update with your domains
CORS_ORIGINS=https://mominai.dev,https://www.mominai.dev,https://dev.mominai.dev

# Database - MySQL (matches frontend config)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mominai_db
DB_USER=mominai_user
DB_PASSWORD=your_secure_mysql_password_here

# AI APIs (same as frontend)
OPENAI_API_KEY=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
GOOGLE_API_KEY=AIzaSyArqz2wZq_KiokUYrvhWn8oEfRlUFHCFaQ
VITE_OPENROUTER_API_KEY=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
```

#### **1.4 Test Locally**
```bash
# Test frontend
npm run dev

# Test backend (new terminal)
cd server && npm run dev

# Test health endpoint
curl http://localhost:3001/health
```

---

### **STEP 2: Deploy Frontend to mominai.dev (25 minutes)**

#### **2.1 Build Production Bundle**
```bash
# Build the frontend for production
npm run build

# Verify build output
ls -la dist/
```

#### **2.2 Choose Web Hosting Provider**
Choose one of these affordable options:
- **Hostinger**: $5-10/month, easy cPanel
- **DigitalOcean**: $6/month, developer-friendly
- **Vultr**: $6/month, high performance
- **Linode**: $5/month, good support

#### **2.3 Upload Files to Hosting**
1. **Create hosting account** and purchase mominai.dev domain
2. **Upload dist/ folder** to your web hosting public_html directory
3. **Set up domain**: Point mominai.dev to your hosting IP

#### **2.4 Configure Environment Variables**
Create a `.env` file in your hosting control panel or .htaccess:
```env
# Add these to your hosting environment
VITE_OPENROUTER_API_KEY=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
OPENAI_API_KEY=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
GOOGLE_API_KEY=AIzaSyArqz2wZq_KiokUYrvhWn8oEfRlUFHCFaQ
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51RVscQRuLspPzO0ET5AGii3dnImVLTV3z6hjwqYRlHcCwmWrSlmcAvuLGczS9ntA0KAZcOxHM8kMs8EJ4G1J6KzF00csfuowX0
```

#### **2.5 Test Deployment**
- Visit https://mominai.dev
- Check that all assets load correctly
- Test basic navigation

---

### **STEP 3: Prepare Backend for Server Deployment (10 minutes)**

#### **3.1 Build Backend Dependencies**
```bash
cd server
npm install
npm run build  # if you have build scripts
```

#### **3.2 Create Deployment Package**
```bash
# Create deployment directory
mkdir ../deployment
cp -r . ../deployment/
cd ../deployment

# Remove unnecessary files
rm -rf node_modules
rm -rf .git
```

#### **3.3 Test Docker Build Locally**
```bash
# Build Docker image
docker-compose build

# Test container
docker-compose up -d
docker-compose logs -f
```

---

### **STEP 4: Server Setup with Your Uncle (30 minutes)**

#### **4.1 Send Email to Your Uncle**
Use this email template (provided below) to coordinate with your uncle.

#### **4.2 Your Uncle's Server Setup**
Your uncle needs to run these commands on his Ubuntu server:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install nginx
sudo apt install -y nginx

# Start services
sudo systemctl start docker
sudo systemctl enable docker
sudo systemctl start nginx
sudo systemctl enable nginx

# Install Git
sudo apt install -y git

# Create project directory
mkdir -p ~/mominai-backend
cd ~/mominai-backend
```

#### **4.3 Upload Project Files**
Your uncle can download the project:
```bash
# Clone from GitHub
git clone https://github.com/yourusername/MominAI.git .
cd MominAI
```

Or you can send him the deployment package via email/file sharing.

---

### **STEP 5: Deploy Backend on Server (30 minutes)**

#### **5.1 Setup MySQL Database**
Your uncle runs:
```bash
# Install MySQL server
sudo apt update
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p

# In MySQL shell:
CREATE DATABASE mominai_db;
CREATE USER 'mominai_user'@'localhost' IDENTIFIED BY 'your_secure_mysql_password_here';
GRANT ALL PRIVILEGES ON mominai_db.* TO 'mominai_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Test MySQL connection
mysql -u mominai_user -p mominai_db -e "SELECT 1;"
```

#### **5.2 Configure Environment**
Your uncle runs:
```bash
cd ~/mominai-backend

# Copy environment file
cp server/.env.example server/.env

# Edit with production values and MySQL credentials
nano server/.env
```

He needs to update the `.env` with your production values and the MySQL password he just created.

#### **5.2 Deploy with Docker**
```bash
# Build and start
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f mominai-backend
```

#### **5.3 Test Backend**
```bash
# Test health endpoint
curl http://localhost:3001/health

# Should return:
{
  "status": "ok",
  "sessions": 0,
  "containers": 0,
  "docker": true
}
```

---

### **STEP 6: Configure Domain and SSL (25 minutes)**

#### **6.1 Point Domain to Servers**
1. **Frontend Domain** (`mominai.dev`):
   - In your hosting control panel (Hostinger/DigitalOcean/etc.)
   - Point `mominai.dev` and `www.mominai.dev` to your hosting IP
   - Most hosting providers handle this automatically

2. **Backend Domain** (`dev.mominai.dev`):
   - Point `dev.mominai.dev` to your uncle's server IP
   - Add A record: `dev.mominai.dev` → `YOUR_SERVER_IP`
   - Add CNAME record: `www.dev.mominai.dev` → `dev.mominai.dev`

#### **6.2 Configure Nginx Reverse Proxy**
Your uncle runs:
```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/mominai-dev

# Add this configuration:
server {
    listen 80;
    server_name dev.mominai.com;

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

# Enable site
sudo ln -s /etc/nginx/sites-available/mominai-dev /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### **6.3 Setup SSL with Let's Encrypt**
```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL for backend
sudo certbot --nginx -d dev.mominai.dev

# Get SSL for frontend (through hosting provider)
# Most hosting providers (Hostinger, DigitalOcean) provide free SSL
# Just enable "Force HTTPS" in your hosting control panel
```

---

### **STEP 7: Final Integration and Testing (30 minutes)**

#### **7.1 Update Frontend to Point to Production**
In your hosting control panel, update environment variables:
```
VITE_API_BASE_URL=https://dev.mominai.dev
```

#### **7.2 Test Complete Flow**
1. **Frontend**: https://mominai.dev
2. **Backend Health**: https://dev.mominai.dev/health
3. **WebSocket Test**: Check browser console for connection
4. **AI Features**: Test multi-modal AI (OpenAI + Google + OpenRouter)
5. **Database**: Test user registration and project creation

#### **7.3 Test User Sessions**
```bash
# Create test session
curl -X POST https://dev.mominai.com/session \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user"}'

# Should return session info with Docker container
```

---

## 🔧 **TROUBLESHOOTING GUIDE**

### **Common Issues:**

#### **1. Docker Permission Denied**
```bash
# Fix permissions
sudo chmod 666 /var/run/docker.sock
# Or add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### **2. Port Already in Use**
```bash
# Check what's using port
sudo lsof -i :3001
sudo kill -9 <PID>
```

#### **3. SSL Certificate Issues**
```bash
# Renew certificates
sudo certbot renew
sudo systemctl reload nginx
```

#### **4. CORS Errors**
Update `server/.env`:
```env
CORS_ORIGINS=https://mominai.dev,https://www.mominai.dev,https://dev.mominai.dev
```

#### **5. Environment Variables Not Working**
```bash
# Check environment in container
docker-compose exec mominai-backend env
```

---

## 📊 **MONITORING & MAINTENANCE**

### **Daily Checks:**
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs --tail=50 mominai-backend

# Check disk usage
df -h

# Check memory usage
free -h
```

### **Weekly Maintenance:**
```bash
# Update Docker images
docker-compose pull

# Clean up old containers
docker system prune -f

# Check SSL certificates
sudo certbot certificates
```

---

## 🎯 **SUCCESS CHECKLIST**

- [ ] ✅ Frontend deployed on mominai.dev
- [ ] ✅ Backend running on uncle's server with MySQL
- [ ] ✅ Domain pointing correctly
- [ ] ✅ SSL certificates active
- [ ] ✅ Health endpoints responding
- [ ] ✅ WebSocket connections working
- [ ] ✅ Multi-modal AI working (OpenAI + Google + OpenRouter)
- [ ] ✅ MySQL database connected and tables created
- [ ] ✅ User sessions creating containers

---

## 📞 **SUPPORT & NEXT STEPS**

### **If Something Goes Wrong:**
1. Check server logs: `docker-compose logs mominai-backend`
2. Test health: `curl https://dev.mominai.com/health`
3. Check firewall: `sudo ufw status`
4. Verify DNS: `nslookup dev.mominai.com`

### **Next Steps After Launch:**
1. **User Testing**: Share with beta users
2. **Monitoring**: Set up uptime monitoring
3. **Analytics**: Add Google Analytics
4. **Scaling**: Monitor resource usage
5. **Backup**: Set up automated backups

---

## 🎉 **CONGRATULATIONS!**

Your MominAI platform is now live! 🚀

- **Landing Page**: https://mominai.dev
- **IDE Platform**: https://dev.mominai.dev
- **Secure**: SSL everywhere
- **Scalable**: Docker container per user
- **AI-Powered**: Multi-modal AI (OpenAI + Google + OpenRouter)
- **Database**: MySQL with automated table creation
- **Cost**: ~$15/month (domain + hosting)

**Share your success with users and start collecting feedback!**

---

*Need help? Check the troubleshooting section or contact support with your server logs.*