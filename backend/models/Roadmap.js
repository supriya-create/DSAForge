const mongoose = require('mongoose');

const roadmapItemSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    recommendedAt: { type: Date, default: null },
    priority: { type: Number, default: 0 }
  },
  { _id: false }
);

const roadmapSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'Personal Roadmap' },
    items: [roadmapItemSchema],
    source: { type: String, default: 'system' },
    rawRoadmap: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Roadmap', roadmapSchema);
