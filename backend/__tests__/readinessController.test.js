const { computeReadiness } = require('../controllers/readinessController');

const topics = [
  { topic: 'Arrays', solved: 40, total: 80 },
  { topic: 'Strings', solved: 5, total: 60 },
  { topic: 'Trees', solved: 45, total: 50 },
];
const leetcode = { contestHistory: [{}, {}, {}], easySolved: 10, mediumSolved: 5, hardSolved: 1, totalSolved: 16 };
const streak = { currentStreak: 3, bestStreak: 5 };
const ai = null;

describe('computeReadiness', () => {
  test('computes a weighted overall score and topic map', () => {
    const r = computeReadiness(topics, leetcode, streak, ai);
    expect(r.overall).toBeGreaterThan(0);
    expect(r.overall).toBeLessThanOrEqual(100);
    expect(r.topics).toHaveProperty('Arrays');
    expect(r.topics).toHaveProperty('Trees');
    expect(r.next_steps.length).toBeGreaterThan(0);
  });

  test('labels low completion as Needs Work', () => {
    const low = [{ topic: 'A', solved: 1, total: 100 }];
    expect(computeReadiness(low, null, streak, ai).verdict).toBe('Needs Work');
  });

  test('labels high completion as Ready', () => {
    const high = [{ topic: 'A', solved: 95, total: 100 }];
    expect(computeReadiness(high, leetcode, streak, ai).verdict).toBe('Ready');
  });

  test('derives strengths and gaps from topic completion', () => {
    const r = computeReadiness(topics, leetcode, streak, ai);
    expect(r.strengths.length).toBeGreaterThan(0); // Trees 90% >= 70
    expect(r.gaps.length).toBeGreaterThan(0); // Strings 8% < 40
  });

  test('recommends contests when none attended', () => {
    const noContest = computeReadiness(topics, { ...leetcode, contestHistory: [] }, streak, ai);
    expect(noContest.next_steps.some((s) => s.toLowerCase().includes('contest'))).toBe(true);
  });

  test('merges AI-detected weaknesses', () => {
    const aiAnalysis = { weaknesses: [{ topic: 'Graphs', score: 30 }], strengths: [] };
    const r = computeReadiness(topics, leetcode, streak, aiAnalysis);
    expect(r.gaps.some((g) => g.includes('Graphs'))).toBe(true);
  });
});
