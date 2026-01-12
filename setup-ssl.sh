#!/bin/bash

# SSL Setup Script for Digital Ocean Droplet
# This script installs Nginx and sets up SSL with Let's Encrypt

set -e

echo "🔒 SSL Setup Script for Aziz Bot"
echo "================================"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root" 
   exit 1
fi

# Get domain name
read -p "Enter your domain name (e.g., bot.example.com): " DOMAIN
read -p "Enter your email for SSL certificate: " EMAIL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "❌ Domain and email are required!"
    exit 1
fi

echo ""
echo "📋 Configuration:"
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo ""
read -p "Is this correct? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Nginx
echo "🌐 Installing Nginx..."
apt install nginx -y

# Install Certbot
echo "🔐 Installing Certbot..."
apt install certbot python3-certbot-nginx -y

# Stop Nginx temporarily
systemctl stop nginx

# Create initial Nginx config
echo "📝 Creating Nginx configuration..."
cat > /etc/nginx/sites-available/aziz_bot << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/aziz_bot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
echo "✅ Testing Nginx configuration..."
nginx -t

# Start Nginx
echo "▶️  Starting Nginx..."
systemctl start nginx
systemctl enable nginx

# Get SSL certificate
echo "🔒 Obtaining SSL certificate..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

# Test SSL renewal
echo "🔄 Testing SSL certificate renewal..."
certbot renew --dry-run

# Setup auto-renewal
echo "⏰ Setting up automatic SSL renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 'Nginx Full'
ufw allow 22/tcp
ufw --force enable

# Reload Nginx
systemctl reload nginx

echo ""
echo "✅ SSL setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Point your domain DNS A record to this server's IP"
echo "2. Wait for DNS propagation (5-30 minutes)"
echo "3. Test your site: https://$DOMAIN"
echo "4. Check SSL: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo ""
echo "🔧 Useful commands:"
echo "  - View Nginx status: systemctl status nginx"
echo "  - View SSL certificates: certbot certificates"
echo "  - Renew SSL manually: certbot renew"
echo "  - View Nginx logs: tail -f /var/log/nginx/error.log"
echo ""
