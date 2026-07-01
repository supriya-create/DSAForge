const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    problemsSolved: [
      {
        problemId: { type: String },
        platform: { type: String, default: 'LeetCode' },
        title: { type: String },
        difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
        timeTakenMinutes: { type: Number, default: 0 }
      }
    ],
    topicsCovered: [String],
    minutesSpent: { type: Number, default: 0 },
    notes: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Progress', progressSchema);
