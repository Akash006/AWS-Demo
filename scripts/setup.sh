#!/bin/bash

yum update
yum install -y nginx nodejs npm git 

git clone https://github.com/Akash006/AWS-Demo.git
cd AWS-Demo

npm init -y
npm install express mysql2 pg aws-sdk multer dotenv @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb pm2

pm2 start app/server.js --name quickbites
