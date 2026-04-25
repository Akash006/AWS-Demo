const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const config = require('./config');

let s3;

if (config.s3.enabled) {
  const s3Config = {
    region: config.s3.region
  };

  if (config.aws.credentials) {
    s3Config.credentials = config.aws.credentials;
  }

  s3 = new S3Client(s3Config);
}

async function uploadObject(params) {
  return s3.send(new PutObjectCommand(params));
}

async function listObjects(params) {
  return s3.send(new ListObjectsV2Command(params));
}

async function getObjectSignedUrl(params, expiresIn = 3600) {
  return getSignedUrl(s3, new GetObjectCommand(params), { expiresIn });
}

module.exports = { s3, uploadObject, listObjects, getObjectSignedUrl };
