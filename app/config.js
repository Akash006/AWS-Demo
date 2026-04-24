require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,

  db: {
    enabled: process.env.ENABLE_DB === 'true',
    type: process.env.DB_TYPE || 'mysql',
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },

  s3: {
    enabled: process.env.ENABLE_S3 === 'true',
    bucket: process.env.S3_BUCKET,
    region: process.env.AWS_REGION
  }
};
