const cron = require('node-cron');
const { User } = require('../models');
const { syncLeetCodeProfile, AppError } = require('../services/leetcodeService');

const DEFAULT_CRON = process.env.LEETCODE_SYNC_CRON || '0 0 * * *'; // every day at midnight UTC
const MAX_RETRIES = parseInt(process.env.LEETCODE_SYNC_MAX_RETRIES || '5', 10);
const INITIAL_BACKOFF_MS = parseInt(process.env.LEETCODE_SYNC_INITIAL_BACKOFF_MS || '2000', 10);

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

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
        // Unrecoverable for this user (e.g., username missing or invalid) - stop retrying
        return { success: false, error: err };
      }

      if (attempt > MAX_RETRIES) {
        console.error(`[LeetSync] [${new Date().toISOString()}] Exhausted retries for user=${userId} username=${username}`);
        return { success: false, error: err };
      }

      // Exponential backoff before next retry
      await sleep(delay);
      delay = delay * 2;
    }
  }
  return { success: false, error: new Error('Unknown retry failure') };
}

async function runFullSync() {
  console.log(`[LeetSync] [${new Date().toISOString()}] Starting full LeetCode sync job`);
  try {
    const users = await User.find({}, '_id leetcodeUsername leetcode').lean();
    console.log(`[LeetSync] Found ${users.length} users to evaluate for sync`);

    for (const u of users) {
      const userId = u._id;
      const username = (u.leetcodeUsername || u.leetcode || '').trim();

      if (!username) {
        console.log(`[LeetSync] [${new Date().toISOString()}] Skipping user=${userId} (no LeetCode username)`);
        continue;
      }

      try {
        const res = await retrySync(userId, username);
        if (!res.success) {
          console.error(`[LeetSync] [${new Date().toISOString()}] Sync ultimately failed for user=${userId} username=${username}: ${res.error?.message || 'unknown'}`);
        }
      } catch (iterErr) {
        console.error(`[LeetSync] [${new Date().toISOString()}] Unexpected error syncing user=${userId}: ${iterErr.message}`);
      }
    }

    console.log(`[LeetSync] [${new Date().toISOString()}] Full LeetCode sync job completed`);
  } catch (err) {
    console.error(`[LeetSync] [${new Date().toISOString()}] Failed to run full sync job: ${err.message}`);
  }
}

function startScheduler() {
  console.log(`[LeetSync] Scheduler starting with cron '${DEFAULT_CRON}'`);
  // Schedule the job
  cron.schedule(DEFAULT_CRON, () => {
    runFullSync().catch(err => console.error('[LeetSync] scheduled run error:', err));
  }, {
    scheduled: true,
    timezone: process.env.LEETCODE_SYNC_TZ || 'UTC'
  });

  // Also run once on startup (non-blocking)
  setImmediate(() => {
    runFullSync().catch(err => console.error('[LeetSync] immediate run error:', err));
  });
}

module.exports = { startScheduler, runFullSync };
