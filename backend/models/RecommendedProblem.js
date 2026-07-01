const mongoose = require('mongoose');

const recommendedProblemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    problems: [
      {
        platform: { type: String, default: 'LeetCode' },
        problemId: { type: String },
        title: { type: String },
        difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
        tags: [String],
        reason: { type: String },
        url: { type: String }
      }
    ],
    recommendedAt: { type: Date, default: Date.now },
    source: { type: String, default: 'ai' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('RecommendedProblem', recommendedProblemSchema);
