const mongoose = require('mongoose');

const topicProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic: { type: String, required: true },
    solved: { type: Number, default: 0 },
    easy: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    hard: { type: Number, default: 0 },
    total: { type: Number, default: 50 }
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness per user per topic
topicProgressSchema.index({ user: 1, topic: 1 }, { unique: true });

module.exports = mongoose.model('TopicProgress', topicProgressSchema);
