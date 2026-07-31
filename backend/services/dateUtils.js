/**
 * Date helpers.
 *
 * Architectural change (timezones): all "activity day" boundaries are now
 * normalized to UTC midnight so streak / weekly-activity / daily-activity
 * queries are deterministic and independent of the server's local timezone.
 * Previously the code used server-local midnight, which produced different
 * results depending on where the server was hosted.
 */

const pad = (n) => String(n).padStart(2, '0');

/** Returns a new Date set to UTC midnight for the given date. */
const utcDay = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/** Today's UTC-midnight Date. */
const utcToday = () => utcDay(new Date());

/** A Date for N days ago, at UTC midnight. */
const utcDaysAgo = (n) => {
  const d = utcToday();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};

/** Stable string key YYYY-MM-DD (UTC) for grouping/streak math. */
const utcDayKey = (date) => {
  const d = utcDay(date);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

/** Add days to a UTC-midnight Date (mutates and returns it). */
const addUtcDays = (date, days) => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

module.exports = { utcDay, utcToday, utcDaysAgo, utcDayKey, addUtcDays };
