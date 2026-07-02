const { User, LeetCodeStat, LeetcodeStats } = require('../models');

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

class AppError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

const buildLeetCodeQuery = () => `
  query userProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        realName
        ranking
        reputation
      }
      submitStats {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
      }
    }
  }
`;

const normalizeLeetCodeProfile = (matchedUser) => {
  const submissions = matchedUser?.submitStats?.acSubmissionNum || [];
  const easyCount = submissions.find((entry) => entry.difficulty === 'Easy')?.count || 0;
  const mediumCount = submissions.find((entry) => entry.difficulty === 'Medium')?.count || 0;
  const hardCount = submissions.find((entry) => entry.difficulty === 'Hard')?.count || 0;
  const totalCount = submissions.find((entry) => entry.difficulty === 'All')?.count || (easyCount + mediumCount + hardCount);

  return {
    username: matchedUser?.username || null,
    profile: matchedUser?.profile || null,
    submitStats: matchedUser?.submitStats || null,
    summary: {
      totalSolved: totalCount,
      easySolved: easyCount,
      mediumSolved: mediumCount,
      hardSolved: hardCount,
      ranking: matchedUser?.profile?.ranking || null,
    },
  };
};

const fetchLeetCodeProfile = async (username, { fetchImpl = fetch } = {}) => {
  if (!username) {
    throw new AppError(400, 'LeetCode username is required');
  }

  const response = await fetchImpl(LEETCODE_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    body: JSON.stringify({
      query: buildLeetCodeQuery(),
      variables: { username },
    }),
  });

  if (!response.ok) {
    throw new AppError(502, `LeetCode API returned status ${response.status}`);
  }

  const data = await response.json();
  const matchedUser = data?.data?.matchedUser;

  if (!matchedUser) {
    throw new AppError(404, `LeetCode user "${username}" not found`);
  }

  return normalizeLeetCodeProfile(matchedUser);
};

const getStoredLeetCodeProfile = async ({ userId }) => {
  const leetcodeStats = await LeetcodeStats.findOne({ userId }).lean();
  if (leetcodeStats) {
    return {
      username: leetcodeStats.username,
      summary: {
        totalSolved: leetcodeStats.totalSolved,
        easySolved: leetcodeStats.easySolved,
        mediumSolved: leetcodeStats.mediumSolved,
        hardSolved: leetcodeStats.hardSolved,
        ranking: leetcodeStats.ranking,
      },
      contestRating: leetcodeStats.contestRating,
      contestHistory: leetcodeStats.contestHistory,
      recentSubmissions: leetcodeStats.recentSubmissions,
      badges: leetcodeStats.badges,
      languageStats: leetcodeStats.languageStats,
      lastSynced: leetcodeStats.lastSynced,
    };
  }

  const legacyStat = await LeetCodeStat.findOne({ user: userId });
  return legacyStat ? legacyStat.rawProfile : null;
};

const syncLeetCodeProfile = async ({ userId, username, fetchImpl = fetch }) => {
  const providedUsername = typeof username === 'string' ? username.trim() : '';
  let leetcodeUsername = providedUsername;

  if (!leetcodeUsername) {
    const user = await User.findById(userId);
    leetcodeUsername = user?.leetcodeUsername || user?.leetcode || '';
  }

  if (!leetcodeUsername) {
    throw new AppError(400, 'LeetCode username is required or not set in profile');
  }

  const normalizedProfile = await fetchLeetCodeProfile(leetcodeUsername, { fetchImpl });

  const statsPayload = {
    userId,
    username: normalizedProfile.username || leetcodeUsername,
    totalSolved: normalizedProfile.summary.totalSolved,
    easySolved: normalizedProfile.summary.easySolved,
    mediumSolved: normalizedProfile.summary.mediumSolved,
    hardSolved: normalizedProfile.summary.hardSolved,
    acceptanceRate: 0,
    ranking: normalizedProfile.summary.ranking,
    contestRating: 0,
    contestHistory: [],
    recentSubmissions: [],
    badges: [],
    languageStats: [],
    lastSynced: new Date(),
  };

  const leetcodeStats = await LeetcodeStats.findOneAndUpdate(
    { userId },
    { $set: statsPayload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await LeetCodeStat.findOneAndUpdate(
    { user: userId },
    {
      totalSolved: normalizedProfile.summary.totalSolved,
      easySolved: normalizedProfile.summary.easySolved,
      mediumSolved: normalizedProfile.summary.mediumSolved,
      hardSolved: normalizedProfile.summary.hardSolved,
      ranking: normalizedProfile.summary.ranking,
      lastSyncedAt: new Date(),
      rawProfile: normalizedProfile,
    },
    { upsert: true, new: true }
  );

  const user = await User.findById(userId);
  if (user) {
    if (providedUsername && user.leetcodeUsername !== providedUsername) {
      user.leetcodeUsername = providedUsername;
    }
    if (!user.leetcode && leetcodeUsername) {
      user.leetcode = leetcodeUsername;
    }
    if (user.isModified('leetcodeUsername') || user.isModified('leetcode')) {
      await user.save();
    }
  }

  return {
    leetcodeData: {
      username: leetcodeStats.username,
      summary: {
        totalSolved: leetcodeStats.totalSolved,
        easySolved: leetcodeStats.easySolved,
        mediumSolved: leetcodeStats.mediumSolved,
        hardSolved: leetcodeStats.hardSolved,
        ranking: leetcodeStats.ranking,
      },
      contestRating: leetcodeStats.contestRating,
      contestHistory: leetcodeStats.contestHistory,
      recentSubmissions: leetcodeStats.recentSubmissions,
      badges: leetcodeStats.badges,
      languageStats: leetcodeStats.languageStats,
      lastSynced: leetcodeStats.lastSynced,
    },
    summary: normalizedProfile.summary,
    stats: leetcodeStats,
  };
};

module.exports = {
  AppError,
  fetchLeetCodeProfile,
  getStoredLeetCodeProfile,
  syncLeetCodeProfile,
};
