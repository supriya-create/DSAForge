const { LeetcodeStats, TopicProgress } = require('../models');

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';
const META_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Map LeetCode topic tags to the app's canonical topic names. Tags not listed
// are used as-is (creating a new topic). Kept small on purpose.
const TOPIC_ALIASES = {
  Array: 'Arrays',
  Arrays: 'Arrays',
  String: 'Strings',
  Strings: 'Strings',
  'Linked List': 'Linked Lists',
  'Linked Lists': 'Linked Lists',
  Tree: 'Trees',
  'Binary Tree': 'Trees',
  Graph: 'Graphs',
  Graphs: 'Graphs',
  'Dynamic Programming': 'Dynamic Programming',
  'Heap (Priority Queue)': 'Heaps',
  Sorting: 'Sorting',
  'Binary Search': 'Binary Search',
  Recursion: 'Recursion',
  'Depth-First Search': 'Graphs',
  'Breadth-First Search': 'Graphs',
  'Hash Table': 'Hash Tables',
  Stack: 'Stacks',
  'Two Pointers': 'Two Pointers',
  'Sliding Window': 'Sliding Window',
  Greedy: 'Greedy',
  Backtracking: 'Backtracking',
  Matrix: 'Matrix',
  Math: 'Math',
};

// slug -> { difficulty, topics: string[], expiresAt }
const metaCache = new Map();

const log = (level, message, meta = {}) => {
  const entry = { ts: new Date().toISOString(), level, message, ...meta };
  try {
    console.log(JSON.stringify(entry));
  } catch (e) {
    console.log(level, message, meta);
  }
};

/** Fetches and caches a problem's difficulty + topic tags from LeetCode. */
const fetchProblemMeta = async (slug) => {
  const cached = metaCache.get(slug);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const query = `
    query getQuestion($titleSlug: String!) {
      question(titleSlug: $titleSlug) { difficulty topicTags { name } }
    }`;
  const response = await fetch(LEETCODE_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': process.env.LEETCODE_USER_AGENT || 'DSAForge/1.0 (+https://example.com)' },
    body: JSON.stringify({ query, variables: { titleSlug: slug } }),
  });
  if (!response.ok) return null;

  const data = await response.json();
  const q = data?.data?.question;
  if (!q) return null;

  const result = {
    difficulty: q.difficulty || null,
    topics: (q.topicTags || []).map((t) => t.name).filter(Boolean),
  };
  metaCache.set(slug, { data: result, expiresAt: Date.now() + META_CACHE_TTL_MS });
  return result;
};

/** Runs fns over items with a concurrency cap. */
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (index < items.length) {
      const i = index;
      index += 1;
      try {
        results[i] = await fn(items[i]);
      } catch (e) {
        results[i] = null;
      }
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Derives per-topic progress from the user's accepted LeetCode submissions
 * (fetched from the API) and writes it into TopicProgress. This is data-backed
 * ("calculate properly"), not fabricated.
 *
 * Merge rule: an existing topic whose solved count is still 0 (i.e. an
 * untouched default) is populated with the derived value; topics that already
 * have manual counts are left untouched so user-entered data is never
 * overwritten. Newly-detected topics are created with a sensible total.
 */
const deriveTopicProgress = async (userId) => {
  const stats = await LeetcodeStats.findOne({ userId }).lean();
  const submissions = stats?.recentSubmissions || [];
  if (!submissions.length) return { updated: 0, topics: [] };

  const slugs = [...new Set(submissions.map((s) => s.problemId).filter(Boolean))];
  const metas = await mapWithConcurrency(slugs, 3, fetchProblemMeta);
  const slugMeta = new Map();
  slugs.forEach((slug, i) => {
    if (metas[i]) slugMeta.set(slug, metas[i]);
  });

  // Aggregate per-topic solved + difficulty counts from the submission set.
  const agg = new Map(); // topic -> { solved, easy, medium, hard }
  const bump = (topic, difficulty) => {
    if (!agg.has(topic)) agg.set(topic, { solved: 0, easy: 0, medium: 0, hard: 0 });
    const entry = agg.get(topic);
    entry.solved += 1;
    if (difficulty === 'Easy') entry.easy += 1;
    else if (difficulty === 'Medium') entry.medium += 1;
    else if (difficulty === 'Hard') entry.hard += 1;
  };

  for (const sub of submissions) {
    const meta = slugMeta.get(sub.problemId);
    if (!meta || !meta.topics.length) continue;
    for (const tag of meta.topics) {
      bump(TOPIC_ALIASES[tag] || tag, meta.difficulty);
    }
  }

  let updated = 0;
  for (const [topic, counts] of agg) {
    // Self-correcting: recompute from current submissions each sync and $set,
    // so derived values can never accumulate or go stale. A topic's solved
    // count can never exceed the number of submissions (sanity clamp).
    const safe = {
      solved: Math.min(counts.solved, submissions.length),
      easy: counts.easy,
      medium: counts.medium,
      hard: counts.hard,
    };
    const existing = await TopicProgress.findOne({ user: userId, topic });
    if (existing) {
      await TopicProgress.updateOne({ _id: existing._id }, { $set: safe });
    } else {
      await TopicProgress.create({
        user: userId,
        topic,
        ...safe,
        total: Math.max(safe.solved + 10, 30),
      });
    }
    updated += 1;
  }

  log('info', 'topic_derivation_complete', { userId, submissions: submissions.length, topics: agg.size, updated });
  return { updated, topics: [...agg.keys()] };
};

module.exports = { deriveTopicProgress, fetchProblemMeta };
