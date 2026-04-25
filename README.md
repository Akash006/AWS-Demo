# 🚀 QuickBites Cloud Demo (Full Hands-On Lab)

Build and deploy a **production-style scalable web app on AWS**.

---

## 🧠 What You Will Learn

- Launch and manage EC2 instances
- Deploy a Node.js app
- Use PM2 for process management
- Add Load Balancer & Auto Scaling
- Configure Domain (DNS)
- Enable HTTPS (SSL)
- Use DynamoDB (NoSQL DB)
- Use S3 (File Storage)

---

## 📦 Project Structure
```
quickbites-cloud-demo/
│
├── app/ # Backend (Node.js)
├── public/ # Frontend (HTML, CSS, JS)
├── scripts/
└── README.md
```
---
## ⚙️ Prerequisites
- AWS Account
- EC2 Key Pair (.pem file)
- Basic terminal knowledge
---

# 🧱 SERVER SETUP (EC2)
---
## Step 1: Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Select:
   - AMI: Ubuntu
   - Instance Type: t2.micro
3. Configure Security Group:
   - Allow:
     - SSH (22)
     - HTTP (80)
4. Launch and download key pair
---

## Step 2: Connect to EC2

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

## Step 3: Install Dependencies
```
sudo apt update -y
sudo apt install -y nodejs npm git
```
**Verify:**
```
node -v
npm -v
```

## Step 4: Clone Project
```
git clone https://github.com/YOUR_USERNAME/quickbites-cloud-demo.git
cd quickbites-cloud-demo/app
```

## Step 5: Install Dependencies
```
npm install
```

# AWS SERVICES SETUP

## Create DynamoDB Table
1. Go to AWS → DynamoDB
2. **Create Table:**
  - **Table Name:** quickbites-orders
  - **Partition Key:** id (String)
 
## Create S3 Bucket
1. Go to AWS → S3
2. Create Bucket
  - Give unique name
  - Keep defaults

## Attach IAM Role to EC2
1. Go to IAM → Roles → Create Role
2. Select EC2
3. Attach Policies:
  - AmazonDynamoDBFullAccess
  - AmazonS3FullAccess
4. Attach role to EC2 instance

# RUN APPLICATION
## Run with PM2
**Install PM2:**
``` sudo npm install -g pm2```

**Start app:**
```pm2 start server.js --name quickbites```

## PM2 Commands
```
pm2 list
pm2 logs
pm2 restart quickbites
pm2 stop quickbites
pm2 delete quickbites
```

**Auto start on reboot:**
```
pm2 startup
pm2 save
```
