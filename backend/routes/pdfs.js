/**
 * EduPath — routes/pdfs.js
 * PDF upload via GridFS (handles files > 16MB)
 * + PDF links stored as regular documents
 */

const express    = require('express');
const multer     = require('multer');
const mongoose   = require('mongoose');
const { GridFSBucket } = require('mongodb');
const { protect }  = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ── Multer — memory storage, 50MB limit ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => { cb(null, true); }, // allow all file types
});

// ── PDF Meta Schema (no fileData — stored in GridFS) ──
const pdfSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true, maxlength: 200 },
  topic:       { type: String, required: true, trim: true, maxlength: 100 }, // any domain accepted
  type:        { type: String, enum: ['file', 'link'], required: true },
  gridfsId:    { type: mongoose.Schema.Types.ObjectId },
  mimeType:    { type: String, default: 'application/pdf' },
  fileSize:    { type: Number },
  url:         { type: String, trim: true },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  createdAt:   { type: Date, default: Date.now },
});

const PDF = mongoose.models.PDF || mongoose.model('PDF', pdfSchema);

const getBucket = () => new GridFSBucket(mongoose.connection.db, { bucketName: 'pdfs' });

// GET /api/pdfs
router.get('/', async (req, res, next) => {
  try {
    const { topic } = req.query;
    const filter = { userId: req.user.id };
    if (topic && topic !== 'All') filter.topic = topic;
    const pdfs = await PDF.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: pdfs.length, pdfs });
  } catch (err) { next(err); }
});

// POST /api/pdfs/upload
router.post('/upload', upload.single('pdf'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No PDF file provided.' });
    const { title, topic, description } = req.body;
    if (!title?.trim()) return res.status(400).json({ success: false, error: 'Title is required.' });
    if (!topic)         return res.status(400).json({ success: false, error: 'Topic is required.' });

    const bucket   = getBucket();
    const filename = `${Date.now()}_${req.file.originalname}`;

    const gridfsId = await new Promise((resolve, reject) => {
      const stream = bucket.openUploadStream(filename, {
        metadata:    { userId: req.user.id, title, topic },
        contentType: req.file.mimetype,
      });
      stream.on('finish', () => resolve(stream.id));
      stream.on('error',  reject);
      stream.end(req.file.buffer);
    });

    const pdf = await PDF.create({
      userId:      req.user.id,
      title:       title.trim(),
      topic,
      type:        'file',
      gridfsId,
      fileSize:    req.file.size,
      mimeType:    req.file.mimetype,
      description: description?.trim() || '',
    });

    res.status(201).json({ success: true, pdf });
  } catch (err) { next(err); }
});

// POST /api/pdfs/link
router.post('/link', async (req, res, next) => {
  try {
    const { title, topic, url, description } = req.body;
    if (!title?.trim()) return res.status(400).json({ success: false, error: 'Title is required.' });
    if (!topic)         return res.status(400).json({ success: false, error: 'Topic is required.' });
    if (!url?.trim())   return res.status(400).json({ success: false, error: 'URL is required.' });

    const pdf = await PDF.create({
      userId: req.user.id, title: title.trim(), topic,
      type: 'link', url: url.trim(),
      description: description?.trim() || '',
    });
    res.status(201).json({ success: true, pdf });
  } catch (err) { next(err); }
});

// GET /api/pdfs/:id/download
router.get('/:id/download', async (req, res, next) => {
  try {
    const pdf = await PDF.findOne({ _id: req.params.id, userId: req.user.id });
    if (!pdf)               return res.status(404).json({ success: false, error: 'PDF not found.' });
    if (pdf.type !== 'file') return res.status(400).json({ success: false, error: 'This is a link.' });
    if (!pdf.gridfsId)      return res.status(404).json({ success: false, error: 'File not found.' });

    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${pdf.title}.pdf"` });
    getBucket().openDownloadStream(pdf.gridfsId).pipe(res);
  } catch (err) { next(err); }
});

// DELETE /api/pdfs/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const pdf = await PDF.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!pdf) return res.status(404).json({ success: false, error: 'PDF not found.' });
    if (pdf.type === 'file' && pdf.gridfsId) {
      await getBucket().delete(pdf.gridfsId).catch(() => {});
    }
    res.json({ success: true, message: 'PDF deleted.' });
  } catch (err) { next(err); }
});

// PATCH /api/pdfs/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.title?.trim())             updates.title       = req.body.title.trim();
    if (req.body.description !== undefined) updates.description = req.body.description.trim();
    const pdf = await PDF.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates }, { new: true }
    );
    if (!pdf) return res.status(404).json({ success: false, error: 'PDF not found.' });
    res.json({ success: true, pdf });
  } catch (err) { next(err); }
});

module.exports = router;