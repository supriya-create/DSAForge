const mongoose = require('mongoose');

const assessmentResultSchema = new mongoose.Schema(
  {
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    answers: [
      {
        qid: String,
        answer: mongoose.Schema.Types.Mixed,
        scoreAwarded: { type: Number, default: 0 }
      }
    ],
    passed: { type: Boolean, default: false },
    completedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AssessmentResult', assessmentResultSchema);
