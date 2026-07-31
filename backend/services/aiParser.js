const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true, strict: false });

/** Strips markdown code fences so Gemini's JSON can be parsed reliably. */
const stripMarkdown = (text) => String(text || '').replace(/```json|```/g, '').trim();

/**
 * Safely parses and schema-validates a structured JSON response from the LLM.
 * Architectural change: previously we did `JSON.parse(text.replace(...))` with
 * no validation, so a malformed or partial object would crash endpoints or
 * persist undefined fields. Now the payload must satisfy a JSON Schema; on
 * failure the caller supplies a fallback, so no request ever crashes.
 *
 * @param {string} text raw LLM output
 * @param {object} schema AJV JSON Schema the output must satisfy
 * @returns {object|Array} validated, parsed data
 * @throws {Error} if the output is not parseable/valid JSON
 */
const parseAndValidate = (text, schema) => {
  const cleaned = stripMarkdown(text);
  let data;
  try {
    data = JSON.parse(cleaned);
  } catch (err) {
    throw new Error('AI returned invalid JSON. Please try again.');
  }

  const validate = ajv.compile(schema);
  if (!validate(data)) {
    const detail = validate.errors.map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ');
    throw new Error(`AI response failed validation: ${detail}`);
  }
  return data;
};

// ---- Schemas ----

const analysisSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    weakestTopics: { type: 'array', items: { type: 'object', required: ['topic'], properties: { topic: { type: 'string' }, score: { type: 'number' }, reason: { type: 'string' } } } },
    strongestTopics: { type: 'array', items: { type: 'object', required: ['topic'], properties: { topic: { type: 'string' }, score: { type: 'number' }, reason: { type: 'string' } } } },
    difficultyAnalysis: { type: 'object' },
    contestPerformance: { type: 'object' },
    personalizedRoadmap: { type: 'array' },
    revisionSchedule: { type: 'array' },
  },
  required: ['weakestTopics', 'strongestTopics', 'difficultyAnalysis', 'contestPerformance'],
};

const mockOASchema = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    required: ['title', 'difficulty', 'topic', 'description'],
    properties: {
      title: { type: 'string' },
      difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] },
      topic: { type: 'string' },
      time: { type: 'number' },
      description: { type: 'string' },
      constraints: { type: 'string' },
      hint: { type: 'string' },
    },
  },
};

const problemsSchema = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    required: ['title', 'difficulty', 'topic'],
    properties: {
      title: { type: 'string' },
      difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] },
      topic: { type: 'string' },
      url: { type: 'string' },
      why: { type: 'string' },
    },
  },
};

module.exports = { parseAndValidate, analysisSchema, mockOASchema, problemsSchema };
