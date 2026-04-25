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

module.exports = {
  port: process.env.PORT || 3000,

  db: {
    enabled: toBool(process.env.ENABLE_DB),
    type: (process.env.DB_TYPE || 'mysql').trim().toLowerCase(),
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    region: process.env.AWS_REGION,
    dynamoTable: process.env.DYNAMO_TABLE
  },

  s3: {
    enabled: toBool(process.env.ENABLE_S3),
    bucket: process.env.S3_BUCKET,
    region: process.env.AWS_REGION
  }
};
