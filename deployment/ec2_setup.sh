#!/bin/bash
# ==============================================================================
# CloudBus System - AWS EC2 Backend Automated Setup Script
# Target OS: Ubuntu 22.04 LTS / 24.04 LTS (t2.micro Free Tier)
# ==============================================================================

set -e

echo "[1/6] Updating system packages..."
sudo apt update && sudo apt upgrade -y

echo "[2/6] Installing Python 3, pip, venv, and build dependencies..."
sudo apt install -y python3 python3-pip python3-venv git curl ufw

echo "[3/6] Setting up application directory at /home/ubuntu/cloudbus..."
mkdir -p /home/ubuntu/cloudbus/backend/static/tickets/qr
mkdir -p /home/ubuntu/cloudbus/backend/static/tickets/pdf

cd /home/ubuntu/cloudbus/backend

echo "[4/6] Creating Python virtual environment and installing dependencies..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "[5/6] Creating systemd background service (cloudbus.service)..."
sudo tee /etc/systemd/system/cloudbus.service > /dev/null <<EOF
[Unit]
Description=CloudBus Flask Backend API Server
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/cloudbus/backend
ExecStart=/home/ubuntu/cloudbus/backend/venv/bin/python app.py
Restart=always
RestartSec=5
Environment=PORT=5000
Environment=SECRET_KEY=cloudbus-production-secret-codealpha

[Install]
WantedBy=multi-user.target
EOF

echo "[6/6] Reloading systemd, enabling and starting CloudBus service..."
sudo systemctl daemon-reload
sudo systemctl enable cloudbus
sudo systemctl restart cloudbus

echo "Configuring Firewall to allow Port 5000 and Port 22..."
sudo ufw allow 22/tcp || true
sudo ufw allow 5000/tcp || true

echo "=============================================================================="
echo "CloudBus Backend is now running in background on Port 5000!"
echo "Check status anytime with: sudo systemctl status cloudbus"
echo "View live logs with      : sudo journalctl -u cloudbus -f"
echo "Test API with            : curl http://localhost:5000/api/health"
echo "=============================================================================="