# 🎯 **ACTIONABLE MominAI Deployment Guide**
## **What YOU Do vs What Your Uncle Does**

**Date:** September 14, 2025
**Goal:** Get MominAI live on `mominai.dev` in 2 hours

---

## 📋 **IMMEDIATE ACTION ITEMS (Do These NOW)**

### **YOU (Momin) - Do These First:**

#### **1. Purchase Domain (5 minutes)**
- Go to https://namecheap.com or https://godaddy.com
- Search for `mominai.dev`
- Purchase domain (~$10/year)
- **Note domain provider and login credentials**

#### **2. Choose Hosting Provider (5 minutes)**
Choose ONE of these (all ~$5-10/month):
- **Hostinger**: https://hostinger.com (easiest for beginners)
- **DigitalOcean**: https://digitalocean.com (developer-friendly)
- **Vultr**: https://vultr.com (good performance)

**Create account and note login credentials**

#### **3. Prepare Your Files (10 minutes)**
```bash
# Build production frontend
npm run build

# Verify build output
ls -la dist/

# Create deployment package for uncle
mkdir ../mominai-deployment
cp -r . ../mominai-deployment/
cd ../mominai-deployment

# Remove unnecessary files
rm -rf node_modules .git

# Create zip for easy transfer
zip -r mominai-deployment.zip .
```

#### **4. Send Email to Uncle (5 minutes)**
Use this exact email:

---

**Subject:** MominAI Server Setup - Ready to Deploy! 🚀

**Body:**
```
Assalamu Alaikum Ja Amu,

I'm ready to deploy MominAI! Here's exactly what I need you to do:

🔧 **YOUR TASKS (Server Setup):**

1. **Install MySQL** on your server:
   sudo apt update
   sudo apt install mysql-server
   sudo mysql_secure_installation

2. **Create Database & User**:
   sudo mysql -u root -p
   CREATE DATABASE mominai_db;
   CREATE USER 'mominai_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';
   GRANT ALL PRIVILEGES ON mominai_db.* TO 'mominai_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;

3. **Install Docker & Tools**:
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo apt install nginx git unzip

4. **Wait for my files** - I'll send you the deployment package

⏰ **Time needed:** 30 minutes
💰 **Cost:** $0 (using your existing server)

When you're done with steps 1-3, reply "READY" and I'll send the files!

Shukran,
Momin
```

---

## 🔄 **DEPLOYMENT SEQUENCE**

### **PHASE 1: Uncle's Server Setup (30 minutes)**

**UNCLE'S TASKS:**
```bash
# 1. Install MySQL
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# 2. Create database
sudo mysql -u root -p
CREATE DATABASE mominai_db;
CREATE USER 'mominai_user'@'localhost' IDENTIFIED BY 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON mominai_db.* TO 'mominai_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 3. Install Docker & nginx
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install nginx git unzip

# 4. Reply "READY" to Momin
```

**YOUR RESPONSE when uncle says "READY":**
- Send him the `mominai-deployment.zip` file
- Tell him the MySQL password you want him to use

---

### **PHASE 2: Deploy Backend (20 minutes)**

**UNCLE'S TASKS:**
```bash
# 1. Extract files
unzip mominai-deployment.zip
cd mominai-deployment

# 2. Configure environment
nano server/.env
# Add: DB_PASSWORD=the_password_you_told_me

# 3. Deploy with Docker
docker-compose up -d --build

# 4. Check if running
docker-compose ps
curl http://localhost:3001/health
```

**YOUR TASKS (while uncle does this):**
- Purchase and set up domain (`mominai.dev`)
- Set up hosting account
- Prepare frontend files for upload

---

### **PHASE 3: Domain & SSL Setup (15 minutes)**

**UNCLE'S TASKS:**
```bash
# 1. Configure nginx for backend
sudo nano /etc/nginx/sites-available/mominai-backend

# Add this:
server {
    listen 80;
    server_name dev.mominai.dev;

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

# 2. Enable site
sudo ln -s /etc/nginx/sites-available/mominai-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 3. Install SSL
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d dev.mominai.dev
```

**YOUR TASKS:**
- Point `dev.mominai.dev` to uncle's server IP in domain settings
- Point `mominai.dev` to your hosting IP

---

### **PHASE 4: Deploy Frontend (10 minutes)**

**YOUR TASKS:**
```bash
# 1. Upload dist/ folder to hosting
# Use File Manager in hosting control panel
# Upload entire 'dist' folder to public_html

# 2. Set environment variables in hosting
# In cPanel/Plesk: Add these environment variables:
VITE_OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
VITE_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY
VITE_API_BASE_URL=https://dev.mominai.dev

# 3. Enable SSL in hosting (usually 1-click)
```

---

### **PHASE 5: Final Testing (10 minutes)**

**UNCLE'S TASKS:**
```bash
# Test backend
curl https://dev.mominai.dev/health
# Should return: {"status":"ok",...}
```

**YOUR TASKS:**
```bash
# Test frontend
# Visit: https://mominai.dev
# Should load landing page

# Test full integration
# Visit: https://dev.mominai.dev/health
# Should return backend health status
```

---

## 📞 **COMMUNICATION SCRIPT**

### **When Uncle Says "READY":**
```
Perfect! Here's what to do next:

1. MySQL password to use: [YOUR_CHOSEN_PASSWORD]
2. I'm sending you mominai-deployment.zip now
3. After extracting, run: docker-compose up -d --build
4. Tell me when it's running and I'll handle the domain setup
```

### **When Uncle Says "Backend Deployed":**
```
Great! Now I need:
1. Your server IP address for DNS
2. Confirm SSL certificate was installed

I'll set up the domains and frontend now.
```

### **When Everything is Ready:**
```
🎉 DEPLOYMENT COMPLETE!

Frontend: https://mominai.dev
Backend: https://dev.mominai.dev

Test these URLs and let me know if everything works!
```

---

## 🚨 **TROUBLESHOOTING QUICK FIXES**

### **If Docker fails:**
**Uncle runs:**
```bash
sudo systemctl restart docker
docker-compose down
docker-compose up -d --build
```

### **If MySQL fails:**
**Uncle runs:**
```bash
sudo systemctl restart mysql
mysql -u mominai_user -p mominai_db -e "SELECT 1;"
```

### **If nginx fails:**
**Uncle runs:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### **If SSL fails:**
**Uncle runs:**
```bash
sudo certbot --nginx -d dev.mominai.dev
```

---

## ✅ **SUCCESS CHECKLIST**

### **Uncle's Checklist:**
- [ ] MySQL installed and database created
- [ ] Docker installed and running
- [ ] nginx installed and configured
- [ ] SSL certificate installed
- [ ] Backend responding on https://dev.mominai.dev/health

### **Your Checklist:**
- [ ] Domain purchased (mominai.dev)
- [ ] Hosting account created
- [ ] Frontend uploaded and SSL enabled
- [ ] https://mominai.dev loads
- [ ] https://dev.mominai.dev/health works

---

## ⏰ **TIMELINE SUMMARY**

- **T-0**: Send email to uncle
- **T-30min**: Uncle completes server setup
- **T-60min**: Backend deployed
- **T-75min**: Domains & SSL configured
- **T-85min**: Frontend deployed
- **T-90min**: Testing complete
- **T-90min**: 🎉 LIVE!

**Total Time: 1.5 hours**

---

## 💰 **COST BREAKDOWN**

- **Domain**: $10-15/year (mominai.dev)
- **Hosting**: $5-10/month (frontend)
- **Uncle's Server**: $0 (existing)
- **SSL**: $0 (Let's Encrypt)
- **Total**: ~$15/month

---

**Ready to send that email? This guide gives both of you crystal-clear, actionable steps!** 🚀