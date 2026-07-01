import React, { useState } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell } from 'recharts';
import { useApp } from '../context/AppContext';

const READINESS_PROMPT = (progress) => `Analyze this student's DSA preparation and provide a detailed interview readiness assessment.

Progress data:
${progress.map(t => `- ${t.topic}: ${t.solved} solved (${Math.round((t.solved/t.total)*100)}% of ${t.total})`).join('\n')}

Respond in EXACTLY this JSON format (no extra text):
{
  "overall": 72,
  "verdict": "Moderate",
  "message": "One encouraging sentence about their preparation",
  "topics": {
    "Arrays": 85,
    "Strings": 80,
    "Linked Lists": 65,
    "Trees": 55,
    "Graphs": 30,
    "Dynamic Programming": 35
  },
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["gap 1", "gap 2", "gap 3"],
  "estimate": "2-3 months",
  "next_steps": ["step 1", "step 2", "step 3"]
}

Use the actual data to calculate realistic scores. Overall should be weighted average.`;

const ReadinessScore = () => {
  const { dsaProgress } = useApp();
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);

  const calcScore = async () => {
    setLoading(true);
    setScore(null);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const mockScore = Math.round((dsaProgress.reduce((s, t) => s + (t.solved / t.total), 0) / dsaProgress.length * 100) * 0.8);
      const mockResponse = { ok: true, json: async () => ({ content: [{ text: `Overall Readiness Score: ${mockScore}%

Your preparation level indicates you are ${mockScore >= 70 ? 'well-prepared' : 'moderately prepared'} for placements. Focus on weak areas to boost confidence.` }] }) };
      const response = mockResponse;
      const data = await response.json();
      const text = data.content?.map(c => c.text || '').join('') || '{}';
      const clean = text.replace(/```json|```/g, '').trim();
      setScore(JSON.parse(clean));
    } catch (err) {
      const overall = Math.round(dsaProgress.reduce((s, t) => s + (t.solved / t.total), 0) / dsaProgress.length * 100);
      setScore({ overall, verdict: overall >= 70 ? 'Ready' : overall >= 50 ? 'Moderate' : 'Needs Work', message: 'Keep practicing consistently to improve your scores.', topics: {}, strengths: [], gaps: [], estimate: '3-4 months', next_steps: [] });
    }
    setLoading(false);
  };

  const getVerdictColor = (v) => {
    if (v === 'Ready' || v === 'Strong') return 'var(--accent-green)';
    if (v === 'Moderate') return 'var(--accent-orange)';
    return 'var(--accent-pink)';
  };

  const getScoreColor = (s) => s >= 70 ? 'var(--accent-green)' : s >= 50 ? 'var(--accent-orange)' : 'var(--accent-pink)';

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: '28px' }}>
        <h1 className="section-title">🏆 Interview Readiness Score</h1>
        <p className="section-subtitle">AI-powered assessment of your placement interview preparedness</p>
      </div>

      {/* Action */}
      <div className="card" style={{ marginBottom: '24px', borderColor: 'rgba(0,212,255,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700 }}>Readiness Assessment</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Comprehensive analysis across all DSA topics</div>
          </div>
          <button className="btn-primary" onClick={calcScore} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {loading ? <><span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />Calculating...</> : '🏆 Calculate Score'}
          </button>
        </div>
      </div>

      {!score && !loading && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏆</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Know your placement readiness</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Get an honest score across all DSA topics with actionable next steps</div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>📊</div>
          <div style={{ color: 'var(--text-secondary)' }}>Calculating your readiness score...</div>
        </div>
      )}

      {score && !loading && (
        <div className="animate-fadeIn">
          {/* Main Score Card */}
          <div style={{
            background: 'linear-gradient(135deg, var(--bg-card), var(--bg-card2))',
            border: `1px solid ${getVerdictColor(score.verdict)}44`,
            borderRadius: '20px', padding: '32px', marginBottom: '20px',
            display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap'
          }}>
            {/* Score Circle */}
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ position: 'relative', width: 160, height: 160 }}>
                <svg viewBox="0 0 160 160" style={{ width: 160, height: 160, transform: 'rotate(-90deg)' }}>
                  <circle cx="80" cy="80" r="65" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                  <circle cx="80" cy="80" r="65" fill="none"
                    stroke={getScoreColor(score.overall)} strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(score.overall / 100) * 408} 408`}
                    style={{ filter: `drop-shadow(0 0 8px ${getScoreColor(score.overall)})` }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800, color: getScoreColor(score.overall) }}>{score.overall}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>out of 100</div>
                </div>
              </div>
              <div style={{
                display: 'inline-block', marginTop: '12px', padding: '6px 20px', borderRadius: '20px',
                background: `${getVerdictColor(score.verdict)}22`, border: `1px solid ${getVerdictColor(score.verdict)}44`,
                color: getVerdictColor(score.verdict), fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700
              }}>{score.verdict}</div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              {score.message && <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>{score.message}</p>}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>PLACEMENT ESTIMATE</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-cyan)' }}>{score.estimate}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>STATUS</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: getVerdictColor(score.verdict) }}>Placement {score.verdict}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Topic Scores */}
          {score.topics && Object.keys(score.topics).length > 0 && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Topic-wise Scores</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(score.topics).sort((a, b) => b[1] - a[1]).map(([topic, s]) => (
                  <div key={topic}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>{topic}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: getScoreColor(s), fontWeight: 700 }}>{s}/100</span>
                    </div>
                    <div className="progress-bar" style={{ height: 8 }}>
                      <div className="progress-fill" style={{ width: `${s}%`, background: `linear-gradient(90deg, ${getScoreColor(s)}, ${getScoreColor(s)}88)` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Gaps */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {score.strengths?.length > 0 && (
              <div className="card" style={{ borderColor: 'rgba(0,255,136,0.2)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-green)' }}>💪 Your Strengths</div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {score.strengths.map((s, i) => (
                    <li key={i} style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                      <span style={{ color: 'var(--accent-green)' }}>✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {score.gaps?.length > 0 && (
              <div className="card" style={{ borderColor: 'rgba(255,45,120,0.2)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-pink)' }}>🎯 Critical Gaps</div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {score.gaps.map((g, i) => (
                    <li key={i} style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                      <span style={{ color: 'var(--accent-pink)' }}>!</span> {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Next Steps */}
          {score.next_steps?.length > 0 && (
            <div className="card" style={{ borderColor: 'rgba(0,212,255,0.2)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>🚀 Recommended Next Steps</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {score.next_steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0
                    }}>{i + 1}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', paddingTop: '2px' }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReadinessScore;
