const { AIAnalysis, Roadmap, Doubt, Assessment, RecommendedProblem } = require('../models');

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
exports.analyzeProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    if (!progress || !Array.isArray(progress)) {
      return res.status(400).json({
        success: false,
        message: 'Valid progress data is required'
      });
    }

    const prompt = `You are a DSA (Data Structures & Algorithms) coach analyzing a student's problem-solving progress for placement preparation.

Here is the student's current DSA progress data:
${progress.map(t => `- ${t.topic}: ${t.solved} solved (Easy: ${t.easy || 0}, Medium: ${t.medium || 0}, Hard: ${t.hard || 0}) out of ${t.total || 50} problems`).join('\n')}

Please analyze this data and provide:

1. **STRENGTH ANALYSIS**: List topics where the student is performing well (>60% completion) with brief reasons.

2. **WEAKNESS ANALYSIS**: List topics that need immediate attention (<40% completion) with specific gaps.

3. **PRIORITY ACTION ITEMS**: Give 3-5 specific, actionable steps the student should take this week.

4. **INTERVIEW READINESS**: Rate their overall readiness for placement interviews (1-10) with a brief justification.

5. **QUICK WINS**: Suggest 2-3 topics they can quickly improve to boost their confidence.

Format your response clearly with these exact sections. Be specific and encouraging. Keep it concise but insightful.`;

    const text = await callGemini(prompt);

    // Persist to database
    await AIAnalysis.findOneAndUpdate(
      { user: req.userId },
      {
        user: req.userId,
        analysisDate: new Date(),
        rawAnalysis: text
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      analysis: text
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
