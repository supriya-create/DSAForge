/**
 * Single source of truth for all AI prompts.
 * Architectural change: prompts previously existed as dead constants in the
 * frontend pages AND inline in the backend. They now live only here, on the
 * server, so the SPA has no prompt logic.
 */

const formatProgress = (progress = []) =>
  progress
    .map(
      (t) =>
        `- ${t.topic}: ${t.solved}/${t.total} solved (${Math.round(((t.solved || 0) / (t.total || 1)) * 100)}%)`
    )
    .join('\n');

const analyzeProgressPrompt = ({ summary, languageStats, contestHistory, recentSubmissions, progress }) =>
  `You are a DSA coach analyzing a student's synchronized LeetCode profile and performance. Use the real LeetCode statistics below, and if available, combine them with the student's topic progress data to infer the strongest and weakest areas.

Real synchronized LeetCode stats:
${summary}

Language stats:
${languageStats}

Contest history:
${contestHistory}

Recent submissions:
${recentSubmissions}

DSA topic progress (if available):
${progress.length ? formatProgress(progress) : 'No topic progress provided.'}

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

const solveDoubtPrompt = ({ code, question }) =>
  `You are a DSA expert and coding mentor. Analyze this code and ${question ? `answer: "${question}"` : 'provide a complete analysis'}.

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

const generateRoadmapPrompt = ({ progress, weeks }) =>
  `You are a DSA placement preparation coach. Create a ${weeks}-week personalized study roadmap for this student.

Student's current DSA progress:
${formatProgress(progress)}

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

const generateMockOAPrompt = ({ company, difficulty, topics }) =>
  `You are a technical interviewer at a top company. Generate a mock Online Assessment (OA) for ${company} with these specifications:
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

const recommendProblemsPrompt = ({ platform, weakTopics }) =>
  `You are a DSA coach recommending problems for a student preparing for placements.
Weak topics for this student: ${weakTopics || 'various topics'}.

Recommend exactly 6 problems from ${platform}: 3 Easy, 2 Medium, 1 Hard.
Focus on their weak topics.

You MUST return the output in a strict JSON format (no markdown blocks, no extra text, no HTML). The response must be a valid JSON array of 6 problem objects, matching this structure:
[
  {
    "title": "Problem Title",
    "difficulty": "Easy/Medium/Hard",
    "topic": "Topic Name",
    "url": "full URL of the problem on ${platform}",
    "why": "One sentence explanation of why this problem is recommended"
  }
]`;

module.exports = {
  analyzeProgressPrompt,
  solveDoubtPrompt,
  generateRoadmapPrompt,
  generateMockOAPrompt,
  recommendProblemsPrompt,
};
