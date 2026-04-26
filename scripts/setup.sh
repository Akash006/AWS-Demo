#!/bin/bash
set -euxo pipefail

# Install Docker (Amazon Linux/RHEL family)
if command -v yum >/dev/null 2>&1; then
  yum update -y
  yum install -y docker
fi

# Install Docker (Ubuntu/Debian family)
if command -v apt-get >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y docker.io
fi

systemctl enable --now docker
systemctl start docker

# -------------------------------------------------------
# Environment variables for the app
# Edit the values below before running this script
# -------------------------------------------------------
cat > /etc/quickbites.env <<'EOF'
PORT=3000

ENABLE_DB=true
DB_TYPE=dynamodb
DYNAMO_TABLE=quickbites-orders
DYNAMO_REGION=ap-south-1

ENABLE_S3=true
S3_BUCKET=your-bucket-name
S3_REGION=ap-south-1
AWS_REGION=ap-south-1

# Optional (only if EC2 has no IAM role attached):
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
EOF

chmod 600 /etc/quickbites.env

docker run -d \
  --name quickbites \
  --restart unless-stopped \
  -p 80:3000 \
  --env-file /etc/quickbites.env \
  akash006/aws-demo-quickbites-webapp:AL2023
