const { AIAnalysis, Roadmap, Doubt, Assessment, RecommendedProblem, LeetcodeStats } = require('../models');

const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please add it to your .env file.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
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
    const sorted = [...progress].map(t => ({
      topic: t.topic,
      completion: t.total ? (t.solved / t.total) : 0,
      solved: t.solved,
      total: t.total
    }));
    sorted.sort((a, b) => a.completion - b.completion);
    weakTopics.push(...sorted.slice(0, 3).map(t => ({ topic: t.topic, score: Math.round(t.completion * 100), reason: `${t.solved}/${t.total} problems solved` })));
    strongTopics.push(...sorted.slice(-3).reverse().map(t => ({ topic: t.topic, score: Math.round(t.completion * 100), reason: `${t.solved}/${t.total} problems solved` })));
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
    ? Math.min(...stats.contestHistory.map(c => c.rank || Infinity))
    : null;

  for (let week = 1; week <= 4; week += 1) {
    roadmap.push({
      week,
      focus: weakTopics[week - 1]?.topic || 'Core algorithmic concepts',
      actions: [
        `Solve 3-4 ${weakTopics[week - 1]?.topic || 'weak area'} problems with increasing difficulty`,
        'Review incorrect submissions and identify edge cases',
        'Practice a timed contest-style problem to build speed'
      ]
    });
    revisionSchedule.push({
      week,
      focus: week === 1 ? 'Weakest topics' : week === 2 ? 'Contest strategy' : week === 3 ? 'Difficulty review' : 'Rapid revision',
      actions: [
        `Review ${weakTopics[week - 1]?.topic || 'key concepts'} and repeat similar problems`,
        'Revisit previously solved problems to improve accuracy',
        'Summarize patterns and formulas in a quick notes sheet'
      ]
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
      summary: `You have solved ${difficultyCounts.total} problems with ${difficultyCounts.easy} easy, ${difficultyCounts.medium} medium, and ${difficultyCounts.hard} hard problems. Acceptance rate is ${stats?.acceptanceRate ?? 0}%.`
    },
    contestPerformance: {
      totalContests: contestCount,
      bestRank: bestRank === Infinity ? null : bestRank,
      latestRating: latestContest ? latestContest.rating : stats?.contestRating ?? null,
      recentTrend: latestContest ? `Latest contest rank ${latestContest.rank} with rating ${latestContest.rating}` : 'No contest data available',
      notes: `Contest history shows ${contestCount} contests and a current rating of ${stats?.contestRating ?? 'N/A'}.`
    },
    personalizedRoadmap: roadmap,
    revisionSchedule,
  };
};

exports.analyzeProgress = async (req, res) => {
  try {
    const progress = Array.isArray(req.body.progress) ? req.body.progress : [];
    const leetcodeStats = await LeetcodeStats.findOne({ userId: req.userId });

    if (!leetcodeStats && !progress.length) {
      return res.status(400).json({
        success: false,
        message: 'Valid LeetCode stats or progress data is required'
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
      ? leetcodeStats.languageStats.map(l => `- ${l.language}: ${l.solved} solved, ${l.submissions} submissions`).join('\n')
      : 'No language stats available.';

    const contestHistory = Array.isArray(leetcodeStats?.contestHistory) && leetcodeStats.contestHistory.length
      ? leetcodeStats.contestHistory.map(c => `- ${c.contestId || 'contest'}: rank ${c.rank}, rating ${c.rating}, date ${c.attendedAt?.toISOString?.() || 'N/A'}`).join('\n')
      : 'No contest history available.';

    const recentSubmissions = Array.isArray(leetcodeStats?.recentSubmissions) && leetcodeStats.recentSubmissions.length
      ? leetcodeStats.recentSubmissions.map(s => `- ${s.problemTitle || 'problem'} (${s.difficulty || 'Unknown'}): ${s.status || 'Unknown'} in ${s.language || 'Unknown'} at ${s.timestamp?.toISOString?.() || 'N/A'}`).join('\n')
      : 'No recent submissions available.';

    const prompt = `You are a DSA coach analyzing a student's synchronized LeetCode profile and performance. Use the real LeetCode statistics below, and if available, combine them with the student's topic progress data to infer the strongest and weakest areas.

Real synchronized LeetCode stats:
${summary}

Language stats:
${languageStats}

Contest history:
${contestHistory}

Recent submissions:
${recentSubmissions}

DSA topic progress (if available):
${progress.length ? progress.map(t => `- ${t.topic}: ${t.solved}/${t.total} solved (${Math.round(((t.solved || 0)/(t.total || 1))*100)}%)`).join('\n') : 'No topic progress provided.'}

Return a strict JSON object with the following structure only:
{
  "weakestTopics": [{"topic":"","score":0,"reason":""}],
  "strongestTopics": [{"topic":"","score":0,"reason":""}],
  "difficultyAnalysis": {"easy":0,"medium":0,"hard":0,"totalSolved":0,"acceptanceRate":0,"ranking":null,"contestRating":null,"summary":""},
  "contestPerformance": {"totalContests":0,"bestRank":null,"latestRating":null,"recentTrend":"","notes":""},
  "personalizedRoadmap": [{"week":1,"focus":"","actions":[""]}],
  "revisionSchedule": [{"week":1,"focus":"","actions":[""]}]
}

Do not include any markdown, backticks, or extra explanation. Respond only with valid JSON.`;

    let analysis;
    try {
      const text = await callGemini(prompt);
      const cleaned = text.replace(/```json|```/g, '').trim();
      analysis = JSON.parse(cleaned);
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
        suggestions: (analysis.personalizedRoadmap || []).flatMap(w => w.actions || []),
        metrics: {
          difficultyAnalysis: analysis.difficultyAnalysis || {},
          contestPerformance: analysis.contestPerformance || {}
        },
        rawAnalysis: analysis
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during AI analysis'
    });
  }
};

// Get Latest AI Analysis
exports.getLatestAnalysis = async (req, res) => {
  try {
    const analysis = await AIAnalysis.findOne({ user: req.userId }).sort({ analysisDate: -1 });
    res.status(200).json({
      success: true,
      analysis: analysis ? analysis.rawAnalysis : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving latest AI analysis',
      error: error.message
    });
  }
};

// 2. Doubt Solver
exports.solveDoubt = async (req, res) => {
  try {
    const { code, question } = req.body;
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Code snippet is required'
      });
    }

    const prompt = `You are a DSA expert and coding mentor. Analyze this code and ${question ? `answer: "${question}"` : 'provide a complete analysis'}.

Code:
\`\`\`
${code}
\`\`\`

Provide a clear analysis covering:

**TIME COMPLEXITY**: State the Big O time complexity with explanation.

**SPACE COMPLEXITY**: State the Big O space complexity with explanation.

**CODE LOGIC**: Explain what the code does step by step (be concise).

**BUGS & MISTAKES**: List any bugs, edge cases not handled, or potential issues. If none, say "No major issues found."

**OPTIMIZATION**: Suggest 1-2 specific optimizations if possible with the improved approach name.

**VERDICT**: One sentence summary of code quality.

Keep each section concise and practical. Use specific Big O notation.`;

    const text = await callGemini(prompt);

    // Save doubt history
    await Doubt.create({
      user: req.userId,
      code,
      question,
      analysis: text
    });

    res.status(200).json({
      success: true,
      analysis: text
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during doubt analysis'
    });
  }
};

// Get Doubt Solver History
exports.getDoubtHistory = async (req, res) => {
  try {
    const history = await Doubt.find({ user: req.userId }).sort({ createdAt: -1 }).limit(10);
    res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving doubt history',
      error: error.message
    });
  }
};

// 3. Roadmap Generator
exports.generateRoadmap = async (req, res) => {
  try {
    const { progress, weeks } = req.body;
    if (!progress || !Array.isArray(progress) || !weeks) {
      return res.status(400).json({
        success: false,
        message: 'Valid progress data and weeks count are required'
      });
    }

    const prompt = `You are a DSA placement preparation coach. Create a ${weeks}-week personalized study roadmap for this student.

Student's current DSA progress:
${progress.map(t => `- ${t.topic}: ${t.solved} solved (${Math.round(((t.solved || 0) / (t.total || 100)) * 100)}% complete)`).join('\n')}

Create a detailed week-by-week roadmap that:
1. Prioritizes weak areas (low completion %)
2. Builds on existing strengths
3. Follows a logical learning progression
4. Includes specific topics/subtopics for each week

Format EXACTLY like this for each week (include hyphen and title, do not skip WEEK prefix):
WEEK [N]: [Theme Title]
- [Subtopic 1]
- [Subtopic 2]
- [Subtopic 3]
GOAL: [Weekly goal in one sentence]

Generate all ${weeks} weeks in this format. Be specific with subtopics.`;

    const text = await callGemini(prompt);

    // Save roadmap
    await Roadmap.findOneAndUpdate(
      { user: req.userId },
      {
        user: req.userId,
        title: `Personal ${weeks}-Week Roadmap`,
        rawRoadmap: text,
        source: 'ai'
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      content: [{ text }]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during roadmap generation'
    });
  }
};

// Get Latest AI Roadmap
exports.getLatestRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ user: req.userId }).sort({ updatedAt: -1 });
    res.status(200).json({
      success: true,
      content: roadmap ? [{ text: roadmap.rawRoadmap }] : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving latest roadmap',
      error: error.message
    });
  }
};

// 4. Mock OA Generator
exports.generateMockOA = async (req, res) => {
  try {
    const { company, difficulty, topics } = req.body;
    if (!company || !difficulty) {
      return res.status(400).json({
        success: false,
        message: 'Company and difficulty are required'
      });
    }

    const prompt = `You are a technical interviewer at a top company. Generate a mock Online Assessment (OA) for ${company} with these specifications:
- Difficulty: ${difficulty}
- Focus topics: ${topics || 'Arrays, Strings, Dynamic Programming'}
- Time limit: 90 minutes
- 3 problems total

You MUST return the output in a strict JSON format (no markdown blocks, no extra text, no HTML). The response must be a valid JSON array of 3 problem objects, matching this structure:
[
  {
    "title": "Problem Title",
    "difficulty": "Easy/Medium/Hard",
    "topic": "Topic Name",
    "time": 30,
    "description": "Problem description with examples",
    "constraints": "Constraints here",
    "hint": "Hint here"
  }
]`;

    const text = await callGemini(prompt);
    const cleanedText = text.replace(/```json|```/g, '').trim();
    let parsedProblems;
    try {
      parsedProblems = JSON.parse(cleanedText);
    } catch (err) {
      console.error('Failed to parse Gemini response as JSON. Response was:', text);
      throw new Error('AI generated invalid formatting. Please try again.');
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
        hint: p.hint
      }))
    });
    await assessment.save();

    res.status(200).json({
      success: true,
      assessmentId: assessment._id,
      company,
      difficulty,
      problems: parsedProblems.map(p => ({
        title: p.title,
        difficulty: p.difficulty,
        topic: p.topic,
        time: p.time,
        description: p.description,
        constraints: p.constraints,
        hint: p.hint
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error generating Mock OA'
    });
  }
};

// Get Latest Mock OA
exports.getLatestMockOA = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ createdBy: req.userId }).sort({ createdAt: -1 });
    if (!assessment) {
      return res.status(200).json({
        success: true,
        assessment: null
      });
    }

    const problems = assessment.questions.map(q => ({
      title: q.title || 'Coding Problem',
      difficulty: q.difficulty || 'Medium',
      topic: q.topic || 'General',
      time: q.timeLimit || 30,
      description: q.question,
      constraints: q.constraints || '',
      hint: q.hint || ''
    }));

    const titleParts = assessment.title.split(' ');
    const company = titleParts[0] || 'Unknown';
    const difficulty = titleParts[titleParts.length - 1] || 'Medium';

    res.status(200).json({
      success: true,
      assessmentId: assessment._id,
      company,
      difficulty,
      problems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving latest Mock OA',
      error: error.message
    });
  }
};

// 5. Problem Recommendations
exports.recommendProblems = async (req, res) => {
  try {
    const { platform, weakTopics } = req.body;
    const targetPlatform = platform || 'LeetCode';

    const prompt = `You are a DSA coach recommending problems for a student preparing for placements.
Weak topics for this student: ${weakTopics || 'various topics'}.

Recommend exactly 6 problems from ${targetPlatform}: 3 Easy, 2 Medium, 1 Hard.
Focus on their weak topics.

You MUST return the output in a strict JSON format (no markdown blocks, no extra text, no HTML). The response must be a valid JSON array of 6 problem objects, matching this structure:
[
  {
    "title": "Problem Title",
    "difficulty": "Easy/Medium/Hard",
    "topic": "Topic Name",
    "url": "full URL of the problem on ${targetPlatform}",
    "why": "One sentence explanation of why this problem is recommended"
  }
]`;

    const text = await callGemini(prompt);
    const cleanedText = text.replace(/```json|```/g, '').trim();
    let parsedProblems;
    try {
      parsedProblems = JSON.parse(cleanedText);
    } catch (err) {
      console.error('Failed to parse Gemini response as JSON. Response was:', text);
      throw new Error('AI generated invalid formatting. Please try again.');
    }

    // Save to database
    await RecommendedProblem.findOneAndUpdate(
      { user: req.userId },
      {
        user: req.userId,
        problems: parsedProblems.map(p => ({
          platform: targetPlatform,
          title: p.title,
          difficulty: p.difficulty,
          tags: [p.topic],
          reason: p.why,
          url: p.url
        })),
        recommendedAt: new Date(),
        source: 'ai'
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      problems: parsedProblems.map(p => ({
        title: p.title,
        level: p.difficulty,
        topic: p.topic,
        url: p.url,
        why: p.why
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error recommending problems'
    });
  }
};

// Get Latest Recommendations
exports.getLatestRecommendations = async (req, res) => {
  try {
    const recommendations = await RecommendedProblem.findOne({ user: req.userId }).sort({ recommendedAt: -1 });
    if (!recommendations) {
      return res.status(200).json({
        success: true,
        problems: []
      });
    }

    const problems = recommendations.problems.map(p => ({
      title: p.title,
      level: p.difficulty,
      topic: p.tags?.[0] || 'General',
      url: p.url,
      why: p.reason
    }));

    res.status(200).json({
      success: true,
      problems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving latest recommendations',
      error: error.message
    });
  }
};
