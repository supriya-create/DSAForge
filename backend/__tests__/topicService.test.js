const { aggregateTopicCounts } = require('../services/topicService');

const submissions = [{ problemId: 'decode-string' }, { problemId: 'valid-sudoku' }];

const slugToMeta = new Map([
  ['decode-string', { difficulty: 'Medium', topics: ['String', 'Stack', 'Recursion'] }],
  ['valid-sudoku', { difficulty: 'Medium', topics: ['Array', 'Hash Table', 'Matrix'] }],
]);

describe('aggregateTopicCounts', () => {
  test('maps tags to canonical topics and counts solves', () => {
    const agg = aggregateTopicCounts(submissions, slugToMeta);
    // String -> Strings, Array -> Arrays (aliases)
    expect(agg.get('Strings').solved).toBe(1);
    expect(agg.get('Arrays').solved).toBe(1);
    // Unknown tags used as-is
    expect(agg.get('Matrix').solved).toBe(1);
  });

  test('tracks difficulty per topic', () => {
    const agg = aggregateTopicCounts(submissions, slugToMeta);
    expect(agg.get('Strings').medium).toBe(1);
    expect(agg.get('Strings').easy).toBe(0);
  });

  test('skips submissions with no metadata', () => {
    const withUnknown = [{ problemId: 'ghost' }, ...submissions];
    const agg = aggregateTopicCounts(withUnknown, slugToMeta);
    expect(agg.has('ghost')).toBe(false);
    expect(agg.get('Strings').solved).toBe(1);
  });

  test('handles empty input', () => {
    expect(aggregateTopicCounts([], new Map()).size).toBe(0);
  });
});
