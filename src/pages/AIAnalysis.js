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
        weakestTopics: weakTopics.slice(0, 3).map((topic) => ({
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
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: '20px' }}>
          <div className="card" style={{ borderColor: 'rgba(16,185,129,0.15)' }}>
            <div className="flex-align-center mb-16" style={{ fontSize: '15px', fontWeight: 800, gap: '8px' }}>
              <span className="dot-accent dot-green" />
              <span>Strongest Topics</span>
            </div>
            {strongestTopics.length ? strongestTopics.map((topic) => (
              <div key={topic.topic} style={{ marginBottom: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{topic.topic} <span style={{ color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>({topic.score}%)</span></div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{topic.reason}</div>
              </div>
            )) : <div style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>No strong topics available yet.</div>}
          </div>
          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.15)' }}>
            <div className="flex-align-center mb-16" style={{ fontSize: '15px', fontWeight: 800, gap: '8px' }}>
              <span className="dot-accent dot-pink" />
              <span>Weakest Topics</span>
            </div>
            {weakestTopics.length ? weakestTopics.map((topic) => (
              <div key={topic.topic} style={{ marginBottom: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{topic.topic} <span style={{ color: 'var(--accent-pink)', fontFamily: 'var(--font-mono)' }}>({topic.score}%)</span></div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{topic.reason}</div>
              </div>
            )) : <div style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>No weak topics identified yet.</div>}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: '20px' }}>
          <div className="card" style={{ borderColor: 'rgba(59,130,246,0.15)' }}>
            <div className="flex-align-center mb-16" style={{ fontSize: '15px', fontWeight: 800, gap: '8px' }}>
              <span className="dot-accent dot-cyan" />
              <span>Difficulty Analysis</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Easy solved</div>
              <div style={{ fontWeight: 700, textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>{difficultyAnalysis.easy ?? 0}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Medium solved</div>
              <div style={{ fontWeight: 700, textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)' }}>{difficultyAnalysis.medium ?? 0}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Hard solved</div>
              <div style={{ fontWeight: 700, textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-pink)' }}>{difficultyAnalysis.hard ?? 0}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total solved</div>
              <div style={{ fontWeight: 700, textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{difficultyAnalysis.totalSolved ?? 0}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Acceptance rate: <strong style={{ color: 'var(--accent-purple)' }}>{difficultyAnalysis.acceptanceRate ?? 0}%</strong></div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Ranking: <strong>{difficultyAnalysis.ranking ? `#${difficultyAnalysis.ranking.toLocaleString()}` : 'N/A'}</strong></div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Contest rating: <strong style={{ color: 'var(--accent-orange)' }}>{difficultyAnalysis.contestRating ?? 'N/A'}</strong></div>
            </div>
            {difficultyAnalysis.summary && <div style={{ marginTop: '14px', fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '10px' }}>{difficultyAnalysis.summary}</div>}
          </div>

          <div className="card" style={{ borderColor: 'rgba(168,85,247,0.15)' }}>
            <div className="flex-align-center mb-16" style={{ fontSize: '15px', fontWeight: 800, gap: '8px' }}>
              <span className="dot-accent dot-purple" />
              <span>Contest Performance</span>
            </div>
            <div className="flex-column" style={{ gap: '10px', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total contests: <strong>{contestPerformance.totalContests ?? 0}</strong></div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Best rank: <strong>{contestPerformance.bestRank ?? 'N/A'}</strong></div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Latest rating: <strong>{contestPerformance.latestRating ?? 'N/A'}</strong></div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Trend: <strong style={{ color: 'var(--accent-orange)' }}>{contestPerformance.recentTrend || 'No trend available'}</strong></div>
            </div>
            {contestPerformance.notes && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '10px' }}>{contestPerformance.notes}</div>}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div className="card" style={{ borderColor: 'rgba(16,185,129,0.15)' }}>
            <div className="flex-align-center mb-16" style={{ fontSize: '15px', fontWeight: 800, gap: '8px' }}>
              <span>🗺️ Personalized Roadmap</span>
            </div>
            {personalizedRoadmap.length ? personalizedRoadmap.map(item => (
              <div key={item.week} className="mb-16" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--accent-green)' }}>Week {item.week}: {item.focus}</div>
                <ul style={{ margin: '8px 0 0', paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {item.actions.map((action, index) => <li key={index}>{action}</li>)}
                </ul>
              </div>
            )) : <div style={{ color: 'var(--text-muted)' }}>No roadmap available.</div>}
          </div>

          <div className="card" style={{ borderColor: 'rgba(249,115,22,0.15)' }}>
            <div className="flex-align-center mb-16" style={{ fontSize: '15px', fontWeight: 800, gap: '8px' }}>
              <span>📅 Revision Schedule</span>
            </div>
            {revisionSchedule.length ? revisionSchedule.map(item => (
              <div key={item.week} className="mb-16" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--accent-orange)' }}>Week {item.week}: {item.focus}</div>
                <ul style={{ margin: '8px 0 0', paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
      <div className="mb-28">
        <h1 className="section-title">🧠 AI Weakness Analysis</h1>
        <p className="section-subtitle">AI-powered deep analysis of your DSA performance and personalized recommendations</p>
      </div>

      {/* Quick overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ borderColor: 'rgba(16, 185, 129, 0.25)', background: 'rgba(13, 11, 26, 0.3)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 700, letterSpacing: '0.8px' }}>💪 STRONG TOPICS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {strongTopics.map(t => <span key={t.topic} className="tag tag-strong">{t.topic}</span>)}
            {strongTopics.length === 0 && <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Keep practicing!</span>}
          </div>
        </div>
        <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.25)', background: 'rgba(13, 11, 26, 0.3)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 700, letterSpacing: '0.8px' }}>⚠️ WEAK TOPICS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {weakTopics.map(t => <span key={t.topic} className="tag tag-weak">{t.topic}</span>)}
            {weakTopics.length === 0 && <span style={{ fontSize: '13px', color: 'var(--accent-green)', fontWeight: 600 }}>All topics look good!</span>}
          </div>
        </div>
        <div className="card" style={{ borderColor: 'rgba(139, 92, 246, 0.25)', background: 'rgba(13, 11, 26, 0.3)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 700, letterSpacing: '0.8px' }}>📊 OVERALL STATUS</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, color: 'var(--accent-purple)' }}>
            {Math.round((dsaProgress.reduce((s, t) => s + (t.solved / t.total), 0) / dsaProgress.length) * 100)}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 500 }}>Average completion rate</div>
        </div>
      </div>

      {/* AI Analysis Panel */}
      <div className="card mb-24" style={{ borderColor: 'rgba(0, 242, 254, 0.25)' }}>
        <div className="flex-row-between mb-20 flex-wrap gap-12">
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800 }}>AI Analysis Engine</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Powered by Gemini AI — analyzes your full progress history</div>
          </div>
          <button className="btn-primary" onClick={runAnalysis} disabled={loading}>
            {loading ? (
              <>
                <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block' }} />
                Analyzing...
              </>
            ) : '🧠 Run AI Analysis'}
          </button>
        </div>

        {/* Data being sent to AI */}
        <div style={{ background: 'rgba(3, 2, 7, 0.4)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>// Input: Your DSA Progress Data</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {dsaProgress.map(t => {
              const pct = Math.round((t.solved / t.total) * 100);
              return (
                <div key={t.topic} style={{
                  background: 'var(--bg-card2)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '6px 12px', fontSize: '12.5px',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{t.topic}</span>
                  <span style={{
                    color: pct >= 70 ? 'var(--accent-green)' : pct >= 40 ? 'var(--accent-orange)' : 'var(--accent-pink)',
                    fontFamily: 'var(--font-mono)', fontWeight: 700
                  }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Output */}
        {!analysis && !loading && (
          <div style={{
            border: '2px dashed var(--border-bright)', borderRadius: '16px', padding: '50px 20px',
            textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.005)'
          }}>
            <div style={{ fontSize: '44px', marginBottom: '14px' }}>🧠</div>
            <div style={{ fontSize: '16px', marginBottom: '6px', color: 'var(--text-primary)', fontWeight: 600 }}>Ready to analyze your performance</div>
            <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>Click "Run AI Analysis" to get personalized insights and recommendations</div>
          </div>
        )}

        {loading && (
          <div style={{ padding: '50px 20px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '18px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="dot-accent dot-cyan animate-pulse" style={{ width: 12, height: 12, animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14.5px', fontWeight: 500 }}>AI is analyzing your DSA progress...</div>
          </div>
        )}

        {analysis && !loading && (
          <div className="animate-fadeIn">
            {isStructuredAnalysis(analysis)
              ? renderStructuredAnalysis(analysis)
              : renderTextAnalysis(analysis).map((section, i) => (
                <div key={i} style={{
                  background: 'rgba(3, 2, 7, 0.3)', border: '1px solid var(--border)',
                  borderLeft: `4px solid ${getSectionColor(section.title)}`,
                  borderRadius: '12px', padding: '20px', marginBottom: '14px',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.01)'
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 800,
                    color: getSectionColor(section.title), marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px'
                  }}>{section.title}</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.75', whiteSpace: 'pre-wrap' }}>
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
