#!/bin/bash

yum update
yum install -y nginx nodejs npm git 

cd /opt
git clone https://github.com/Akash006/AWS-Demo.git
cd AWS-Demo

npm init -y
npm install express mysql2 pg multer dotenv @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install pm2 -g

pm2 start app/server.js --name quickbites
