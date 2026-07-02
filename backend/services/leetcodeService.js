const { User, LeetCodeStat } = require('../models');

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
  const leetcodeStat = await LeetCodeStat.findOne({ user: userId });
  return leetcodeStat ? leetcodeStat.rawProfile : null;
};

const syncLeetCodeProfile = async ({ userId, username, fetchImpl = fetch }) => {
  let leetcodeUsername = username;

  if (!leetcodeUsername) {
    const user = await User.findById(userId);
    leetcodeUsername = user?.leetcode;
  }

  if (!leetcodeUsername) {
    throw new AppError(400, 'LeetCode username is required or not set in profile');
  }

  const normalizedProfile = await fetchLeetCodeProfile(leetcodeUsername, { fetchImpl });

  const leetcodeStat = await LeetCodeStat.findOneAndUpdate(
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

  if (username) {
    const user = await User.findById(userId);
    if (user && user.leetcode !== username) {
      user.leetcode = username;
      await user.save();
    }
  }

  return {
    leetcodeData: leetcodeStat.rawProfile,
    summary: normalizedProfile.summary,
  };
};

module.exports = {
  AppError,
  fetchLeetCodeProfile,
  getStoredLeetCodeProfile,
  syncLeetCodeProfile,
};
