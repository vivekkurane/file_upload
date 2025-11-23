const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Replace with your connection string or use environment variable
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://vivekkurane:shravani@cluster0.qmmpa8v.mongodb.net/?appName=Cluster0';

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Mongoose setup
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schema
const DocumentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  mimetype: { type: String },
  size: { type: Number },
  data: { type: Buffer, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Document = mongoose.model('Document', DocumentSchema);

// Multer (memory storage)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// API: upload
app.post('/api/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const doc = new Document({
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      data: req.file.buffer
    });

    await doc.save();
    res.json({ success: true, id: doc._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

// API: list documents (metadata only)
app.get('/api/documents', async (req, res) => {
  try {
    const docs = await Document.find().sort({ createdAt: -1 }).limit(100).select('filename size createdAt').exec();
    res.json(docs.map(d => ({ id: d._id, filename: d.filename, size: d.size, createdAt: d.createdAt })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error listing documents' });
  }
});

// API: download by id
app.get('/api/documents/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id).exec();
    if (!doc) return res.status(404).send('Not found');
    res.setHeader('Content-Type', doc.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.filename}"`);
    res.send(doc.data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching document');
  }
});

// fallback to index.html for frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
