const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Replace with your connection string or use environment variable
const MONGO_URI = process.env.MONGO_URI 

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
// Accept repeated file fields via the same field name used by the Angular client.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 20 }
});

// API: upload (accept single or multiple files)
app.post('/api/upload', upload.fields([
  { name: 'documents', maxCount: 20 },
  { name: 'document', maxCount: 20 }
]), async (req, res) => {
  try {
    const files = Object.values(req.files || {}).flat();
    if (!files || files.length === 0) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const saved = [];
    for (const f of files) {
      // multer puts buffer on f.buffer when using memoryStorage
      const doc = new Document({
        filename: f.originalname || f.filename,
        mimetype: f.mimetype,
        size: f.size || (f.buffer && f.buffer.length) || 0,
        data: f.buffer
      });
      await doc.save();
      saved.push({ id: doc._id, filename: doc.filename });
    }

    res.json({ success: true, files: saved });
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

// API: storage summary (report database/collection storage usage, not local file sizes)
app.get('/api/storage', async (req, res) => {
  try {
    const db = mongoose.connection.db;

    // DB-level stats
    let dbStats = {};
    try { dbStats = await db.command({ dbStats: 1 }); } catch (e) { dbStats = {}; }

    // Collection-level stats for the documents collection
    let collStats = {};
    try { collStats = await db.collection('documents').stats(); } catch (e) { collStats = {}; }

    // Prefer using storageSize (allocated on disk) as the 'total' shown to users. Fallback to size.
    const total = collStats.storageSize || collStats.size || 0;
    const dataSize = collStats.size || 0;
    const count = collStats.count || 0;

    const quota = process.env.STORAGE_QUOTA ? parseInt(process.env.STORAGE_QUOTA, 10) : null;
    const remaining = quota != null ? Math.max(0, quota - total) : null;

    res.json({
      total,
      dataSize,
      count,
      dbStorageSize: dbStats.storageSize || null,
      quota,
      remaining
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error calculating storage' });
  }
});

// API: document metadata by id
app.get('/api/documents/:id/metadata', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id).select('filename mimetype size createdAt').exec();
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ id: doc._id, filename: doc.filename, mimetype: doc.mimetype, size: doc.size, createdAt: doc.createdAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching metadata' });
  }
});

// API: preview by id (inline)
app.get('/api/documents/:id/preview', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id).exec();
    if (!doc) return res.status(404).send('Not found');
    res.setHeader('Content-Type', doc.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${doc.filename}"`);
    res.send(doc.data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching document');
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

// DELETE /files/:name - delete a specific file by filename
app.delete('/api/documents/:id', (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'Missing document' });

  Document.findByIdAndDelete(id).then(() => {
    res.json({ success: true });
  }).catch(err => {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete document' });
  });
});

// Serve the Angular build first, then fall back to the legacy public files.
const clientDist = path.join(__dirname, 'client', 'dist', 'client');
const angularBrowserDist = path.join(clientDist, 'browser');
if (fs.existsSync(angularBrowserDist)) {
  app.use(express.static(angularBrowserDist));
}
app.use(express.static(path.join(__dirname, 'public')));

if (fs.existsSync(angularBrowserDist)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(angularBrowserDist, 'index.html'));
  });
} else {
  // fallback to index.html for frontend routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
