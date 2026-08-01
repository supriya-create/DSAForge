const { DailyActivity } = require('../models');
const { utcDayKey, utcToday, addUtcDays } = require('./dateUtils');

/**
 * Pure helpers for streak math. Kept free of DB/IO so they can be unit-tested
 * in isolation. All day values are YYYY-MM-DD strings in UTC.
 */

const sortedKeys = (keys) => [...new Set(keys)].sort();

/**
 * Current streak: consecutive days (ending today or yesterday) with activity.
 */
const computeStreakFromDayKeys = (dayKeys, todayKey, yesterdayKey) => {
  const sorted = sortedKeys(dayKeys);
  if (sorted.length === 0) return 0;

  const lastDay = sorted[sorted.length - 1];
  // A streak lapses unless the most recent activity is today or yesterday.
  if (lastDay !== todayKey && lastDay !== yesterdayKey) return 0;

  let streak = 1;
  const set = new Set(sorted);
  let cursor = addUtcDays(new Date(`${lastDay}T00:00:00Z`), -1);
  while (set.has(utcDayKey(cursor))) {
    streak += 1;
    cursor = addUtcDays(cursor, -1);
  }
  return streak;
};

/** Longest contiguous run of activity days. */
const computeBestStreakFromDayKeys = (dayKeys) => {
  const sorted = sortedKeys(dayKeys);
  if (sorted.length === 0) return 0;

  let best = 0;
  let run = 1;
  const set = new Set(sorted);
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00Z`);
    const cur = new Date(`${sorted[i]}T00:00:00Z`);
    if (utcDayKey(addUtcDays(prev, 1)) === utcDayKey(cur)) {
      run += 1;
    } else {
      best = Math.max(best, run);
      run = 1;
    }
  }
  return Math.max(best, run);
};

// ---- DB-backed wrappers ----

const activityDayKeys = async (userId) => {
  const activities = await DailyActivity.find({
    user: userId,
    problemsSolvedCount: { $gt: 0 },
  }).select('date -_id').lean();
  return activities.map((a) => utcDayKey(a.date));
};

const computeStreak = async (userId) => {
  const keys = await activityDayKeys(userId);
  return computeStreakFromDayKeys(keys, utcDayKey(utcToday()), utcDayKey(addUtcDays(utcToday(), -1)));
};

const getStreakData = async (userId) => {
  const keys = await activityDayKeys(userId);
  const currentStreak = computeStreakFromDayKeys(keys, utcDayKey(utcToday()), utcDayKey(addUtcDays(utcToday(), -1)));
  const bestStreak = computeBestStreakFromDayKeys(keys);
  return { currentStreak, bestStreak };
};

module.exports = {
  computeStreak,
  getStreakData,
  computeStreakFromDayKeys,
  computeBestStreakFromDayKeys,
};
