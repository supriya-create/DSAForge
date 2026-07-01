const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    qid: { type: String },
    question: { type: String, required: true },
    type: { type: String, enum: ['mcq', 'coding', 'short'], default: 'mcq' },
    choices: [String],
    answer: mongoose.Schema.Types.Mixed,
    maxScore: { type: Number, default: 1 },
    title: { type: String },
    difficulty: { type: String },
    topic: { type: String },
    timeLimit: { type: Number },
    constraints: { type: String },
    hint: { type: String }
  },
  { _id: false }
);

const assessmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    questions: [questionSchema],
    durationMinutes: { type: Number, default: 30 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isPublished: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assessment', assessmentSchema);
