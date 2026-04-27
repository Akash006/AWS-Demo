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
- AWS Cognito for user authtication

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

## AWS Cognito Setup
1. Go to AWS Console → Cognito → User pools → Create user pool
2. Set **User pool name** (example: `quickbites-users`)
3. Configure sign-in options:
  - Email (recommended)
4. Configure password policy and MFA as needed
5. Create the user pool

### Create App Client
1. Open your user pool → **App integration**
2. Under **App clients**, click **Create app client**
3. Select **Public client** (for browser-based app)
4. Set app client name (example: `quickbites-web-client`)
5. Save the client

### Configure Hosted UI + OAuth
1. In the same user pool, go to **App integration** → **Hosted UI**
2. Set a Cognito domain (or custom domain)
3. Under **Allowed callback URLs**, add: https://quickbites.akashdev.in/oauth2/idpresponse
4. Under **Allowed sign-out URLs**, add your app logout/landing URL (example: `https://quickbites.akashdev.in/`) // This is under development
5. Enable OAuth flows:
  - Authorization code grant (recommended)
6. Enable OAuth scopes:
  - `openid`
  - `email`
  - `profile`
7. Save changes

### Create Test User
1. Go to **Users** → **Create user**
2. Create a test user with email and temporary password
3. Sign in once and set a permanent password

### App Config You Will Need
Keep these values for application integration:
- User Pool ID
- App Client ID
- Cognito Domain
- AWS Region


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
pm2 restart quickbites --update-env
pm2 stop quickbites
pm2 delete quickbites
```

**Auto start on reboot:**
```
pm2 startup
pm2 save
```
