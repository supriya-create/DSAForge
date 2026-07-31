const { User, LeetcodeStats, Streak, DailyActivity } = require('../models');
const { getStreakData } = require('./streakService');
const { utcDay, utcDayKey } = require('./dateUtils');

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

const isTransientStatus = (status) => status === 429 || (status >= 500 && status < 600);

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
        acSubmissionNum { difficulty count submissions }
        totalSubmissionNum { difficulty count submissions }
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
      problemsSolved
      totalProblems
      finishTimeInSeconds
      rating
      ranking
      contest { title startTime }
    }
    recentSubmissionList(username: $username, limit: 20) {
      title
      titleSlug
      timestamp
      lang
      status
    }
  }
`;

const normalizeLeetCodeProfile = (data) => {
  const matchedUser = data?.matchedUser;
  const contestRanking = data?.userContestRanking;
  const contestHistory = data?.userContestRankingHistory || [];
  const recentSubmissions = data?.recentSubmissionList || [];

  const submissions = matchedUser?.submitStats?.acSubmissionNum || [];
  const totals = matchedUser?.submitStats?.totalSubmissionNum || [];

  const countFor = (arr, difficulty) => arr.find((e) => e.difficulty === difficulty)?.count || 0;
  const easyCount = countFor(submissions, 'Easy');
  const mediumCount = countFor(submissions, 'Medium');
  const hardCount = countFor(submissions, 'Hard');
  const totalAccepted = countFor(submissions, 'All') || (easyCount + mediumCount + hardCount);
  const totalAttempted = countFor(totals, 'All');

  // Real acceptance rate. null when there is no attempt data (never fake 0).
  const acceptanceRate = totalAttempted > 0
    ? Math.round((totalAccepted / totalAttempted) * 100)
    : null;

  // Map contest history
  const mappedContestHistory = contestHistory
    .filter((item) => item.attended && item.contest)
    .map((item) => ({
      contestId: item.contest.title || '',
      rank: item.ranking || 0,
      rating: Math.round(item.rating) || 0,
      attendedAt: item.contest.startTime ? new Date(item.contest.startTime * 1000) : new Date(),
    }));

  // Map recent submissions (only Accepted, with real language from the API).
  // Difficulty is not returned by this endpoint and is intentionally left as
  // null rather than fabricated as "Medium".
  const mappedRecentSubmissions = recentSubmissions
    .filter((item) => item.status === 'Accepted')
    .map((item) => ({
      problemTitle: item.title || '',
      problemId: item.titleSlug || item.id || '',
      difficulty: null,
      status: 'Accepted',
      timestamp: item.timestamp ? new Date(item.timestamp * 1000) : new Date(),
      language: item.lang || null,
    }));

  return {
    username: matchedUser?.username || null,
    profile: matchedUser?.profile || null,
    summary: {
      totalSolved: totalAccepted,
      easySolved: easyCount,
      mediumSolved: mediumCount,
      hardSolved: hardCount,
      ranking: matchedUser?.profile?.ranking || null,
      acceptanceRate,
    },
    contestRating: contestRanking ? Math.round(contestRanking.rating) : 0,
    contestHistory: mappedContestHistory,
    recentSubmissions: mappedRecentSubmissions,
    badges: null, // not returned by the public API — honestly null, never fabricated
    languageStats: null, // not returned by the public API — honestly null, never fabricated
  };
};

const fetchLeetCodeProfile = async (username, { fetchImpl = fetch } = {}) => {
  if (!username || typeof username !== 'string' || !username.trim()) {
    throw new AppError(400, 'LeetCode username is required');
  }
  username = username.trim();

  const cached = cache.get(username);
  if (cached && cached.expiresAt > Date.now()) {
    log('debug', 'cache_hit', { username });
    return cached.data;
  }

  if (inflight.has(username)) {
    log('debug', 'dedupe_inflight', { username });
    return inflight.get(username);
  }

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
            'User-Agent': process.env.LEETCODE_USER_AGENT || 'DSAForge/1.0 (+https://example.com)',
          },
          body: JSON.stringify({ query: buildLeetCodeQuery(), variables: { username } }),
        });

        if (!response.ok) {
          const status = response.status;
          const retryAfter = parseInt(response.headers.get('retry-after') || '0', 10);
          log('warn', 'fetch_response_not_ok', { username, status, retryAfter });
          if (isTransientStatus(status) && attempt <= MAX_FETCH_RETRIES) {
            const waitMs = retryAfter > 0 ? retryAfter * 1000 : backoff;
            await sleep(waitMs);
            backoff *= 2;
            continue;
          }
          if (status === 404) {
            throw new AppError(404, `LeetCode user "${username}" not found`);
          }
          throw new AppError(502, `LeetCode API returned status ${status}`);
        }

        const resData = await response.json();
        const matchedUser = resData?.data?.matchedUser;
        if (!matchedUser) {
          throw new AppError(404, `LeetCode user "${username}" not found`);
        }

        const normalized = normalizeLeetCodeProfile(resData.data);
        cache.set(username, { data: normalized, expiresAt: Date.now() + CACHE_TTL_MS });
        log('info', 'fetch_success', { username });
        return normalized;
      } catch (err) {
        if (err instanceof AppError && err.statusCode && err.statusCode < 500 && err.statusCode !== 429) {
          log('error', 'fetch_nonretriable_error', { username, message: err.message });
          throw err;
        }
        if (attempt > MAX_FETCH_RETRIES) {
          log('error', 'fetch_exhausted', { username, attempt, message: err.message });
          throw new AppError(502, `Failed to fetch LeetCode profile for ${username}: ${err.message}`);
        }
        log('warn', 'fetch_transient_error', { username, attempt, message: err.message });
        await sleep(backoff);
        backoff *= 2;
      }
    }
    throw new AppError(502, 'Unknown error fetching LeetCode profile');
  })();

  inflight.set(username, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(username);
  }
};

const getStoredLeetCodeProfile = async ({ userId }) => {
  const leetcodeStats = await LeetcodeStats.findOne({ userId }).lean();
  if (!leetcodeStats) return null;
  return {
    username: leetcodeStats.username,
    summary: {
      totalSolved: leetcodeStats.totalSolved,
      easySolved: leetcodeStats.easySolved,
      mediumSolved: leetcodeStats.mediumSolved,
      hardSolved: leetcodeStats.hardSolved,
      ranking: leetcodeStats.ranking,
      acceptanceRate: leetcodeStats.acceptanceRate,
    },
    contestRating: leetcodeStats.contestRating,
    contestHistory: leetcodeStats.contestHistory,
    recentSubmissions: leetcodeStats.recentSubmissions,
    badges: leetcodeStats.badges ?? null,
    languageStats: leetcodeStats.languageStats ?? null,
    lastSynced: leetcodeStats.lastSynced,
  };
};

const syncLeetCodeProfile = async ({ userId, username, fetchImpl = fetch }) => {
  const providedUsername = typeof username === 'string' ? username.trim() : '';
  let leetcodeUsername = providedUsername;

  if (!leetcodeUsername) {
    const user = await User.findById(userId);
    leetcodeUsername = user?.leetcodeUsername || '';
  }

  if (!leetcodeUsername) {
    throw new AppError(400, 'LeetCode username is required or not set in profile');
  }

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
    acceptanceRate: normalizedProfile.summary.acceptanceRate ?? null,
    ranking: normalizedProfile.summary.ranking || null,
    contestRating: normalizedProfile.contestRating || 0,
    contestHistory: normalizedProfile.contestHistory || [],
    recentSubmissions: normalizedProfile.recentSubmissions || [],
    badges: normalizedProfile.badges ?? null,
    languageStats: normalizedProfile.languageStats ?? null,
    lastSynced: new Date(),
  };

  const leetcodeStats = await LeetcodeStats.findOneAndUpdate(
    { userId },
    { $set: statsPayload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Populate DailyActivity from accepted submissions (UTC-normalized days).
  const recentSubs = normalizedProfile.recentSubmissions || [];
  const dayBuckets = new Map(); // utcDayKey -> [{ problemId, title, difficulty }]

  for (const sub of recentSubs) {
    if (sub.timestamp) {
      const key = utcDayKey(sub.timestamp);
      if (!dayBuckets.has(key)) dayBuckets.set(key, []);
      const bucket = dayBuckets.get(key);
      if (!bucket.some((b) => b.problemId === sub.problemId)) {
        bucket.push({ problemId: sub.problemId, title: sub.problemTitle, difficulty: sub.difficulty });
      }
    }
  }

  for (const [key, items] of dayBuckets) {
    const date = utcDay(new Date(`${key}T00:00:00Z`));
    const activity = await DailyActivity.findOne({ user: userId, date });

    if (activity) {
      // Merge: only push problems not already recorded for that day.
      const existingIds = new Set(activity.problemsSolved.map((p) => p.problemId).filter(Boolean));
      const toAdd = items.filter((i) => !existingIds.has(i.problemId));
      if (toAdd.length) {
        await DailyActivity.updateOne(
          { _id: activity._id },
          {
            $inc: { problemsSolvedCount: toAdd.length },
            $push: { problemsSolved: { $each: toAdd.map((i) => ({ problemId: i.problemId, platform: 'LeetCode', title: i.title, difficulty: i.difficulty })) } },
          }
        );
      }
    } else {
      await DailyActivity.create({
        user: userId,
        date,
        problemsSolvedCount: items.length,
        problemsSolved: items.map((i) => ({ problemId: i.problemId, platform: 'LeetCode', title: i.title, difficulty: i.difficulty })),
      });
    }
  }

  // Recompute streak server-side from DailyActivity and persist it.
  const { currentStreak, bestStreak } = await getStreakData(userId);
  await Streak.updateOne(
    { user: userId },
    {
      $set: {
        currentStreak,
        bestStreak: Math.max(bestStreak, 0),
        lastActiveDate: currentStreak > 0 ? new Date() : null,
      },
    },
    { upsert: true }
  );

  // Unify on the canonical leetcodeUsername field.
  const user = await User.findById(userId);
  if (user && leetcodeUsername && user.leetcodeUsername !== leetcodeUsername) {
    user.leetcodeUsername = leetcodeUsername;
    await user.save();
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
        acceptanceRate: leetcodeStats.acceptanceRate,
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
