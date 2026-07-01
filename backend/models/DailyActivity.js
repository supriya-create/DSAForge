const mongoose = require('mongoose');

const dailyActivitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    problemsSolvedCount: { type: Number, default: 0 },
    minutesSpent: { type: Number, default: 0 },
    problemsSolved: [
      {
        problemId: String,
        platform: String,
        title: String,
        difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] }
      }
    ]
  },
  { timestamps: true }
);

dailyActivitySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyActivity', dailyActivitySchema);
