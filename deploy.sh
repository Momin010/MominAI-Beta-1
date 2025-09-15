#!/bin/bash

# MominAI Production Deployment Script
# This script deploys the complete MominAI platform to production

set -e  # Exit on any error

echo "🚀 Starting MominAI Production Deployment..."

# Configuration
FRONTEND_DIR="./"
BACKEND_DIR="./server"
DOMAIN="yourdomain.com"
EMAIL="admin@yourdomain.com"
SSL_EMAIL="$EMAIL"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root for security reasons"
        exit 1
    fi
}

# Check system requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    log_success "All requirements met!"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Install frontend dependencies
    log_info "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm install --production=false
    
    # Install backend dependencies
    log_info "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    npm install --production=true
    
    cd ..
    log_success "Dependencies installed successfully!"
}

# Setup environment files
setup_environment() {
    log_info "Setting up environment configuration..."
    
    # Check if .env files exist
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        if [ -f "$BACKEND_DIR/env.example" ]; then
            cp "$BACKEND_DIR/env.example" "$BACKEND_DIR/.env"
            log_warning "Created .env file from example. Please configure it with your actual values."
        else
            log_error "No environment configuration found. Please create .env files."
            exit 1
        fi
    fi
    
    # Check if frontend .env exists
    if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
        if [ -f "$FRONTEND_DIR/.env.example" ]; then
            cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env.local"
            log_warning "Created .env.local file from example. Please configure it."
        fi
    fi
    
    log_success "Environment configuration setup complete!"
}

# Build frontend
build_frontend() {
    log_info "Building frontend for production..."
    
    cd "$FRONTEND_DIR"
    
    # Build the application
    npm run build
    
    if [ $? -eq 0 ]; then
        log_success "Frontend build completed successfully!"
    else
        log_error "Frontend build failed!"
        exit 1
    fi
    
    cd ..
}

# Setup SSL certificates
setup_ssl() {
    log_info "Setting up SSL certificates..."
    
    # Install certbot if not already installed
    if ! command -v certbot &> /dev/null; then
        log_info "Installing certbot..."
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    fi
    
    # Generate SSL certificate
    log_info "Generating SSL certificate for $DOMAIN..."
    sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --email "$SSL_EMAIL" --agree-tos --non-interactive
    
    if [ $? -eq 0 ]; then
        log_success "SSL certificate generated successfully!"
    else
        log_warning "SSL certificate generation failed. You may need to configure it manually."
    fi
}

# Configure Nginx
setup_nginx() {
    log_info "Setting up Nginx configuration..."
    
    # Create Nginx configuration
    cat > /tmp/mominai.conf << EOF
# MominAI Nginx Configuration
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Frontend (React app)
    location / {
        root /var/www/mominai;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # WebSocket connections
    location /ws/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
EOF
    
    # Copy configuration to Nginx
    sudo cp /tmp/mominai.conf /etc/nginx/sites-available/mominai
    sudo ln -sf /etc/nginx/sites-available/mominai /etc/nginx/sites-enabled/
    
    # Remove default site
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        sudo systemctl reload nginx
        log_success "Nginx configuration updated successfully!"
    else
        log_error "Nginx configuration test failed!"
        exit 1
    fi
}

# Deploy backend
deploy_backend() {
    log_info "Deploying backend services..."
    
    cd "$BACKEND_DIR"
    
    # Create logs directory
    mkdir -p logs
    
    # Start services with Docker Compose
    docker-compose down || true
    docker-compose up -d --build
    
    if [ $? -eq 0 ]; then
        log_success "Backend services deployed successfully!"
    else
        log_error "Backend deployment failed!"
        exit 1
    fi
    
    cd ..
}

# Deploy frontend
deploy_frontend() {
    log_info "Deploying frontend..."
    
    # Create web directory
    sudo mkdir -p /var/www/mominai
    
    # Copy built files
    sudo cp -r "$FRONTEND_DIR/dist"/* /var/www/mominai/
    
    # Set permissions
    sudo chown -R www-data:www-data /var/www/mominai
    sudo chmod -R 755 /var/www/mominai
    
    log_success "Frontend deployed successfully!"
}

# Setup monitoring
setup_monitoring() {
    log_info "Setting up monitoring and logging..."
    
    # Create logrotate configuration
    sudo tee /etc/logrotate.d/mominai > /dev/null << EOF
/var/log/mominai/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
EOF
    
    # Setup systemd service for backend
    sudo tee /etc/systemd/system/mominai-backend.service > /dev/null << EOF
[Unit]
Description=MominAI Backend Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$BACKEND_DIR
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable mominai-backend
    
    log_success "Monitoring setup complete!"
}

# Run health checks
health_check() {
    log_info "Running health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check backend health
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_success "Backend health check passed!"
    else
        log_error "Backend health check failed!"
        exit 1
    fi
    
    # Check frontend
    if curl -f http://localhost/ > /dev/null 2>&1; then
        log_success "Frontend health check passed!"
    else
        log_error "Frontend health check failed!"
        exit 1
    fi
    
    log_success "All health checks passed!"
}

# Main deployment function
main() {
    log_info "Starting MominAI deployment to $DOMAIN..."
    
    check_root
    check_requirements
    install_dependencies
    setup_environment
    build_frontend
    setup_nginx
    deploy_backend
    deploy_frontend
    setup_monitoring
    
    # SSL setup (optional, can be done manually)
    read -p "Do you want to setup SSL certificates automatically? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_ssl
    else
        log_warning "SSL setup skipped. Please configure SSL manually."
    fi
    
    health_check
    
    log_success "🎉 MominAI deployment completed successfully!"
    log_info "Your application is now available at: https://$DOMAIN"
    log_info "Backend API: https://$DOMAIN/api/"
    log_info "Health check: https://$DOMAIN/health"
    
    echo
    log_info "Next steps:"
    echo "1. Configure your domain DNS to point to this server"
    echo "2. Update your .env files with production values"
    echo "3. Test all functionality"
    echo "4. Set up monitoring and alerts"
    echo "5. Configure backups"
}

# Run main function
main "$@"
