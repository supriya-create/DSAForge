const { parseAndValidate, analysisSchema, mockOASchema } = require('../services/aiParser');

const validAnalysis =
  '```json\n' +
  JSON.stringify({
    weakestTopics: [{ topic: 'Graphs', score: 30, reason: 'low completion' }],
    strongestTopics: [{ topic: 'Arrays', score: 90, reason: 'high volume' }],
    difficultyAnalysis: { easy: 5, medium: 3, hard: 1 },
    contestPerformance: { totalContests: 0 },
  }) +
  '\n```';

describe('parseAndValidate', () => {
  test('parses valid JSON after markdown fences', () => {
    const out = parseAndValidate(validAnalysis, analysisSchema);
    expect(out.weakestTopics[0].topic).toBe('Graphs');
    expect(out.strongestTopics[0].topic).toBe('Arrays');
  });

  test('throws on non-JSON input', () => {
    expect(() => parseAndValidate('this is not json', analysisSchema)).toThrow();
  });

  test('throws when required fields are missing', () => {
    expect(() => parseAndValidate(JSON.stringify({ weakestTopics: [] }), analysisSchema)).toThrow();
  });

  test('validates mock-OA problem shape', () => {
    const problems = [{ title: 'Two Sum', difficulty: 'Easy', topic: 'Arrays', description: '...' }];
    expect(() => parseAndValidate(JSON.stringify(problems), mockOASchema)).not.toThrow();
  });

  test('rejects mock-OA with invalid difficulty', () => {
    const problems = [{ title: 'Two Sum', difficulty: 'Impossible', topic: 'Arrays', description: '...' }];
    expect(() => parseAndValidate(JSON.stringify(problems), mockOASchema)).toThrow();
  });
});
