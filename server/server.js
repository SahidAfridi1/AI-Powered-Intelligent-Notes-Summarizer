require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.get('/api/health', (req, res) => res.json({ ok: true, ai: process.env.ANTHROPIC_API_KEY ? 'claude' : 'built-in' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

async function start() {
  let uri = process.env.MONGO_URI;
  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mem = await MongoMemoryServer.create();
    uri = mem.getUri();
    console.log('Using in-memory MongoDB (data resets on restart)');
  }
  await mongoose.connect(uri);
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`API running on http://localhost:${port}`));
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
