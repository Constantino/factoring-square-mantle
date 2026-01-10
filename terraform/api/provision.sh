#!/bin/bash
set -e

# Update system
apt-get update
apt-get upgrade -y

# Install basic dependencies
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common

# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install PM2 globally (process manager)
npm install -g pm2


# Create application directory
mkdir -p /home/ubuntu/api
chown -R ubuntu:ubuntu /home/ubuntu/api

# Configure PM2 to start on boot
env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Install UFW firewall
apt-get install -y ufw

# Configure firewall
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3001/tcp  # Application port
ufw --force enable

echo "✅ Provisioning complete!"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "PM2 installed: $(pm2 --version)"
