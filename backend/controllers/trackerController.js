const { TopicProgress, Streak, LeetCodeStat, User, DailyActivity } = require('../models');

const DEFAULT_TOPICS = [
  { topic: 'Arrays', solved: 35, easy: 20, medium: 12, hard: 3, total: 80 },
  { topic: 'Strings', solved: 28, easy: 15, medium: 10, hard: 3, total: 60 },
  { topic: 'Linked Lists', solved: 18, easy: 10, medium: 6, hard: 2, total: 40 },
  { topic: 'Trees', solved: 10, easy: 5, medium: 4, hard: 1, total: 50 },
  { topic: 'Graphs', solved: 4, easy: 2, medium: 2, hard: 0, total: 55 },
  { topic: 'Dynamic Programming', solved: 6, easy: 3, medium: 2, hard: 1, total: 70 },
  { topic: 'Heaps', solved: 8, easy: 4, medium: 3, hard: 1, total: 30 },
  { topic: 'Sorting', solved: 22, easy: 12, medium: 8, hard: 2, total: 35 },
  { topic: 'Binary Search', solved: 14, easy: 8, medium: 5, hard: 1, total: 40 },
  { topic: 'Recursion', solved: 12, easy: 7, medium: 4, hard: 1, total: 35 },
];

// 1. Get Tracker Data (Progress and Streak)
exports.getTrackerData = async (req, res) => {
  try {
    const userId = req.userId;

    // Fetch progress topics
    let topics = await TopicProgress.find({ user: userId });

    // If no progress records, initialize defaults
    if (!topics || topics.length === 0) {
      const initialTopics = DEFAULT_TOPICS.map(t => ({
        ...t,
        user: userId
      }));
      await TopicProgress.insertMany(initialTopics);
      topics = await TopicProgress.find({ user: userId });
    }

    // Fetch streak
    let streakDoc = await Streak.findOne({ user: userId });
    if (!streakDoc) {
      streakDoc = await Streak.create({
        user: userId,
        currentStreak: 7, // Seed with default 7 days to match layout
        bestStreak: 7,
        lastActiveDate: new Date()
      });
    }

    res.status(200).json({
      success: true,
      dsaProgress: topics.map(t => ({
        topic: t.topic,
        solved: t.solved,
        easy: t.easy,
        medium: t.medium,
        hard: t.hard,
        total: t.total
      })),
      streak: streakDoc.currentStreak
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving tracker data',
      error: error.message
    });
  }
};

// 2. Update Topic Progress
exports.updateTopicProgress = async (req, res) => {
  try {
    const userId = req.userId;
    const topicName = req.params.topic;
    const { solved, easy, medium, hard, total } = req.body;

    // Get old solved count to compute difference
    const oldTopic = await TopicProgress.findOne({ user: userId, topic: topicName });
    const oldSolved = oldTopic ? oldTopic.solved : 0;
    const solvedVal = parseInt(solved) || 0;
    const difference = solvedVal - oldSolved;

    const topic = await TopicProgress.findOneAndUpdate(
      { user: userId, topic: topicName },
      {
        solved: solvedVal,
        easy: parseInt(easy) || 0,
        medium: parseInt(medium) || 0,
        hard: parseInt(hard) || 0,
        total: parseInt(total) || 50
      },
      { new: true, upsert: true }
    );

    // Increment today's DailyActivity count if solved count increased
    if (difference > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await DailyActivity.findOneAndUpdate(
        { user: userId, date: today },
        {
          $inc: { problemsSolvedCount: difference },
          $push: {
            problemsSolved: {
              platform: 'Manual',
              title: `Solved ${difference} problem(s) in ${topicName}`,
              difficulty: 'Medium'
            }
          }
        },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({
      success: true,
      topicProgress: {
        topic: topic.topic,
        solved: topic.solved,
        easy: topic.easy,
        medium: topic.medium,
        hard: topic.hard,
        total: topic.total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating topic progress',
      error: error.message
    });
  }
};

// 3. Add Topic Progress
exports.addTopicProgress = async (req, res) => {
  try {
    const userId = req.userId;
    const { topic, solved, easy, medium, hard, total } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Topic name is required'
      });
    }

    // Check if topic already exists
    const existing = await TopicProgress.findOne({ user: userId, topic: topic.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Topic already exists in your tracker'
      });
    }

    const newTopic = await TopicProgress.create({
      user: userId,
      topic: topic.trim(),
      solved: parseInt(solved) || 0,
      easy: parseInt(easy) || 0,
      medium: parseInt(medium) || 0,
      hard: parseInt(hard) || 0,
      total: parseInt(total) || 50
    });

    res.status(201).json({
      success: true,
      topicProgress: {
        topic: newTopic.topic,
        solved: newTopic.solved,
        easy: newTopic.easy,
        medium: newTopic.medium,
        hard: newTopic.hard,
        total: newTopic.total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error adding new topic',
      error: error.message
    });
  }
};

// 4. Update Streak
exports.updateStreak = async (req, res) => {
  try {
    const userId = req.userId;
    const { streak } = req.body;

    const streakVal = parseInt(streak);
    if (isNaN(streakVal) || streakVal < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid streak value is required'
      });
    }

    let streakDoc = await Streak.findOne({ user: userId });
    if (!streakDoc) {
      streakDoc = await Streak.create({
        user: userId,
        currentStreak: streakVal,
        bestStreak: streakVal,
        lastActiveDate: new Date()
      });
    } else {
      streakDoc.currentStreak = streakVal;
      if (streakVal > streakDoc.bestStreak) {
        streakDoc.bestStreak = streakVal;
      }
      streakDoc.lastActiveDate = new Date();
      await streakDoc.save();
    }

    res.status(200).json({
      success: true,
      streak: streakDoc.currentStreak,
      bestStreak: streakDoc.bestStreak
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating streak',
      error: error.message
    });
  }
};

// 5. Get LeetCode Data
exports.getLeetCodeData = async (req, res) => {
  try {
    const userId = req.userId;
    const leetcodeStat = await LeetCodeStat.findOne({ user: userId });
    
    res.status(200).json({
      success: true,
      leetcodeData: leetcodeStat ? leetcodeStat.rawProfile : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving LeetCode stats',
      error: error.message
    });
  }
};

// 6. Sync LeetCode Data
exports.syncLeetCodeData = async (req, res) => {
  try {
    const userId = req.userId;
    const { username } = req.body;

    let leetcodeUsername = username;
    if (!leetcodeUsername) {
      const user = await User.findById(userId);
      leetcodeUsername = user?.leetcode;
    }

    if (!leetcodeUsername) {
      return res.status(400).json({
        success: false,
        message: 'LeetCode username is required or not set in profile'
      });
    }

    const query = `query userProfile($username: String!) { matchedUser(username: $username) { username profile { realName ranking reputation } submitStats { acSubmissionNum { difficulty count submissions } } } }`;
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({ query, variables: { username: leetcodeUsername } })
    });

    if (!response.ok) {
      throw new Error(`LeetCode API returned status ${response.status}`);
    }

    const data = await response.json();
    const matchedUser = data?.data?.matchedUser;

    if (!matchedUser) {
      return res.status(404).json({
        success: false,
        message: `LeetCode user "${leetcodeUsername}" not found`
      });
    }

    const submissions = matchedUser.submitStats?.acSubmissionNum || [];
    const easyCount = submissions.find(s => s.difficulty === 'Easy')?.count || 0;
    const mediumCount = submissions.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardCount = submissions.find(s => s.difficulty === 'Hard')?.count || 0;
    const totalCount = submissions.find(s => s.difficulty === 'All')?.count || (easyCount + mediumCount + hardCount);

    const leetcodeStat = await LeetCodeStat.findOneAndUpdate(
      { user: userId },
      {
        totalSolved: totalCount,
        easySolved: easyCount,
        mediumSolved: mediumCount,
        hardSolved: hardCount,
        ranking: matchedUser.profile?.ranking || null,
        lastSyncedAt: new Date(),
        rawProfile: matchedUser
      },
      { upsert: true, new: true }
    );

    if (username) {
      const user = await User.findById(userId);
      if (user && user.leetcode !== username) {
        user.leetcode = username;
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      leetcodeData: leetcodeStat.rawProfile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error syncing LeetCode data',
      error: error.message
    });
  }
};

// 7. Get Weekly Activity Data (last 7 days)
exports.getWeeklyActivity = async (req, res) => {
  try {
    const userId = req.userId;
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      
      const dayName = daysOfWeek[d.getDay()];
      const activity = await DailyActivity.findOne({ user: userId, date: d });
      result.push({
        day: dayName,
        solved: activity ? activity.problemsSolvedCount : 0
      });
    }

    res.status(200).json({
      success: true,
      activityData: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving weekly activity data',
      error: error.message
    });
  }
};
