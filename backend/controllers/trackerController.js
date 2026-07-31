const { TopicProgress, DailyActivity } = require('../models');
const { getStoredLeetCodeProfile, syncLeetCodeProfile, AppError } = require('../services/leetcodeService');
const { getStreakData } = require('../services/streakService');
const { utcDay, utcDaysAgo, utcDayKey } = require('../services/dateUtils');

const DEFAULT_TOPICS = [
  { topic: 'Arrays', solved: 0, easy: 0, medium: 0, hard: 0, total: 80 },
  { topic: 'Strings', solved: 0, easy: 0, medium: 0, hard: 0, total: 60 },
  { topic: 'Linked Lists', solved: 0, easy: 0, medium: 0, hard: 0, total: 40 },
  { topic: 'Trees', solved: 0, easy: 0, medium: 0, hard: 0, total: 50 },
  { topic: 'Graphs', solved: 0, easy: 0, medium: 0, hard: 0, total: 55 },
  { topic: 'Dynamic Programming', solved: 0, easy: 0, medium: 0, hard: 0, total: 70 },
  { topic: 'Heaps', solved: 0, easy: 0, medium: 0, hard: 0, total: 30 },
  { topic: 'Sorting', solved: 0, easy: 0, medium: 0, hard: 0, total: 35 },
  { topic: 'Binary Search', solved: 0, easy: 0, medium: 0, hard: 0, total: 40 },
  { topic: 'Recursion', solved: 0, easy: 0, medium: 0, hard: 0, total: 35 },
];

/**
 * Clamps an integer to [min, max]. Returns 0 for non-finite input.
 * Used so malformed/negative payloads can never corrupt stored progress.
 */
const clampInt = (value, min, max) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return min;
  if (max !== Infinity) return Math.min(Math.max(n, min), max);
  return Math.max(n, min);
};

const serializeTopic = (t) => ({
  topic: t.topic,
  solved: t.solved,
  easy: t.easy,
  medium: t.medium,
  hard: t.hard,
  total: t.total,
});

// 1. Get Tracker Data (real TopicProgress + server-computed streak + weekly activity)
exports.getTrackerData = async (req, res) => {
  try {
    const userId = req.userId;

    let topics = await TopicProgress.find({ user: userId }).lean();

    if (!topics || topics.length === 0) {
      await TopicProgress.insertMany(DEFAULT_TOPICS.map((t) => ({ ...t, user: userId })));
      topics = await TopicProgress.find({ user: userId }).lean();
    }

    const { currentStreak } = await getStreakData(userId);

    const weeklyActivity = await getWeeklyActivityData(userId);

    res.status(200).json({
      success: true,
      dsaProgress: topics.map(serializeTopic),
      streak: currentStreak,
      weeklyActivity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving tracker data',
      error: error.message,
    });
  }
};

// 2. Update Topic Progress (with validation + correct DailyActivity inc/dec)
exports.updateTopicProgress = async (req, res) => {
  try {
    const userId = req.userId;
    const topicName = req.params.topic;

    const oldTopic = await TopicProgress.findOne({ user: userId, topic: topicName });
    const oldSolved = oldTopic ? oldTopic.solved : 0;

    // Validation: clamp into [0, total], total >= 1, solved <= total.
    const total = clampInt(req.body.total, 1, Infinity);
    const solved = Math.min(clampInt(req.body.solved, 0, Infinity), total);
    const easy = Math.min(clampInt(req.body.easy, 0, Infinity), solved);
    const medium = Math.min(clampInt(req.body.medium, 0, Infinity), solved - easy);
    const hard = Math.min(clampInt(req.body.hard, 0, Infinity), solved - easy - medium);

    const difference = solved - oldSolved;

    const topic = await TopicProgress.findOneAndUpdate(
      { user: userId, topic: topicName },
      { solved, easy, medium, hard, total },
      { new: true, upsert: true }
    );

    // Update today's DailyActivity count for both increments and decrements.
    if (difference !== 0) {
      const today = utcDay();
      const change = {
        $inc: { problemsSolvedCount: difference },
      };
      if (difference > 0) {
        change.$push = {
          problemsSolved: {
            platform: 'Manual',
            title: `Solved ${difference} problem(s) in ${topicName}`,
            difficulty: 'Medium',
          },
        };
      }
      await DailyActivity.findOneAndUpdate(
        { user: userId, date: today },
        change,
        { upsert: true, new: true }
      );
    }

    res.status(200).json({ success: true, topicProgress: serializeTopic(topic) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating topic progress',
      error: error.message,
    });
  }
};

// 3. Add Topic Progress (with validation)
exports.addTopicProgress = async (req, res) => {
  try {
    const userId = req.userId;
    const { topic } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, message: 'Topic name is required' });
    }

    const name = topic.trim();
    const total = clampInt(req.body.total, 1, Infinity);
    const solved = Math.min(clampInt(req.body.solved, 0, Infinity), total);
    const easy = Math.min(clampInt(req.body.easy, 0, Infinity), solved);
    const medium = Math.min(clampInt(req.body.medium, 0, Infinity), solved - easy);
    const hard = Math.min(clampInt(req.body.hard, 0, Infinity), solved - easy - medium);

    const existing = await TopicProgress.findOne({ user: userId, topic: name });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Topic already exists in your tracker' });
    }

    const newTopic = await TopicProgress.create({ user: userId, topic: name, solved, easy, medium, hard, total });

    res.status(201).json({ success: true, topicProgress: serializeTopic(newTopic) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error adding new topic',
      error: error.message,
    });
  }
};

// 4. (Removed) Manual streak update endpoint.
//    Security/data-integrity: streak is now computed server-side from
//    DailyActivity. There is no endpoint that lets a client set it.

// 5. Get LeetCode Data
exports.getLeetCodeData = async (req, res) => {
  try {
    const userId = req.userId;
    const leetcodeData = await getStoredLeetCodeProfile({ userId });

    res.status(200).json({ success: true, leetcodeData });
  } catch (error) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error retrieving LeetCode stats',
      error: error.details || null,
    });
  }
};

// 6. Sync LeetCode Data
exports.syncLeetCodeData = async (req, res) => {
  try {
    const userId = req.userId;
    const { username } = req.body;

    const result = await syncLeetCodeProfile({ userId, username });

    res.status(200).json({
      success: true,
      leetcodeData: result.leetcodeData,
      summary: result.summary,
    });
  } catch (error) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error syncing LeetCode data',
      error: error.details || null,
    });
  }
};

// 7. Weekly Activity (last 7 UTC days) — single batched query, no N+1.
const getWeeklyActivityData = async (userId) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dates = Array.from({ length: 7 }, (_, i) => utcDaysAgo(6 - i));

  const activities = await DailyActivity.find({
    user: userId,
    date: { $in: dates },
  }).select('date problemsSolvedCount -_id').lean();

  const byKey = new Map(activities.map((a) => [utcDayKey(a.date), a.problemsSolvedCount || 0]));

  return dates.map((d) => ({
    day: daysOfWeek[d.getUTCDay()],
    solved: byKey.get(utcDayKey(d)) || 0,
  }));
};

exports.getWeeklyActivity = async (req, res) => {
  try {
    const result = await getWeeklyActivityData(req.userId);
    res.status(200).json({ success: true, activityData: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving weekly activity data',
      error: error.message,
    });
  }
};
