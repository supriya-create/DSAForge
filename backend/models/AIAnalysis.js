const mongoose = require('mongoose');

const aiAnalysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    analysisDate: { type: Date, default: Date.now },
    weaknesses: [
      {
        topic: String,
        score: Number,
        examples: [String]
      }
    ],
    strengths: [
      {
        topic: String,
        score: Number
      }
    ],
    suggestions: [String],
    metrics: mongoose.Schema.Types.Mixed,
    rawAnalysis: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

module.exports = mongoose.model('AIAnalysis', aiAnalysisSchema);
