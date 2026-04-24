const express = require('express');
const os = require('os');
const multer = require('multer');

const config = require('./config');
const db = require('./db');
const s3 = require('./s3');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.static('../public'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    instance: os.hostname()
  });
});

// DB: Save order
app.post('/api/order', async (req, res) => {
  if (!config.db.enabled) {
    return res.json({ message: "DB not enabled" });
  }

  const { item } = req.body;

  try {
    await db.query("INSERT INTO orders (item) VALUES (?)", [item]);
    res.json({ message: "Order saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DB: Fetch orders
app.get('/api/orders', async (req, res) => {
  if (!config.db.enabled) {
    return res.json({ message: "DB not enabled" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM orders");
    res.json(rows);
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
