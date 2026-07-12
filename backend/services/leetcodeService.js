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

// In-memory cache for fetched profiles (simple TTL cache)
const CACHE_TTL_MS = parseInt(process.env.LEETCODE_CACHE_TTL_MS || String(1000 * 60 * 60), 10); // default 1 hour
const cache = new Map(); // username -> { data, expiresAt }

// In-flight dedupe map to prevent duplicate concurrent requests
const inflight = new Map(); // username -> Promise

// Retry/backoff configuration
const MAX_FETCH_RETRIES = parseInt(process.env.LEETCODE_FETCH_MAX_RETRIES || '4', 10);
const INITIAL_FETCH_BACKOFF_MS = parseInt(process.env.LEETCODE_FETCH_INITIAL_BACKOFF_MS || '1000', 10);

// Structured logging helper
const log = (level, message, meta = {}) => {
  const entry = { ts: new Date().toISOString(), level, message, ...meta };
  try {
    console.log(JSON.stringify(entry));
  } catch (e) {
    console.log(level, message, meta);
  }
};

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const isTransientStatus = (status) => {
  // Treat 429 and 5xx as transient
  return status === 429 || (status >= 500 && status < 600);
};

const buildLeetCodeQuery = () => `
  query leetcodeStats($username: String!) {
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
    userContestRanking(username: $username) {
      attendedContestsCount
      rating
      globalRanking
      totalParticipants
      topPercentage
    }
    userContestRankingHistory(username: $username) {
      attended
      trendDirection
      problemsSolved
      totalProblems
      finishTimeInSeconds
      rating
      ranking
      contest {
        title
        startTime
      }
    }
    recentAcSubmissionList(username: $username, limit: 15) {
      id
      title
      titleSlug
      timestamp
    }
  }
`;

const normalizeLeetCodeProfile = (data) => {
  const matchedUser = data?.matchedUser;
  const contestRanking = data?.userContestRanking;
  const contestHistory = data?.userContestRankingHistory || [];
  const recentSubmissions = data?.recentAcSubmissionList || [];

  const submissions = matchedUser?.submitStats?.acSubmissionNum || [];
  const easyCount = submissions.find((entry) => entry.difficulty === 'Easy')?.count || 0;
  const mediumCount = submissions.find((entry) => entry.difficulty === 'Medium')?.count || 0;
  const hardCount = submissions.find((entry) => entry.difficulty === 'Hard')?.count || 0;
  const totalCount = submissions.find((entry) => entry.difficulty === 'All')?.count || (easyCount + mediumCount + hardCount);

  // Map contest history
  const mappedContestHistory = contestHistory
    .filter(item => item.attended && item.contest)
    .map(item => ({
      contestId: item.contest.title || '',
      rank: item.ranking || 0,
      rating: Math.round(item.rating) || 0,
      attendedAt: item.contest.startTime ? new Date(item.contest.startTime * 1000) : new Date()
    }));

  // Map recent submissions
  const mappedRecentSubmissions = recentSubmissions.map(item => ({
    problemTitle: item.title || '',
    problemId: item.id || item.titleSlug || '',
    difficulty: 'Medium', // Default since recentAcSubmissionList doesn't return difficulty
    status: 'Accepted',
    timestamp: item.timestamp ? new Date(item.timestamp * 1000) : new Date(),
    language: 'C++' // Default
  }));

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
    contestRating: contestRanking ? Math.round(contestRanking.rating) : 0,
    contestHistory: mappedContestHistory,
    recentSubmissions: mappedRecentSubmissions,
    badges: [],
    languageStats: []
  };
};

const fetchLeetCodeProfile = async (username, { fetchImpl = fetch } = {}) => {
  if (!username || typeof username !== 'string' || !username.trim()) {
    throw new AppError(400, 'LeetCode username is required');
  }
  username = username.trim();

  // Serve from cache if fresh
  const cached = cache.get(username);
  if (cached && cached.expiresAt > Date.now()) {
    log('debug', 'cache_hit', { username });
    return cached.data;
  }

  // If a request for this username is already in-flight, reuse its Promise
  if (inflight.has(username)) {
    log('debug', 'dedupe_inflight', { username });
    return inflight.get(username);
  }

  // Create a promise and store in inflight map
  const promise = (async () => {
    let attempt = 0;
    let backoff = INITIAL_FETCH_BACKOFF_MS;
    while (attempt <= MAX_FETCH_RETRIES) {
      attempt += 1;
      try {
        log('info', 'fetch_attempt', { username, attempt });
        const response = await fetchImpl(LEETCODE_GRAPHQL_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': process.env.LEETCODE_USER_AGENT || 'DSAForge/1.0 (+https://example.com)'
          },
          body: JSON.stringify({
            query: buildLeetCodeQuery(),
            variables: { username },
          }),
        });

        if (!response.ok) {
          const status = response.status;
          const retryAfter = parseInt(response.headers.get('retry-after') || '0', 10);
          log('warn', 'fetch_response_not_ok', { username, status, retryAfter });
          if (isTransientStatus(status) && attempt <= MAX_FETCH_RETRIES) {
            const waitMs = retryAfter > 0 ? retryAfter * 1000 : backoff;
            log('info', 'transient_retry', { username, attempt, waitMs });
            await sleep(waitMs);
            backoff *= 2;
            continue;
          }
          if (status === 404) {
            throw new AppError(404, `LeetCode user \"${username}\" not found`);
          }
          throw new AppError(502, `LeetCode API returned status ${status}`);
        }

        const resData = await response.json();
        const matchedUser = resData?.data?.matchedUser;
        if (!matchedUser) {
          throw new AppError(404, `LeetCode user \"${username}\" not found`);
        }

        const normalized = normalizeLeetCodeProfile(resData.data);
        // Cache result
        cache.set(username, { data: normalized, expiresAt: Date.now() + CACHE_TTL_MS });
        log('info', 'fetch_success', { username });
        return normalized;
      } catch (err) {
        // If it's an AppError that's non-transient, rethrow immediately
        if (err instanceof AppError && err.statusCode && err.statusCode < 500 && err.statusCode !== 429) {
          log('error', 'fetch_nonretriable_error', { username, message: err.message });
          throw err;
        }

        // Last attempt: throw
        if (attempt > MAX_FETCH_RETRIES) {
          log('error', 'fetch_exhausted', { username, attempt, message: err.message });
          throw new AppError(502, `Failed to fetch LeetCode profile for ${username}: ${err.message}`);
        }

        // Transient error - backoff and retry
        log('warn', 'fetch_transient_error', { username, attempt, message: err.message });
        await sleep(backoff);
        backoff *= 2;
      }
    }
    throw new AppError(502, 'Unknown error fetching LeetCode profile');
  })();

  inflight.set(username, promise);
  try {
    const result = await promise;
    return result;
  } finally {
    inflight.delete(username);
  }
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

  // Use the improved fetch which includes caching and retries
  const normalizedProfile = await fetchLeetCodeProfile(leetcodeUsername, { fetchImpl });

  if (!normalizedProfile || !normalizedProfile.summary) {
    throw new AppError(502, 'Invalid profile data returned from LeetCode');
  }

  const statsPayload = {
    userId,
    username: normalizedProfile.username || leetcodeUsername,
    totalSolved: normalizedProfile.summary.totalSolved || 0,
    easySolved: normalizedProfile.summary.easySolved || 0,
    mediumSolved: normalizedProfile.summary.mediumSolved || 0,
    hardSolved: normalizedProfile.summary.hardSolved || 0,
    acceptanceRate: 0,
    ranking: normalizedProfile.summary.ranking || null,
    contestRating: normalizedProfile.contestRating || 0,
    contestHistory: normalizedProfile.contestHistory || [],
    recentSubmissions: normalizedProfile.recentSubmissions || [],
    badges: normalizedProfile.badges || [],
    languageStats: normalizedProfile.languageStats || [],
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
      totalSolved: normalizedProfile.summary.totalSolved || 0,
      easySolved: normalizedProfile.summary.easySolved || 0,
      mediumSolved: normalizedProfile.summary.mediumSolved || 0,
      hardSolved: normalizedProfile.summary.hardSolved || 0,
      ranking: normalizedProfile.summary.ranking || null,
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
