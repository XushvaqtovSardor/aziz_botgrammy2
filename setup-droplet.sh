#!/bin/bash

# Initial Digital Ocean Droplet Setup Script
# Run this script on your droplet for the first time setup
# Usage: bash setup-droplet.sh

set -e

echo "🚀 Starting Digital Ocean Droplet Setup for Aziz Bot"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

echo "📦 Step 1: Updating system packages..."
apt update && apt upgrade -y
echo -e "${GREEN}✅ System updated${NC}"
echo ""

echo "📦 Step 2: Installing required packages..."
apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    git \
    ufw \
    htop \
    nano \
    vim \
    unzip \
    wget
echo -e "${GREEN}✅ Required packages installed${NC}"
echo ""

echo "🐳 Step 3: Installing Docker..."
# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Enable and start Docker
systemctl enable docker
systemctl start docker

echo -e "${GREEN}✅ Docker installed${NC}"
docker --version
echo ""

echo "🐳 Step 4: Installing Docker Compose..."
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

echo -e "${GREEN}✅ Docker Compose installed${NC}"
docker-compose --version
echo ""

echo "🔥 Step 5: Configuring firewall..."
# Configure UFW
ufw --force enable
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw default deny incoming
ufw default allow outgoing

echo -e "${GREEN}✅ Firewall configured${NC}"
ufw status
echo ""

echo "📁 Step 6: Creating project directory..."
mkdir -p /opt/aziz_bot
mkdir -p /opt/backups
mkdir -p /var/log/aziz_bot

echo -e "${GREEN}✅ Directories created${NC}"
echo ""

echo "🔒 Step 7: Configuring SSH security..."
# Backup SSH config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Configure SSH (uncomment these if you want to disable password authentication)
# sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
# sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
# sed -i 's/PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config

# Restart SSH
systemctl restart sshd

echo -e "${GREEN}✅ SSH configured${NC}"
echo -e "${YELLOW}⚠️  Password authentication is still enabled. Disable it after setting up SSH keys.${NC}"
echo ""

echo "🛡️  Step 8: Installing Fail2Ban..."
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
EOF

systemctl restart fail2ban

echo -e "${GREEN}✅ Fail2Ban installed and configured${NC}"
echo ""

echo "⏰ Step 9: Configuring automatic updates..."
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

echo -e "${GREEN}✅ Automatic updates configured${NC}"
echo ""

echo "📊 Step 10: Installing monitoring tools..."
apt install -y htop iotop nethogs

echo -e "${GREEN}✅ Monitoring tools installed${NC}"
echo ""

echo "🎉 Droplet setup completed!"
echo ""
echo "=================================================="
echo "📋 Next Steps:"
echo "=================================================="
echo ""
echo "1. Clone your repository:"
echo "   cd /opt/aziz_bot"
echo "   git clone https://github.com/gaday078-spec/aziz_bot.git ."
echo ""
echo "2. Create .env file:"
echo "   cp .env.example .env"
echo "   nano .env"
echo ""
echo "3. Deploy the application:"
echo "   chmod +x deploy.sh"
echo "   ./deploy.sh"
echo ""
echo "4. (Optional) Disable password authentication:"
echo "   nano /etc/ssh/sshd_config"
echo "   Set: PasswordAuthentication no"
echo "   systemctl restart sshd"
echo ""
echo "=================================================="
echo "📊 System Information:"
echo "=================================================="
echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker-compose --version)"
echo "Disk space:"
df -h /
echo ""
echo "Memory:"
free -m
echo ""
echo "Firewall status:"
ufw status numbered
echo ""
echo "✅ Setup complete! Your droplet is ready for deployment."
