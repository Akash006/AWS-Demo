const express = require('express');
const os = require('os');
const multer = require('multer');
const path = require('path'); // 👈 ADD THIS

const config = require('./config');
const s3 = require('./s3');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const isDynamoEnabled = config.db.enabled && config.db.type === 'dynamodb';

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    instance: os.hostname()
  });
});

const dynamo = require('./dynamo');

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
    res.status(500).json({ error: err.message });
  }
});

// S3: Upload file
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!config.s3.enabled) {
    return res.json({ message: "S3 not enabled" });
  }

  const params = {
    Bucket: config.s3.bucket,
    Key: Date.now() + "-" + req.file.originalname,
    Body: req.file.buffer
  };

  try {
    const result = await s3.upload(params).promise();
    res.json({ url: result.Location });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
