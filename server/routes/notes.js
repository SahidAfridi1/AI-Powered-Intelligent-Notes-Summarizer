const router = require('express').Router();
const multer = require('multer');
const pdfParse = require('pdf-parse/lib/pdf-parse.js');
const auth = require('../middleware/auth');
const Note = require('../models/Note');
const { summarize, MODES } = require('../services/summarizer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const filter = { user: req.userId };
    if (req.query.q) {
      const rx = new RegExp(escapeRegex(req.query.q), 'i');
      filter.$or = [{ title: rx }, { content: rx }];
    }
    const notes = await Note.find(filter).sort({ createdAt: -1 }).select('title summaries.short createdAt');
    res.json(notes);
  } catch (err) {
    next(err);
  }
});

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    let content = req.body.content || '';
    let title = req.body.title;
    if (req.file) {
      const name = req.file.originalname;
      if (/\.pdf$/i.test(name)) content = (await pdfParse(req.file.buffer)).text;
      else if (/\.(txt|md)$/i.test(name)) content = req.file.buffer.toString('utf8');
      else return res.status(400).json({ message: 'Only .txt, .md or .pdf files are supported' });
      title = title || name.replace(/\.[^.]+$/, '');
    }
    content = content.trim();
    if (content.length < 50) return res.status(400).json({ message: 'Notes are too short to summarize (min 50 characters)' });

    const mode = MODES.includes(req.body.mode) ? req.body.mode : 'short';
    const note = new Note({ user: req.userId, title: title || content.slice(0, 40) + '…', content, summaries: {} });
    note.summaries[mode] = await summarize(content, mode);
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.userId });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/summarize', async (req, res, next) => {
  try {
    const { mode } = req.body;
    if (!MODES.includes(mode)) return res.status(400).json({ message: 'Invalid mode' });
    const note = await Note.findOne({ _id: req.params.id, user: req.userId });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    note.summaries[mode] = await summarize(note.content, mode);
    await note.save();
    res.json(note);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await Note.deleteOne({ _id: req.params.id, user: req.userId });
    if (!result.deletedCount) return res.status(404).json({ message: 'Note not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
