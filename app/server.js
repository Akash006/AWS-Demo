const express = require('express');
const os = require('os');
const multer = require('multer');
const path = require('path'); // 👈 ADD THIS

const config = require('./config');
const s3 = require('./s3');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const isDynamoEnabled = config.db.enabled && config.db.type === 'dynamodb';
const dynamo = require('./dynamo');

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/api/health', async (req, res) => {
  const response = {
    status: 'OK',
    instance: os.hostname(),
    dbRouteAvailable: true
  };

  if (req.query.deep === '1') {
    response.dbStatus = await dynamo.getStatus();
  }

  res.json(response);
});

// Save order
app.post('/api/order', async (req, res) => {
  if (!isDynamoEnabled) {
    return res.json({ message: "DB not enabled (set ENABLE_DB=true and DB_TYPE=dynamodb)" });
  }

  try {
    await dynamo.saveOrder(req.body.item);
    res.json({ message: "Order saved in DynamoDB" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch orders
app.get('/api/orders', async (req, res) => {
  if (!isDynamoEnabled) {
    return res.json({ message: "DB not enabled (set ENABLE_DB=true and DB_TYPE=dynamodb)" });
  }

  try {
    const orders = await dynamo.getOrders();
    res.json(orders);
  } catch (err) {
    console.error('[GET /api/orders] DynamoDB error:', {
      name: err?.name,
      message: err?.message,
      code: err?.code,
      statusCode: err?.$metadata?.httpStatusCode
    });

    const knownAwsError = {
      ResourceNotFoundException: 'DynamoDB table not found in configured region.',
      AccessDeniedException: 'IAM role/user lacks DynamoDB permissions.',
      UnrecognizedClientException: 'AWS credentials are invalid or unavailable.',
      CredentialsProviderError: 'AWS credentials not found. Attach an IAM role or configure credentials.',
      ValidationException: 'Invalid DynamoDB configuration. Verify table name and region.',
      MissingRegion: 'AWS region missing. Set DYNAMO_REGION or AWS_REGION.',
      ConfigError: 'AWS SDK config error. Check credentials/region variables.'
    };

    const message = knownAwsError[err?.name] || err?.message || 'Failed to fetch orders from DynamoDB.';
    res.status(500).json({ error: message, details: err?.name || 'UnknownError' });
  }
});

// DB diagnostics (non-secret)
app.get(['/api/db-status', '/db-status'], async (req, res) => {
  const status = await dynamo.getStatus();
  res.status(status.ok ? 200 : 500).json(status);
});

// S3: Upload file
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!config.s3.enabled) {
    return res.json({ message: "S3 not enabled" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const params = {
    Bucket: config.s3.bucket,
    Key: Date.now() + "-" + req.file.originalname,
    Body: req.file.buffer,
    ContentType: req.file.mimetype
  };

  try {
    await s3.uploadObject(params);
    const url = await s3.getObjectSignedUrl({
      Bucket: config.s3.bucket,
      Key: params.Key
    }, 60 * 60);
    res.json({ url, key: params.Key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// S3: List uploaded images
app.get('/api/images', async (req, res) => {
  if (!config.s3.enabled) {
    return res.json({ message: "S3 not enabled" });
  }

  try {
    const listResponse = await s3.listObjects({
      Bucket: config.s3.bucket,
      MaxKeys: 50
    });

    const objects = listResponse.Contents || [];

    const imageObjects = objects
      .filter((obj) => {
        const key = (obj.Key || '').toLowerCase();
        return key.endsWith('.jpg') || key.endsWith('.jpeg') || key.endsWith('.png') || key.endsWith('.gif') || key.endsWith('.webp');
      })
      .sort((a, b) => new Date(b.LastModified || 0) - new Date(a.LastModified || 0))
      .slice(0, 24);

    const images = await Promise.all(
      imageObjects.map(async (obj) => {
        const url = await s3.getObjectSignedUrl({
          Bucket: config.s3.bucket,
          Key: obj.Key
        }, 60 * 60);

        return {
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified,
          url
        };
      })
    );

    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log('[Startup] DB config:', {
    enabled: config.db.enabled,
    type: config.db.type,
    table: config.db.dynamoTable,
    region: config.db.region,
    credentialsSource: config.aws.hasStaticCredentials ? 'env-static' : 'default-provider-chain'
  });
  console.log('[Startup] S3 config:', {
    enabled: config.s3.enabled,
    bucket: config.s3.bucket,
    region: config.s3.region
  });
});
