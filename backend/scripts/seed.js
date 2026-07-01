const dotenv = require('dotenv');
const connectDB = require('../config/db');
const {
  User,
  Progress,
  LeetCodeStat,
  DailyActivity,
  Streak,
  Roadmap,
  RecommendedProblem,
  Assessment,
  AssessmentResult,
  AIAnalysis
} = require('../models');

dotenv.config({ path: '../.env' });

(async () => {
  try {
    await connectDB();

    let user = await User.findOne();
    if (!user) {
      user = await User.create({
        name: 'Seed User',
        email: 'seed.user@example.com',
        password: 'password123',
        college: 'Seed College',
        year: '3rd Year'
      });
      console.log('Created seed user:', user.email);
    }

    // Create or update sample documents for each collection
    const progressDate = new Date();
    await Progress.findOneAndUpdate(
      { user: user._id, date: progressDate },
      {
        user: user._id,
        date: progressDate,
        problemsSolved: [
          { problemId: '123', platform: 'LeetCode', title: 'Two Sum', difficulty: 'Easy', timeTakenMinutes: 10 }
        ],
        topicsCovered: ['Arrays', 'Hash Table'],
        minutesSpent: 30,
        notes: 'Seed progress entry'
      },
      { upsert: true, new: true }
    );

    await LeetCodeStat.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        totalSolved: 5,
        easySolved: 3,
        mediumSolved: 2,
        hardSolved: 0,
        acceptanceRate: 85,
        ranking: 1200,
        lastSyncedAt: new Date(),
        rawProfile: { profile: 'seed' }
      },
      { upsert: true, new: true }
    );

    await DailyActivity.findOneAndUpdate(
      { user: user._id, date: progressDate },
      {
        user: user._id,
        date: progressDate,
        problemsSolvedCount: 2,
        minutesSpent: 45,
        problemsSolved: [
          { problemId: '456', platform: 'LeetCode', title: 'Add Two Numbers', difficulty: 'Medium' }
        ]
      },
      { upsert: true, new: true }
    );

    await Streak.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        currentStreak: 3,
        bestStreak: 5,
        lastActiveDate: new Date()
      },
      { upsert: true, new: true }
    );

    await Roadmap.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        title: 'Seed Roadmap',
        items: [
          { topic: 'Arrays', description: 'Learn array basics', status: 'completed', recommendedAt: new Date(), priority: 1 },
          { topic: 'Strings', description: 'Practice string algorithms', status: 'in-progress', recommendedAt: new Date(), priority: 2 }
        ],
        source: 'seed'
      },
      { upsert: true, new: true }
    );

    await RecommendedProblem.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        problems: [
          {
            platform: 'LeetCode',
            problemId: '789',
            title: 'Longest Substring Without Repeating Characters',
            difficulty: 'Medium',
            tags: ['Strings', 'Sliding Window'],
            reason: 'Great practice for two-pointer technique',
            url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/'
          }
        ],
        recommendedAt: new Date(),
        source: 'seed'
      },
      { upsert: true, new: true }
    );

    const assessment = await Assessment.findOneAndUpdate(
      { title: 'Seed Assessment' },
      {
        title: 'Seed Assessment',
        description: 'A sample assessment to create the collection',
        questions: [
          { qid: 'q1', question: 'What is a binary search?', type: 'short', maxScore: 5 },
          { qid: 'q2', question: 'Which data structure is best for LRU cache?', type: 'mcq', choices: ['Queue','Stack','HashMap','Heap'], answer: 'HashMap', maxScore: 5 }
        ],
        durationMinutes: 15,
        createdBy: user._id,
        isPublished: true
      },
      { upsert: true, new: true }
    );

    await AssessmentResult.findOneAndUpdate(
      { assessment: assessment._id, user: user._id },
      {
        assessment: assessment._id,
        user: user._id,
        score: 8,
        maxScore: 10,
        answers: [
          { qid: 'q1', answer: 'A search algorithm on sorted arrays.', scoreAwarded: 4 },
          { qid: 'q2', answer: 'HashMap', scoreAwarded: 4 }
        ],
        passed: true,
        completedAt: new Date()
      },
      { upsert: true, new: true }
    );

    await AIAnalysis.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        analysisDate: new Date(),
        weaknesses: [
          { topic: 'Dynamic Programming', score: 40, examples: ['Knapsack', 'Longest Increasing Subsequence'] }
        ],
        strengths: [
          { topic: 'Arrays', score: 90 } ],
        suggestions: ['Practice DP daily', 'Review array sliding window problems'],
        metrics: { averageSolveTime: 20, accuracy: 85 },
        rawAnalysis: { generatedBy: 'seed-script' }
      },
      { upsert: true, new: true }
    );

    console.log('Seed data created successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
})();
