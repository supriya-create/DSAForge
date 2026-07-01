const mongoose = require('mongoose');

const doubtSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    code: { type: String, required: true },
    question: { type: String },
    analysis: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doubt', doubtSchema);
