const { TopicProgress, LeetcodeStats, AIAnalysis } = require('../models');
const { getStreakData } = require('../services/streakService');

/**
 * Real, deterministic interview-readiness assessment computed from the user's
 * stored data (topic progress, LeetCode stats, streak). No fabricated numbers:
 * everything derives from the database.
 *
 * Response shape intentionally matches what the frontend ReadinessScore page
 * already renders: { overall, verdict, message, topics, strengths, gaps,
 * estimate, next_steps }.
 */
exports.calculateReadiness = async (req, res) => {
  try {
    const userId = req.userId;

    const [topics, leetcodeStats, { currentStreak, bestStreak }, aiAnalysis] = await Promise.all([
      TopicProgress.find({ user: userId }).lean(),
      LeetcodeStats.findOne({ userId }).lean(),
      getStreakData(userId),
      AIAnalysis.findOne({ user: userId }).sort({ analysisDate: -1 }).lean(),
    ]);

    if (!topics || topics.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No topic progress found. Add topics to calculate your readiness score.',
      });
    }

    // --- Topic scores (completion %) ---
    const topicsObj = {};
    const totalWeight = topics.reduce((sum, t) => sum + (t.total || 0), 0);
    const weightedSolved = topics.reduce((sum, t) => sum + (t.solved || 0), 0);
    topics.forEach((t) => {
      topicsObj[t.topic] = t.total > 0 ? Math.round(((t.solved || 0) / t.total) * 100) : 0;
    });

    const overall = totalWeight > 0 ? Math.round((weightedSolved / totalWeight) * 100) : 0;

    // --- Strengths / weaknesses from completion ---
    const strengths = Object.entries(topicsObj)
      .filter(([, s]) => s >= 70)
      .sort((a, b) => b[1] - a[1])
      .map(([topic, score]) => `Strong on ${topic} (${score}% complete)`);

    const weaknesses = Object.entries(topicsObj)
      .filter(([, s]) => s < 40)
      .sort((a, b) => a[1] - b[1])
      .map(([topic, score]) => `Need work on ${topic} (${score}% complete)`);

    // Merge AI-detected weaknesses/strengths as additional signals.
    if (aiAnalysis?.weaknesses?.length) {
      aiAnalysis.weaknesses.slice(0, 2).forEach((w) => {
        if (w && w.topic && !weaknesses.some((x) => x.includes(w.topic))) {
          weaknesses.push(`AI flags ${w.topic} as a weak area${w.score ? ` (${w.score}%)` : ''}`);
        }
      });
    }
    if (aiAnalysis?.strengths?.length) {
      aiAnalysis.strengths.slice(0, 2).forEach((s) => {
        if (s && s.topic && !strengths.some((x) => x.includes(s.topic))) {
          strengths.push(`AI notes strength in ${s.topic}${s.score ? ` (${s.score}%)` : ''}`);
        }
      });
    }

    // --- Signals: contest activity, streak, difficulty balance ---
    const contestCount = Array.isArray(leetcodeStats?.contestHistory) ? leetcodeStats.contestHistory.length : 0;
    const difficultyBalance = {
      easy: leetcodeStats?.easySolved ?? 0,
      medium: leetcodeStats?.mediumSolved ?? 0,
      hard: leetcodeStats?.hardSolved ?? 0,
    };
    const hardRatio = difficultyBalance.totalSolved
      ? difficultyBalance.hard / Math.max(1, difficultyBalance.totalSolved)
      : 0;

    // --- Verdict ---
    let verdict;
    if (overall >= 70) verdict = 'Ready';
    else if (overall >= 50) verdict = 'Moderate';
    else verdict = 'Needs Work';

    const message =
      overall >= 70
        ? `Strong overall progress (${overall}%). Consistent streaks and ${difficultyBalance.totalSolved ?? 0} LeetCode solves make you a solid placement candidate.`
        : overall >= 50
          ? `Solid foundation (${overall}%), but closing the gap on weak topics and building contest consistency will materially improve your odds.`
          : `Your preparation is early-stage (${overall}%). Focus on fundamentals and a consistent daily cadence to build momentum.`;

    const estimate =
      overall >= 80 ? '1-2 months' : overall >= 60 ? '2-3 months' : overall >= 40 ? '3-4 months' : '4-6 months';

    // --- Next steps from weakest topics + signals ---
    const nextSteps = [];
    const weakTopics = Object.entries(topicsObj)
      .filter(([, s]) => s < 40)
      .sort((a, b) => a[1] - b[1])
      .map(([t]) => t);
    if (weakTopics.length) {
      nextSteps.push(`Solve 3-4 problems a week in your weakest areas: ${weakTopics.slice(0, 3).join(', ')}.`);
    }
    if (hardRatio < 0.15 && (leetcodeStats?.mediumSolved ?? 0) > 0) {
      nextSteps.push('Increase medium/hard difficulty ratio to build interview-grade problem-solving.');
    }
    if (contestCount === 0) {
      nextSteps.push('Participate in a LeetCode contest to benchmark against real candidates.');
    } else if (currentStreak > 0) {
      nextSteps.push(`You're on a ${currentStreak}-day streak — keep it alive to stay consistent.`);
    } else {
      nextSteps.push('Restart a daily practice streak (even one problem a day counts).');
    }
    if (nextSteps.length < 3) {
      nextSteps.push('Review past incorrect submissions and re-solve them from memory.');
    }

    const gaps = weaknesses.length
      ? weaknesses
      : ['No critical gaps detected — maintain consistency and attempt harder problems.'];

    res.status(200).json({
      success: true,
      overall,
      verdict,
      message,
      topics: topicsObj,
      strengths,
      gaps,
      estimate,
      next_steps: nextSteps,
      interviewReadiness: {
        verdict,
        overall,
        streak: { current: currentStreak, best: bestStreak },
        contestsAttended: contestCount,
        difficultyBalance,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error calculating readiness score',
      error: error.message,
    });
  }
};
