const AWS = require('aws-sdk');
const config = require('./config');

let s3;

if (config.s3.enabled) {
  AWS.config.update({ region: config.s3.region });
  s3 = new AWS.S3();
}

module.exports = s3;
