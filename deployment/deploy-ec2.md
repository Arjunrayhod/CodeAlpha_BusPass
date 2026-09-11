# AWS EC2 Deployment Guide (Backend API)

This guide walks you through deploying the Python Flask Backend on a zero-cost **AWS Academy EC2 t2.micro** instance.

---

## Step 1: Launch EC2 Instance on AWS Academy
1. Open AWS Academy Learner Lab / AWS Console.
2. Navigate to **EC2 Console** -> **Launch Instance**.
3. **Name**: `CloudBus-Backend-EC2`
4. **AMI**: Ubuntu 22.04 LTS or 24.04 LTS (Free tier eligible).
5. **Instance Type**: `t2.micro` (1 vCPU, 1 GB RAM - Free Tier).
6. **Key Pair**: Select your key pair or create `vockey.pem` / `buspass-key.pem`.
7. **Network Settings / Security Group**:
   - Check **Allow SSH traffic from anywhere (0.0.0.0/0)** (Port 22).
   - Click **Add security group rule**:
     - **Type**: Custom TCP
     - **Port Range**: `5000`
     - **Source**: Anywhere (`0.0.0.0/0`)
8. Click **Launch Instance**.

---

## Step 2: Connect to EC2 via SSH
From your local terminal (PowerShell, Command Prompt, or Git Bash):
```bash
ssh -i /path/to/your-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
```

---

## Step 3: Transfer Files & Run Automated Setup
You can either clone your git repository or copy the backend folder using `scp`:

```bash
# Option A: Using SCP to copy backend folder to EC2
scp -i /path/to/your-key.pem -r ./backend ubuntu@<YOUR_EC2_PUBLIC_IP>:/home/ubuntu/cloudbus/
scp -i /path/to/your-key.pem ./deployment/ec2_setup.sh ubuntu@<YOUR_EC2_PUBLIC_IP>:/home/ubuntu/

# On the EC2 server:
chmod +x /home/ubuntu/ec2_setup.sh
/home/ubuntu/ec2_setup.sh
```

---

## Step 4: Verify Backend Health
On EC2:
```bash
curl http://localhost:5000/api/health
```

From your local browser:
```
http://<YOUR_EC2_PUBLIC_IP>:5000/api/health
```
Response:
```json
{
  "service": "CloudBus Pass System API",
  "status": "online"
}
```

---

## Useful System Commands
- **Check Status**: `sudo systemctl status cloudbus`
- **Restart API**: `sudo systemctl restart cloudbus`
- **View Live Logs**: `sudo journalctl -u cloudbus -f`
- **Stop API**: `sudo systemctl stop cloudbus`