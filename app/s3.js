const AWS = require('aws-sdk');
const config = require('./config');

let s3;

if (config.s3.enabled) {
  const awsConfig = {
    region: config.s3.region
  };

  if (config.aws.credentials) {
    awsConfig.credentials = new AWS.Credentials(config.aws.credentials);
  }

  AWS.config.update(awsConfig);
  s3 = new AWS.S3();
}

module.exports = s3;
