#!/bin/bash
set -euxo pipefail

# Install dependencies (Amazon Linux/RHEL family)
if command -v yum >/dev/null 2>&1; then
	yum update -y
	yum install -y nginx nodejs npm git
fi

# Install dependencies (Ubuntu/Debian family)
if command -v apt-get >/dev/null 2>&1; then
	apt-get update -y
	apt-get install -y nginx nodejs npm git
fi

# Determine default SSH user on this AMI
APP_USER="ec2-user"
if id -u ubuntu >/dev/null 2>&1; then
	APP_USER="ubuntu"
elif id -u ec2-user >/dev/null 2>&1; then
	APP_USER="ec2-user"
elif id -u admin >/dev/null 2>&1; then
	APP_USER="admin"
else
	APP_USER="root"
fi

cd /opt
if [ -d /opt/AWS-Demo/.git ]; then
	cd /opt/AWS-Demo
	git pull --rebase
else
	git clone https://github.com/Akash006/AWS-Demo.git
	cd /opt/AWS-Demo
fi

# Install app deps from package.json
npm install

# Ensure app user can manage project files
chown -R "$APP_USER":"$APP_USER" /opt/AWS-Demo

# Run app via systemd (simpler and user-agnostic compared to PM2 lists)
cat >/etc/systemd/system/quickbites.service <<EOF
[Unit]
Description=QuickBites Node App
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=/opt/AWS-Demo
Environment=NODE_ENV=production
EnvironmentFile=-/opt/AWS-Demo/.env
ExecStart=/usr/bin/node /opt/AWS-Demo/app/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now quickbites
