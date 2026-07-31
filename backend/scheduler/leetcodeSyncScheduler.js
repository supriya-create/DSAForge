const cron = require('node-cron');
const { User } = require('../models');
const { syncLeetCodeProfile, AppError } = require('../services/leetcodeService');

const DEFAULT_CRON = process.env.LEETCODE_SYNC_CRON || '0 0 * * *'; // every day at midnight UTC
const MAX_RETRIES = parseInt(process.env.LEETCODE_SYNC_MAX_RETRIES || '5', 10);
const INITIAL_BACKOFF_MS = parseInt(process.env.LEETCODE_SYNC_INITIAL_BACKOFF_MS || '2000', 10);
// Concurrency cap so we never hammer LeetCode's unauthenticated API.
const CONCURRENCY = parseInt(process.env.LEETCODE_SYNC_CONCURRENCY || '3', 10);

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/** Runs an async fn over items with a fixed concurrency cap. */
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let index = 0;
  const workerCount = Math.max(1, Math.min(limit, items.length));
  const workers = Array.from({ length: workerCount }, async () => {
    while (index < items.length) {
      const i = index;
      index += 1;
      try {
        results[i] = await fn(items[i], i);
      } catch (err) {
        results[i] = { success: false, error: err };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

async function retrySync(userId, username) {
  let attempt = 0;
  let delay = INITIAL_BACKOFF_MS;
  while (attempt <= MAX_RETRIES) {
    try {
      attempt += 1;
      console.log(`[LeetSync] [${new Date().toISOString()}] Attempt ${attempt} sync for user=${userId} username=${username}`);
      const result = await syncLeetCodeProfile({ userId, username });
      console.log(`[LeetSync] [${new Date().toISOString()}] SUCCESS sync for user=${userId} username=${username} solved=${result.leetcodeData?.summary?.totalSolved}`);
      return { success: true, result };
    } catch (err) {
      const isBadRequest = err instanceof AppError && err.statusCode === 400;
      console.warn(`[LeetSync] [${new Date().toISOString()}] Failed sync attempt ${attempt} for user=${userId} username=${username}: ${err.message}`);
      if (isBadRequest) {
        // Unrecoverable for this user (username missing/invalid) — stop retrying.
        return { success: false, error: err };
      }
      if (attempt > MAX_RETRIES) {
        console.error(`[LeetSync] [${new Date().toISOString()}] Exhausted retries for user=${userId} username=${username}`);
        return { success: false, error: err };
      }
      await sleep(delay);
      delay = delay * 2;
    }
  }
  return { success: false, error: new Error('Unknown retry failure') };
}

async function runFullSync() {
  console.log(`[LeetSync] [${new Date().toISOString()}] Starting full LeetCode sync job (concurrency=${CONCURRENCY})`);
  try {
    const users = await User.find({}, '_id leetcodeUsername').lean();
    console.log(`[LeetSync] Found ${users.length} users to evaluate for sync`);

    const withUsernames = users
      .map((u) => ({ userId: u._id, username: (u.leetcodeUsername || '').trim() }))
      .filter((u) => u.username);

    console.log(`[LeetSync] ${withUsernames.length} users have a LeetCode username to sync`);

    const results = await mapWithConcurrency(withUsernames, CONCURRENCY, (u) => retrySync(u.userId, u.username));

    const failed = results.filter((r) => r && !r.success).length;
    console.log(`[LeetSync] [${new Date().toISOString()}] Full LeetCode sync job completed. failed=${failed}/${results.length}`);
  } catch (err) {
    console.error(`[LeetSync] [${new Date().toISOString()}] Failed to run full sync job: ${err.message}`);
  }
}

function startScheduler() {
  console.log(`[LeetSync] Scheduler starting with cron '${DEFAULT_CRON}'`);
  cron.schedule(
    DEFAULT_CRON,
    () => {
      runFullSync().catch((err) => console.error('[LeetSync] scheduled run error:', err));
    },
    { scheduled: true, timezone: process.env.LEETCODE_SYNC_TZ || 'UTC' }
  );

  // Also run once on startup (non-blocking).
  setImmediate(() => {
    runFullSync().catch((err) => console.error('[LeetSync] immediate run error:', err));
  });
}

module.exports = { startScheduler, runFullSync };
