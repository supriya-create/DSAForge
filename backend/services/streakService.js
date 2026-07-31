const { DailyActivity } = require('../models');
const { utcDayKey, utcToday, addUtcDays } = require('./dateUtils');

/**
 * Server-side, deterministic streak computation from the DailyActivity
 * collection. A "streak day" is any UTC day with problemsSolvedCount > 0.
 * The current streak must end today or yesterday (otherwise it has lapsed).
 *
 * Architectural change: the streak is now always derived from DailyActivity
 * on the server. The insecure client endpoint that let users set their own
 * streak has been removed, so the value cannot be forged.
 *
 * @returns {Promise<number>} current streak
 */
const computeStreak = async (userId) => {
  const activities = await DailyActivity.find({
    user: userId,
    problemsSolvedCount: { $gt: 0 },
  }).select('date -_id').lean();

  // Unique UTC day keys, ascending.
  const days = [...new Set(activities.map((a) => utcDayKey(a.date)))].sort();

  if (days.length === 0) return 0;

  const todayKey = utcDayKey(utcToday());
  const yesterdayKey = utcDayKey(addUtcDays(utcToday(), -1));
  const lastDay = days[days.length - 1];

  // Streak lapsed unless the most recent activity is today or yesterday.
  if (lastDay !== todayKey && lastDay !== yesterdayKey) return 0;

  // Count consecutive days backwards from the last active day.
  let streak = 1;
  let cursor = addUtcDays(new Date(`${lastDay}T00:00:00Z`), -1);
  const set = new Set(days);
  while (set.has(utcDayKey(cursor))) {
    streak += 1;
    cursor = addUtcDays(cursor, -1);
  }
  return streak;
};

/**
 * Returns the user's current and best streak.
 * Best streak is scanned across all activity days (contiguous runs).
 */
const getStreakData = async (userId) => {
  const currentStreak = await computeStreak(userId);

  const activities = await DailyActivity.find({
    user: userId,
    problemsSolvedCount: { $gt: 0 },
  }).select('date -_id').lean();

  const days = [...new Set(activities.map((a) => utcDayKey(a.date)))].sort();
  let bestStreak = 0;
  if (days.length > 0) {
    let run = 1;
    const set = new Set(days);
    for (let i = 1; i < days.length; i += 1) {
      const prev = new Date(`${days[i - 1]}T00:00:00Z`);
      const cur = new Date(`${days[i]}T00:00:00Z`);
      if (utcDayKey(addUtcDays(prev, 1)) === utcDayKey(cur)) {
        run += 1;
      } else {
        bestStreak = Math.max(bestStreak, run);
        run = 1;
      }
    }
    bestStreak = Math.max(bestStreak, run);
  }

  return { currentStreak, bestStreak };
};

module.exports = { computeStreak, getStreakData };
