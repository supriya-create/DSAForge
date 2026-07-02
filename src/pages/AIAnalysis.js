import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const CLAUDE_ANALYSIS_PROMPT = (progress) => `You are a DSA (Data Structures & Algorithms) coach analyzing a student's problem-solving progress for placement preparation.

Here is the student's current DSA progress data:
${progress.map(t => `- ${t.topic}: ${t.solved} solved (Easy: ${t.easy}, Medium: ${t.medium}, Hard: ${t.hard}) out of ${t.total} problems`).join('\n')}

Please analyze this data and provide:

1. **STRENGTH ANALYSIS**: List topics where the student is performing well (>60% completion) with brief reasons.

2. **WEAKNESS ANALYSIS**: List topics that need immediate attention (<40% completion) with specific gaps.

3. **PRIORITY ACTION ITEMS**: Give 3-5 specific, actionable steps the student should take this week.

4. **INTERVIEW READINESS**: Rate their overall readiness for placement interviews (1-10) with a brief justification.

5. **QUICK WINS**: Suggest 2-3 topics they can quickly improve to boost their confidence.

Format your response clearly with these exact sections. Be specific and encouraging. Keep it concise but insightful.`;

const isStructuredAnalysis = (analysis) => {
  return analysis && typeof analysis === 'object' && !Array.isArray(analysis) && ('weakestTopics' in analysis || 'difficultyAnalysis' in analysis);
};

const chunkArray = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const AIAnalysis = () => {
  const { dsaProgress, runAIAnalysis, fetchLatestAIAnalysis } = useApp();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const data = await fetchLatestAIAnalysis();
        if (data && data.success && data.analysis) {
          setAnalysis(data.analysis);
          setAnalyzed(true);
        }
      } catch (err) {
        console.error('Failed to load saved AI analysis:', err);
      }
    };
    loadAnalysis();
  }, [fetchLatestAIAnalysis]);

  const runAnalysis = async () => {
    setLoading(true);
    setAnalysis(null);
    try {
      const data = await runAIAnalysis(dsaProgress);
      if (data && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setAnalysis(data);
      }
      setAnalyzed(true);
    } catch (err) {
      console.warn('API key not configured or network issue, using simulated AI fallback:', err.message);
      await new Promise(r => setTimeout(r, 1500));

      const weakTopics = dsaProgress.filter(t => (t.solved / t.total) < 0.4).map(t => t.topic);
      const strongTopics = dsaProgress.filter(t => (t.solved / t.total) > 0.6).map(t => t.topic);
      const mockAnalysis = {
        weakestTopics: weakTopics.slice(0, 3).map((topic, index) => ({
          topic,
          score: Math.round((dsaProgress.find(t => t.topic === topic)?.solved || 0) / (dsaProgress.find(t => t.topic === topic)?.total || 1) * 100),
          reason: `Low completion on ${topic}`
        })),
        strongestTopics: strongTopics.slice(0, 3).map((topic) => ({
          topic,
          score: Math.round((dsaProgress.find(t => t.topic === topic)?.solved || 0) / (dsaProgress.find(t => t.topic === topic)?.total || 1) * 100),
          reason: `High completion on ${topic}`
        })),
        difficultyAnalysis: {
          easy: dsaProgress.reduce((sum, t) => sum + (t.easy || 0), 0),
          medium: dsaProgress.reduce((sum, t) => sum + (t.medium || 0), 0),
          hard: dsaProgress.reduce((sum, t) => sum + (t.hard || 0), 0),
          totalSolved: dsaProgress.reduce((sum, t) => sum + t.solved, 0),
          acceptanceRate: 0,
          ranking: null,
          contestRating: null,
          summary: 'Using DSA progress data to estimate difficulty distribution.'
        },
        contestPerformance: {
          totalContests: 0,
          bestRank: null,
          latestRating: null,
          recentTrend: 'No contest data available',
          notes: 'Contest performance will be available after syncing your LeetCode profile.'
        },
        personalizedRoadmap: Array.from({ length: 4 }, (_, index) => ({
          week: index + 1,
          focus: weakTopics[index] || 'Core concepts',
          actions: [
            `Solve problems in ${weakTopics[index] || 'core algorithms'}`,
            'Review mistakes from previous submissions',
            'Practice one timed problem every session'
          ]
        })),
        revisionSchedule: Array.from({ length: 4 }, (_, index) => ({
          week: index + 1,
          focus: index === 0 ? 'Weakest topics' : index === 1 ? 'Contest preparation' : index === 2 ? 'Difficulty review' : 'Revision and retention',
          actions: [
            'Review core patterns',
            'Re-solve one previously solved problem',
            'Summarize key takeaways in notes'
          ]
        }))
      };
      setAnalysis(mockAnalysis);
      setAnalyzed(true);
    } finally {
      setLoading(false);
    }
  };

  const renderTextAnalysis = (text) => {
    const sections = [];
    const sectionMatches = String(text).split(/\*\*([^*]+)\*\*/);
    for (let i = 1; i < sectionMatches.length; i += 2) {
      sections.push({ title: sectionMatches[i], content: sectionMatches[i + 1]?.trim() || '' });
    }
    if (!sections.length) {
      return [{ title: 'Analysis', content: String(text) }];
    }
    return sections;
  };

  const renderStructuredAnalysis = (analysisData) => {
    const {
      weakestTopics = [],
      strongestTopics = [],
      difficultyAnalysis = {},
      contestPerformance = {},
      personalizedRoadmap = [],
      revisionSchedule = []
    } = analysisData;

    return (
      <>
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', marginBottom: '16px' }}>
          <div className="card" style={{ borderColor: 'rgba(16,185,129,0.14)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>✅ Strongest Topics</div>
            {strongestTopics.length ? strongestTopics.map((topic) => (
              <div key={topic.topic} style={{ marginBottom: '10px' }}>
                <div style={{ fontWeight: 700 }}>{topic.topic} <span style={{ color: 'var(--accent-green)' }}>({topic.score}%)</span></div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{topic.reason}</div>
              </div>
            )) : <div style={{ color: 'var(--text-muted)' }}>No strong topics available.</div>}
          </div>
          <div className="card" style={{ borderColor: 'rgba(249,115,22,0.14)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>⚠️ Weakest Topics</div>
            {weakestTopics.length ? weakestTopics.map((topic) => (
              <div key={topic.topic} style={{ marginBottom: '10px' }}>
                <div style={{ fontWeight: 700 }}>{topic.topic} <span style={{ color: 'var(--accent-pink)' }}>({topic.score}%)</span></div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{topic.reason}</div>
              </div>
            )) : <div style={{ color: 'var(--text-muted)' }}>No weak topics identified.</div>}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', marginBottom: '16px' }}>
          <div className="card" style={{ borderColor: 'rgba(59,130,246,0.14)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>📚 Difficulty Analysis</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px' }}>Easy solved</div>
              <div style={{ fontWeight: 700, textAlign: 'right' }}>{difficultyAnalysis.easy ?? 0}</div>
              <div style={{ fontSize: '13px' }}>Medium solved</div>
              <div style={{ fontWeight: 700, textAlign: 'right' }}>{difficultyAnalysis.medium ?? 0}</div>
              <div style={{ fontSize: '13px' }}>Hard solved</div>
              <div style={{ fontWeight: 700, textAlign: 'right' }}>{difficultyAnalysis.hard ?? 0}</div>
              <div style={{ fontSize: '13px' }}>Total solved</div>
              <div style={{ fontWeight: 700, textAlign: 'right' }}>{difficultyAnalysis.totalSolved ?? 0}</div>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>Acceptance rate: {difficultyAnalysis.acceptanceRate ?? 0}%</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Ranking: {difficultyAnalysis.ranking ?? 'N/A'}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Contest rating: {difficultyAnalysis.contestRating ?? 'N/A'}</div>
            {difficultyAnalysis.summary && <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{difficultyAnalysis.summary}</div>}
          </div>

          <div className="card" style={{ borderColor: 'rgba(168,85,247,0.14)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>🏁 Contest Performance</div>
            <div style={{ fontSize: '13px', marginBottom: '8px' }}>Total contests: <strong>{contestPerformance.totalContests ?? 0}</strong></div>
            <div style={{ fontSize: '13px', marginBottom: '8px' }}>Best rank: <strong>{contestPerformance.bestRank ?? 'N/A'}</strong></div>
            <div style={{ fontSize: '13px', marginBottom: '8px' }}>Latest rating: <strong>{contestPerformance.latestRating ?? 'N/A'}</strong></div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>Trend: {contestPerformance.recentTrend || 'No trend available'}</div>
            {contestPerformance.notes && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{contestPerformance.notes}</div>}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div className="card" style={{ borderColor: 'rgba(34,197,94,0.14)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>🗺️ Personalized Roadmap</div>
            {personalizedRoadmap.length ? personalizedRoadmap.map(item => (
              <div key={item.week} style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: 700 }}>Week {item.week}: {item.focus}</div>
                <ul style={{ margin: '8px 0 0', paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {item.actions.map((action, index) => <li key={index}>{action}</li>)}
                </ul>
              </div>
            )) : <div style={{ color: 'var(--text-muted)' }}>No roadmap available.</div>}
          </div>

          <div className="card" style={{ borderColor: 'rgba(249,115,22,0.14)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>📅 Revision Schedule</div>
            {revisionSchedule.length ? revisionSchedule.map(item => (
              <div key={item.week} style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: 700 }}>Week {item.week}: {item.focus}</div>
                <ul style={{ margin: '8px 0 0', paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {item.actions.map((action, index) => <li key={index}>{action}</li>)}
                </ul>
              </div>
            )) : <div style={{ color: 'var(--text-muted)' }}>No revision schedule available.</div>}
          </div>
        </div>
      </>
    );
  };

  const sectionColors = {
    STRENGTH: 'var(--accent-green)',
    WEAKNESS: 'var(--accent-pink)',
    PRIORITY: 'var(--accent-cyan)',
    INTERVIEW: 'var(--accent-purple)',
    QUICK: 'var(--accent-orange)'
  };
  const getSectionColor = (title) => {
    for (const [key, color] of Object.entries(sectionColors)) {
      if (title.toUpperCase().includes(key)) return color;
    }
    return 'var(--accent-cyan)';
  };

  const weakTopics = dsaProgress.filter(t => (t.solved / t.total) < 0.4);
  const strongTopics = dsaProgress.filter(t => (t.solved / t.total) >= 0.6);

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: '28px' }}>
        <h1 className="section-title">🧠 AI Weakness Analysis</h1>
        <p className="section-subtitle">AI-powered deep analysis of your DSA performance and personalized recommendations</p>
      </div>

      {/* Quick overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ borderColor: 'rgba(0,255,136,0.2)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 600 }}>💪 STRONG TOPICS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {strongTopics.map(t => <span key={t.topic} className="tag tag-strong">{t.topic}</span>)}
            {strongTopics.length === 0 && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Keep practicing!</span>}
          </div>
        </div>
        <div className="card" style={{ borderColor: 'rgba(255,45,120,0.2)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 600 }}>⚠️ WEAK TOPICS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {weakTopics.map(t => <span key={t.topic} className="tag tag-weak">{t.topic}</span>)}
            {weakTopics.length === 0 && <span style={{ fontSize: '13px', color: 'var(--accent-green)' }}>All topics look good!</span>}
          </div>
        </div>
        <div className="card" style={{ borderColor: 'rgba(124,58,237,0.2)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 600 }}>📊 OVERALL STATUS</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: 'var(--accent-purple)' }}>
            {Math.round((dsaProgress.reduce((s, t) => s + (t.solved / t.total), 0) / dsaProgress.length) * 100)}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Average completion rate</div>
        </div>
      </div>

      {/* AI Analysis Panel */}
      <div className="card" style={{ borderColor: 'rgba(0,212,255,0.2)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>AI Analysis Engine</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Powered by Gemini AI — analyzes your full progress history</div>
          </div>
          <button className="btn-primary" onClick={runAnalysis} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {loading ? (
              <>
                <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
                Analyzing...
              </>
            ) : '🧠 Run AI Analysis'}
          </button>
        </div>

        {/* Data being sent to AI */}
        <div style={{ background: 'var(--bg-deep)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>// Input: Your DSA Progress Data</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {dsaProgress.map(t => {
              const pct = Math.round((t.solved / t.total) * 100);
              return (
                <div key={t.topic} style={{
                  background: 'var(--bg-card2)', border: '1px solid var(--border)',
                  borderRadius: '6px', padding: '4px 10px', fontSize: '12px',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{t.topic}</span>
                  <span style={{
                    color: pct >= 70 ? 'var(--accent-green)' : pct >= 40 ? 'var(--accent-orange)' : 'var(--accent-pink)',
                    fontFamily: 'var(--font-mono)', fontWeight: 600
                  }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Output */}
        {!analysis && !loading && (
          <div style={{
            border: '2px dashed var(--border)', borderRadius: '12px', padding: '40px',
            textAlign: 'center', color: 'var(--text-muted)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🧠</div>
            <div style={{ fontSize: '15px', marginBottom: '6px', color: 'var(--text-secondary)' }}>Ready to analyze your performance</div>
            <div style={{ fontSize: '13px' }}>Click "Run AI Analysis" to get personalized insights and recommendations</div>
          </div>
        )}

        {loading && (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-cyan)',
                  animation: `pulse ${0.8 + i * 0.2}s ease-in-out infinite`
                }} />
              ))}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>AI is analyzing your DSA progress...</div>
          </div>
        )}

        {analysis && !loading && (
          <div className="animate-fadeIn">
            {isStructuredAnalysis(analysis)
              ? renderStructuredAnalysis(analysis)
              : renderTextAnalysis(analysis).map((section, i) => (
                <div key={i} style={{
                  background: 'var(--bg-deep)', border: '1px solid var(--border)',
                  borderLeft: `3px solid ${getSectionColor(section.title)}`,
                  borderRadius: '10px', padding: '16px', marginBottom: '12px'
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700,
                    color: getSectionColor(section.title), marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px'
                  }}>{section.title}</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                    {section.content}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysis;
