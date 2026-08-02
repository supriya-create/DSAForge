const { AIAnalysis, Roadmap, Doubt, Assessment, RecommendedProblem, LeetcodeStats } = require('../models');
const prompts = require('../services/prompts');
const { parseAndValidate, analysisSchema, mockOASchema, problemsSchema } = require('../services/aiParser');
const config = require('../config/env');

// ---- Input limits (AI cost protection) ----
const MAX_CODE_LENGTH = 20000;
const MAX_PROGRESS_ITEMS = 50;
const MAX_WEEKS = 16;
const MAX_TOPIC_LENGTH = 200;

const callGemini = async (prompt) => {
  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please add it to your .env file.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Error querying Gemini API');
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No response text returned from Gemini API');
  }
  return text;
};

// 1. Analyze DSA Progress
const buildLocalLeetCodeAnalysis = (stats, progress) => {
  const weakTopics = [];
  const strongTopics = [];
  const roadmap = [];
  const revisionSchedule = [];
  const difficultyCounts = {
    easy: stats?.easySolved ?? 0,
    medium: stats?.mediumSolved ?? 0,
    hard: stats?.hardSolved ?? 0,
    total: stats ? (stats.easySolved + stats.mediumSolved + stats.hardSolved) : 0,
  };

  if (Array.isArray(progress) && progress.length) {
    const sorted = [...progress].map((t) => ({
      topic: t.topic,
      completion: t.total ? (t.solved / t.total) : 0,
      solved: t.solved,
      total: t.total,
    }));
    sorted.sort((a, b) => a.completion - b.completion);
    weakTopics.push(...sorted.slice(0, 3).map((t) => ({ topic: t.topic, score: Math.round(t.completion * 100), reason: `${t.solved}/${t.total} problems solved` })));
    strongTopics.push(...sorted.slice(-3).reverse().map((t) => ({ topic: t.topic, score: Math.round(t.completion * 100), reason: `${t.solved}/${t.total} problems solved` })));
  }

  if (!weakTopics.length && stats) {
    weakTopics.push({ topic: 'LeetCode practice', score: 0, reason: 'Needs actual topic-level data from progress or submission tags' });
  }
  if (!strongTopics.length && stats) {
    strongTopics.push({ topic: 'LeetCode submissions', score: 100, reason: 'High solved volume indicates strong engagement' });
  }

  const contestCount = Array.isArray(stats?.contestHistory) ? stats.contestHistory.length : 0;
  const latestContest = Array.isArray(stats?.contestHistory) ? stats.contestHistory[stats.contestHistory.length - 1] : null;
  const bestRank = Array.isArray(stats?.contestHistory) && stats.contestHistory.length
    ? Math.min(...stats.contestHistory.map((c) => c.rank || Infinity))
    : null;

  for (let week = 1; week <= 4; week += 1) {
    roadmap.push({
      week,
      focus: weakTopics[week - 1]?.topic || 'Core algorithmic concepts',
      actions: [
        `Solve 3-4 ${weakTopics[week - 1]?.topic || 'weak area'} problems with increasing difficulty`,
        'Review incorrect submissions and identify edge cases',
        'Practice a timed contest-style problem to build speed',
      ],
    });
    revisionSchedule.push({
      week,
      focus: week === 1 ? 'Weakest topics' : week === 2 ? 'Contest strategy' : week === 3 ? 'Difficulty review' : 'Rapid revision',
      actions: [
        `Review ${weakTopics[week - 1]?.topic || 'key concepts'} and repeat similar problems`,
        'Revisit previously solved problems to improve accuracy',
        'Summarize patterns and formulas in a quick notes sheet',
      ],
    });
  }

  return {
    weakestTopics: weakTopics,
    strongestTopics: strongTopics,
    difficultyAnalysis: {
      easy: difficultyCounts.easy,
      medium: difficultyCounts.medium,
      hard: difficultyCounts.hard,
      totalSolved: difficultyCounts.total,
      acceptanceRate: stats?.acceptanceRate ?? 0,
      ranking: stats?.ranking ?? null,
      contestRating: stats?.contestRating ?? null,
      summary: `You have solved ${difficultyCounts.total} problems with ${difficultyCounts.easy} easy, ${difficultyCounts.medium} medium, and ${difficultyCounts.hard} hard problems. Acceptance rate is ${stats?.acceptanceRate ?? 0}%.`,
    },
    contestPerformance: {
      totalContests: contestCount,
      bestRank: bestRank === Infinity ? null : bestRank,
      latestRating: latestContest ? latestContest.rating : stats?.contestRating ?? null,
      recentTrend: latestContest ? `Latest contest rank ${latestContest.rank} with rating ${latestContest.rating}` : 'No contest data available',
      notes: `Contest history shows ${contestCount} contests and a current rating of ${stats?.contestRating ?? 'N/A'}.`,
    },
    personalizedRoadmap: roadmap,
    revisionSchedule,
  };
};

exports.analyzeProgress = async (req, res) => {
  try {
    const progress = Array.isArray(req.body.progress) ? req.body.progress.slice(0, MAX_PROGRESS_ITEMS) : [];
    const leetcodeStats = await LeetcodeStats.findOne({ userId: req.userId });

    if (!leetcodeStats && !progress.length) {
      return res.status(400).json({
        success: false,
        message: 'Valid LeetCode stats or progress data is required',
      });
    }

    const summary = leetcodeStats ? `LeetCode username: ${leetcodeStats.username}
Total solved: ${leetcodeStats.totalSolved}
Easy: ${leetcodeStats.easySolved}
Medium: ${leetcodeStats.mediumSolved}
Hard: ${leetcodeStats.hardSolved}
Acceptance rate: ${leetcodeStats.acceptanceRate}%
Ranking: ${leetcodeStats.ranking ?? 'N/A'}
Contest rating: ${leetcodeStats.contestRating ?? 'N/A'}
Last synced: ${leetcodeStats.lastSynced ? leetcodeStats.lastSynced.toISOString() : 'N/A'}` : 'No LeetCode stats available.';

    const languageStats = Array.isArray(leetcodeStats?.languageStats) && leetcodeStats.languageStats.length
      ? leetcodeStats.languageStats.map((l) => `- ${l.language}: ${l.solved} solved, ${l.submissions} submissions`).join('\n')
      : 'No language stats available.';

    const contestHistory = Array.isArray(leetcodeStats?.contestHistory) && leetcodeStats.contestHistory.length
      ? leetcodeStats.contestHistory.map((c) => `- ${c.contestId || 'contest'}: rank ${c.rank}, rating ${c.rating}, date ${c.attendedAt?.toISOString?.() || 'N/A'}`).join('\n')
      : 'No contest history available.';

    const recentSubmissions = Array.isArray(leetcodeStats?.recentSubmissions) && leetcodeStats.recentSubmissions.length
      ? leetcodeStats.recentSubmissions.map((s) => `- ${s.problemTitle || 'problem'} (${s.difficulty || 'Unknown'}): ${s.status || 'Unknown'} in ${s.language || 'Unknown'} at ${s.timestamp?.toISOString?.() || 'N/A'}`).join('\n')
      : 'No recent submissions available.';

    const prompt = prompts.analyzeProgressPrompt({ summary, languageStats, contestHistory, recentSubmissions, progress });

    let analysis;
    try {
      const text = await callGemini(prompt);
      analysis = parseAndValidate(text, analysisSchema);
    } catch (geminiError) {
      console.warn('Gemini analysis failed, falling back to local structured summary:', geminiError.message);
      analysis = buildLocalLeetCodeAnalysis(leetcodeStats || null, progress);
    }

    await AIAnalysis.findOneAndUpdate(
      { user: req.userId },
      {
        user: req.userId,
        analysisDate: new Date(),
        weaknesses: analysis.weakestTopics || [],
        strengths: analysis.strongestTopics || [],
        suggestions: (analysis.personalizedRoadmap || []).flatMap((w) => w.actions || []),
        metrics: {
          difficultyAnalysis: analysis.difficultyAnalysis || {},
          contestPerformance: analysis.contestPerformance || {},
        },
        rawAnalysis: analysis,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during AI analysis',
    });
  }
};

// Get Latest AI Analysis
exports.getLatestAnalysis = async (req, res) => {
  try {
    const analysis = await AIAnalysis.findOne({ user: req.userId }).sort({ analysisDate: -1 });
    res.status(200).json({
      success: true,
      analysis: analysis ? analysis.rawAnalysis : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving latest AI analysis',
      error: error.message,
    });
  }
};

// 2. Doubt Solver
exports.solveDoubt = async (req, res) => {
  try {
    const { code, question } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Code snippet is required' });
    }
    // Cost protection: reject oversized code/question payloads.
    if (typeof code !== 'string' || code.length > MAX_CODE_LENGTH) {
      return res.status(400).json({ success: false, message: `Code snippet must be a string under ${MAX_CODE_LENGTH} characters` });
    }
    if (question && typeof question !== 'string') {
      return res.status(400).json({ success: false, message: 'Question must be a string' });
    }

    const prompt = prompts.solveDoubtPrompt({ code, question });
    const text = await callGemini(prompt);

    await Doubt.create({ user: req.userId, code, question, analysis: text });

    res.status(200).json({ success: true, analysis: text });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during doubt analysis',
    });
  }
};

// Get Doubt Solver History
exports.getDoubtHistory = async (req, res) => {
  try {
    const history = await Doubt.find({ user: req.userId }).sort({ createdAt: -1 }).limit(10);
    res.status(200).json({ success: true, history });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving doubt history',
      error: error.message,
    });
  }
};

// 3. Roadmap Generator
exports.generateRoadmap = async (req, res) => {
  try {
    const { progress, weeks } = req.body;
    const weekCount = parseInt(weeks, 10);
    if (!progress || !Array.isArray(progress) || progress.length === 0) {
      return res.status(400).json({ success: false, message: 'Valid progress data is required' });
    }
    if (Number.isNaN(weekCount) || weekCount < 1 || weekCount > MAX_WEEKS) {
      return res.status(400).json({ success: false, message: `Weeks must be between 1 and ${MAX_WEEKS}` });
    }
    const safeProgress = progress.slice(0, MAX_PROGRESS_ITEMS);

    const prompt = prompts.generateRoadmapPrompt({ progress: safeProgress, weeks: weekCount });
    const text = await callGemini(prompt);

    await Roadmap.findOneAndUpdate(
      { user: req.userId },
      { user: req.userId, title: `Personal ${weekCount}-Week Roadmap`, rawRoadmap: text, source: 'ai' },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, content: [{ text }] });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during roadmap generation',
    });
  }
};

// Get Latest AI Roadmap
exports.getLatestRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ user: req.userId }).sort({ updatedAt: -1 });
    res.status(200).json({
      success: true,
      content: roadmap ? [{ text: roadmap.rawRoadmap }] : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving latest roadmap',
      error: error.message,
    });
  }
};

// Deterministic local fallback so a malformed LLM response never crashes the endpoint.
const localMockOA = (company, difficulty) => [
  { title: 'Two Sum II', difficulty: 'Easy', topic: 'Arrays', time: 30, description: 'Given a sorted array and a target, find two numbers that add to the target.', constraints: 'Time O(n), Space O(1)', hint: 'Use two pointers.' },
  { title: 'Merge Intervals', difficulty: 'Medium', topic: 'Arrays', time: 30, description: 'Merge overlapping intervals and return non-overlapping intervals.', constraints: 'Time O(n log n), Space O(n)', hint: 'Sort the intervals first.' },
  { title: 'Median of Two Sorted Arrays', difficulty: 'Hard', topic: 'Binary Search', time: 45, description: 'Find the median of two sorted arrays with O(log(min(m,n))) complexity.', constraints: 'Time O(log(min(m,n))), Space O(1)', hint: 'Binary search the smaller array partition.' },
];

// 4. Mock OA Generator
exports.generateMockOA = async (req, res) => {
  try {
    const { company, difficulty, topics } = req.body;
    if (!company || !difficulty) {
      return res.status(400).json({ success: false, message: 'Company and difficulty are required' });
    }
    if (typeof company !== 'string' || company.length > MAX_TOPIC_LENGTH) {
      return res.status(400).json({ success: false, message: `Company must be a string under ${MAX_TOPIC_LENGTH} characters` });
    }

    const prompt = prompts.generateMockOAPrompt({ company, difficulty, topics });
    const text = await callGemini(prompt);

    let parsedProblems;
    try {
      parsedProblems = parseAndValidate(text, mockOASchema);
    } catch (err) {
      console.warn('Mock OA fell back to local problems:', err.message);
      parsedProblems = localMockOA(company, difficulty);
    }

    const assessment = new Assessment({
      title: `${company} Mock OA - ${difficulty}`,
      description: `Mock OA generated for ${company}. Focus topics: ${topics || 'Various'}`,
      durationMinutes: 90,
      createdBy: req.userId,
      isPublished: true,
      questions: parsedProblems.map((p, idx) => ({
        qid: `q_${idx}`,
        question: p.description,
        type: 'coding',
        maxScore: p.difficulty === 'Easy' ? 20 : p.difficulty === 'Medium' ? 50 : 100,
        title: p.title,
        difficulty: p.difficulty,
        topic: p.topic,
        timeLimit: p.time,
        constraints: p.constraints,
        hint: p.hint,
      })),
    });
    await assessment.save();

    res.status(200).json({
      success: true,
      assessmentId: assessment._id,
      company,
      difficulty,
      problems: parsedProblems.map((p) => ({
        title: p.title,
        difficulty: p.difficulty,
        topic: p.topic,
        time: p.time,
        description: p.description,
        constraints: p.constraints,
        hint: p.hint,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error generating Mock OA',
    });
  }
};

// Get Latest Mock OA
exports.getLatestMockOA = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ createdBy: req.userId }).sort({ createdAt: -1 });
    if (!assessment) {
      return res.status(200).json({ success: true, assessment: null });
    }

    const problems = assessment.questions.map((q) => ({
      title: q.title || 'Coding Problem',
      difficulty: q.difficulty || 'Medium',
      topic: q.topic || 'General',
      time: q.timeLimit || 30,
      description: q.question,
      constraints: q.constraints || '',
      hint: q.hint || '',
    }));

    const titleParts = assessment.title.split(' ');
    const company = titleParts[0] || 'Unknown';
    const difficulty = titleParts[titleParts.length - 1] || 'Medium';

    res.status(200).json({
      success: true,
      assessmentId: assessment._id,
      company,
      difficulty,
      problems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving latest Mock OA',
      error: error.message,
    });
  }
};

// Deterministic local fallback for problem recommendations.
const localRecommendations = (weakTopics) => [
  { title: 'Two Sum', difficulty: 'Easy', topic: 'Arrays', url: 'https://leetcode.com/problems/two-sum', why: `Warm-up on arrays, targeting ${weakTopics}` },
  { title: 'Valid Parentheses', difficulty: 'Easy', topic: 'Strings', url: 'https://leetcode.com/problems/valid-parentheses', why: 'Strengthen string and stack fundamentals' },
  { title: 'Binary Tree Level Order Traversal', difficulty: 'Easy', topic: 'Trees', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal', why: 'Important tree traversal pattern' },
  { title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', topic: 'Strings', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters', why: 'Sliding window technique essential for interviews' },
  { title: 'Number of Islands', difficulty: 'Medium', topic: 'Graphs', url: 'https://leetcode.com/problems/number-of-islands', why: 'Graph traversal and DFS/BFS practice' },
  { title: 'Trapping Rain Water', difficulty: 'Hard', topic: 'Dynamic Programming', url: 'https://leetcode.com/problems/trapping-rain-water', why: 'Advanced problem to test optimization skills' },
];

// 5. Problem Recommendations
exports.recommendProblems = async (req, res) => {
  try {
    const { platform, weakTopics } = req.body;
    const targetPlatform = platform || 'LeetCode';
    if (typeof weakTopics === 'string' && weakTopics.length > MAX_TOPIC_LENGTH) {
      return res.status(400).json({ success: false, message: 'Weak topics list is too long' });
    }

    const prompt = prompts.recommendProblemsPrompt({ platform: targetPlatform, weakTopics });
    const text = await callGemini(prompt);

    let parsedProblems;
    try {
      parsedProblems = parseAndValidate(text, problemsSchema);
    } catch (err) {
      console.warn('Problem recommendations fell back to local list:', err.message);
      parsedProblems = localRecommendations(weakTopics || 'weak areas');
    }

    await RecommendedProblem.findOneAndUpdate(
      { user: req.userId },
      {
        user: req.userId,
        problems: parsedProblems.map((p) => ({
          platform: targetPlatform,
          title: p.title,
          difficulty: p.difficulty,
          tags: [p.topic],
          reason: p.why,
          url: p.url,
        })),
        recommendedAt: new Date(),
        source: 'ai',
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      problems: parsedProblems.map((p) => ({ title: p.title, level: p.difficulty, topic: p.topic, url: p.url, why: p.why })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error recommending problems',
    });
  }
};

// Get Latest Recommendations
exports.getLatestRecommendations = async (req, res) => {
  try {
    const recommendations = await RecommendedProblem.findOne({ user: req.userId }).sort({ recommendedAt: -1 });
    if (!recommendations) {
      return res.status(200).json({ success: true, problems: [] });
    }

    const problems = recommendations.problems.map((p) => ({
      title: p.title,
      level: p.difficulty,
      topic: p.tags?.[0] || 'General',
      url: p.url,
      why: p.reason,
    }));

    res.status(200).json({ success: true, problems });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving latest recommendations',
      error: error.message,
    });
  }
};
