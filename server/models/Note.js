const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    summaries: {
      short: String,
      bullets: [String],
      quiz: [{ question: String, answer: String }],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
