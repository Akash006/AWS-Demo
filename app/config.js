const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function loadEnvFiles() {
  const candidates = [
    path.resolve(__dirname, '../.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../.env.example'),
    path.resolve(process.cwd(), '.env.example')
  ];

  const loaded = new Set();

  for (const filePath of candidates) {
    if (loaded.has(filePath)) continue;
    if (!fs.existsSync(filePath)) continue;

    dotenv.config({ path: filePath, override: false });
    loaded.add(filePath);
  }
}

function toBool(value, defaultValue = false) {
  if (value === undefined || value === null) return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'on'].includes(normalized);
}

loadEnvFiles();

const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY;
const sessionToken = process.env.AWS_SESSION_TOKEN || process.env.SESSION_TOKEN;
const hasStaticCredentials = Boolean(accessKeyId && secretAccessKey);

module.exports = {
  port: process.env.PORT || 3000,

  aws: {
    hasStaticCredentials,
    credentials: hasStaticCredentials
      ? {
          accessKeyId,
          secretAccessKey,
          ...(sessionToken ? { sessionToken } : {})
        }
      : undefined
  },

  db: {
    enabled: toBool(process.env.ENABLE_DB),
    type: (process.env.DB_TYPE || process.env.DATABASE_TYPE || 'mysql').trim().toLowerCase(),
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    region: process.env.DYNAMO_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION,
    dynamoTable: process.env.DYNAMO_TABLE || process.env.DYNAMODB_TABLE || process.env.DB_TABLE
  },

  s3: {
    enabled: toBool(process.env.ENABLE_S3),
    bucket: process.env.S3_BUCKET,
    region: process.env.S3_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION
  }
};
