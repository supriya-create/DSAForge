const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    problemTitle: { type: String, trim: true },
    problemId: { type: String, trim: true },
    // difficulty/language may be null when the LeetCode API does not provide
    // them — we never fabricate values (previously defaulted to 'Medium').
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', null], default: null },
    status: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
    language: { type: String, trim: true, default: null },
  },
  { _id: false }
);

const contestHistorySchema = new mongoose.Schema(
  {
    contestId: { type: String, trim: true },
    rank: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    attendedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const badgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, trim: true },
    category: { type: String, trim: true },
  },
  { _id: false }
);

const languageStatSchema = new mongoose.Schema(
  {
    language: { type: String, required: true, trim: true },
    solved: { type: Number, default: 0 },
    submissions: { type: Number, default: 0 },
  },
  { _id: false }
);

const leetcodeStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    totalSolved: {
      type: Number,
      default: 0,
      min: 0,
    },
    easySolved: {
      type: Number,
      default: 0,
      min: 0,
    },
    mediumSolved: {
      type: Number,
      default: 0,
      min: 0,
    },
    hardSolved: {
      type: Number,
      default: 0,
      min: 0,
    },
    acceptanceRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    ranking: {
      type: Number,
      default: null,
      min: 0,
    },
    contestRating: {
      type: Number,
      default: 0,
      min: 0,
    },
    contestHistory: {
      type: [contestHistorySchema],
      default: [],
    },
    recentSubmissions: {
      type: [submissionSchema],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value) && value.length <= 50,
        message: 'recentSubmissions cannot exceed 50 items',
      },
    },
    badges: {
      type: [badgeSchema],
      default: [],
    },
    languageStats: {
      type: [languageStatSchema],
      default: [],
    },
    lastSynced: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

leetcodeStatsSchema.index({ username: 1, ranking: 1 });

module.exports = mongoose.model('LeetcodeStats', leetcodeStatsSchema);
