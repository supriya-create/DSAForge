const { computeStreakFromDayKeys, computeBestStreakFromDayKeys } = require('../services/streakService');
const { utcDayKey, utcToday, addUtcDays } = require('../services/dateUtils');

const today = utcDayKey(utcToday());
const yesterday = utcDayKey(addUtcDays(utcToday(), -1));
const d2 = utcDayKey(addUtcDays(utcToday(), -2));
const d3 = utcDayKey(addUtcDays(utcToday(), -3));
const d5 = utcDayKey(addUtcDays(utcToday(), -5));

describe('streakService — current streak', () => {
  test('returns 0 when there is no activity', () => {
    expect(computeStreakFromDayKeys([], today, yesterday)).toBe(0);
  });

  test('counts consecutive days ending today', () => {
    expect(computeStreakFromDayKeys([d2, yesterday, today], today, yesterday)).toBe(3);
  });

  test('counts a single day yesterday as 1', () => {
    expect(computeStreakFromDayKeys([yesterday], today, yesterday)).toBe(1);
  });

  test('lapses (0) when the last activity is older than yesterday', () => {
    expect(computeStreakFromDayKeys([d3, d2], today, yesterday)).toBe(0);
  });

  test('ignores duplicates and unsorted input', () => {
    expect(computeStreakFromDayKeys([yesterday, today, today, yesterday], today, yesterday)).toBe(2);
  });
});

describe('streakService — best streak', () => {
  test('returns 0 when there is no activity', () => {
    expect(computeBestStreakFromDayKeys([])).toBe(0);
  });

  test('finds the longest contiguous run', () => {
    // d5 isolated; d3..today is a run of 4
    const keys = [d5, d3, d2, yesterday, today];
    expect(computeBestStreakFromDayKeys(keys)).toBe(4);
  });

  test('single day gives a best of 1', () => {
    expect(computeBestStreakFromDayKeys([d3])).toBe(1);
  });
});
