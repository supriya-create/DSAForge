import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import LeetCodeEmptyState from '../components/LeetCodeEmptyState';

const ReadinessScore = () => {
  const { leetcodeData, calculateReadiness } = useApp();
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calcScore = async () => {
    setLoading(true);
    setScore(null);
    setError('');
    try {
      // Real server-side readiness assessment (no mocked data).
      const data = await calculateReadiness();
      setScore(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to calculate readiness score. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (v) => {
    if (v === 'Ready' || v === 'Strong' || v === 'Well-Prepared') return 'var(--accent-green)';
    if (v === 'Moderate') return 'var(--accent-orange)';
    return 'var(--accent-pink)';
  };

  const getScoreColor = (s) => s >= 70 ? 'var(--accent-green)' : s >= 50 ? 'var(--accent-orange)' : 'var(--accent-pink)';

  return (
    <div className="animate-fadeIn">
      <div className="mb-28">
        <h1 className="section-title">🏆 Interview Readiness Score</h1>
        <p className="section-subtitle">AI-powered assessment of your placement interview preparedness</p>
      </div>

      {!leetcodeData ? (
        <LeetCodeEmptyState
          icon="🏆"
          title="Sync LeetCode ID to Calculate Readiness Score"
          subtitle="Please sync your LeetCode profile in the Dashboard to assess your placement interview preparedness and calculate your readiness score."
        />
      ) : (
        <>
          {/* Action */}
          <div className="card mb-24" style={{ borderColor: 'rgba(0, 242, 254, 0.25)' }}>
            <div className="flex-row-between flex-wrap gap-12">
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 800 }}>Readiness Assessment</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Comprehensive analysis across all DSA topics</div>
              </div>
              <button className="btn-primary" onClick={calcScore} disabled={loading}>
                {loading ? (
                  <>
                    <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block' }} />
                    Calculating...
                  </>
                ) : '🏆 Calculate Score'}
              </button>
            </div>
            {error && !loading && (
              <div className="mt-16" style={{
                background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--accent-pink)', padding: '12px 14px', borderRadius: '10px', fontSize: '13px'
              }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {!score && !loading && (
            <div className="text-center" style={{ padding: '80px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏆</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Know your placement readiness</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Get an honest score across all DSA topics with actionable next steps</div>
            </div>
          )}

          {loading && (
            <div className="text-center" style={{ padding: '60px' }}>
              <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '16px' }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="dot-accent dot-purple animate-pulse" style={{ width: 12, height: 12, animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14.5px', fontWeight: 500 }}>Calculating your readiness score...</div>
            </div>
          )}
        </>
      )}

      {score && !loading && (
        <div className="animate-fadeIn">
          {/* Main Score Card */}
          <div className="card mb-24" style={{
            background: 'linear-gradient(135deg, rgba(13, 11, 26, 0.55), rgba(30, 24, 53, 0.25))',
            borderColor: `${getVerdictColor(score.verdict)}35`,
            padding: '32px',
            display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap',
            boxShadow: `0 10px 40px rgba(0,0,0,0.3), 0 0 30px ${getVerdictColor(score.verdict)}05`
          }}>
            {/* Score Circle */}
            <div className="text-center" style={{ flexShrink: 0, margin: '0 auto' }}>
              <div style={{ position: 'relative', width: 160, height: 160 }}>
                <svg viewBox="0 0 160 160" style={{ width: 160, height: 160, transform: 'rotate(-90deg)' }}>
                  <circle cx="80" cy="80" r="65" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                  <circle cx="80" cy="80" r="65" fill="none"
                    stroke={getScoreColor(score.overall)} strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(score.overall / 100) * 408} 408`}
                    style={{ filter: `drop-shadow(0 0 8px ${getScoreColor(score.overall)}35)` }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '38px', fontWeight: 800, color: getScoreColor(score.overall), letterSpacing: '-0.5px' }}>{score.overall}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>readiness</div>
                </div>
              </div>
              <div style={{
                display: 'inline-block', marginTop: '16px', padding: '6px 20px', borderRadius: '99px',
                background: `${getVerdictColor(score.verdict)}12`, border: `1px solid ${getVerdictColor(score.verdict)}35`,
                color: getVerdictColor(score.verdict), fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.8px'
              }}>{score.verdict}</div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: '260px' }}>
              {score.message && <p style={{ fontSize: '15.5px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>{score.message}</p>}
              <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>PLACEMENT ESTIMATE</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-cyan)' }}>{score.estimate}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>STATUS</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: getVerdictColor(score.verdict) }}>Placement {score.verdict}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Topic Scores */}
          {score.topics && Object.keys(score.topics).length > 0 && (
            <div className="card mb-24">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 800, marginBottom: '18px' }}>Topic-wise Scores</div>
              <div className="flex-column" style={{ gap: '14px' }}>
                {Object.entries(score.topics).sort((a, b) => b[1] - a[1]).map(([topic, s]) => (
                  <div key={topic}>
                    <div className="flex-row-between mb-6">
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{topic}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13.5px', color: getScoreColor(s), fontWeight: 800 }}>{s}/100</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${s}%`, background: `linear-gradient(90deg, ${getScoreColor(s)}, ${getScoreColor(s)}aa)` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Gaps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {score.strengths?.length > 0 && (
              <div className="card" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 800, marginBottom: '14px', color: 'var(--accent-green)' }}>💪 Your Strengths</div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {score.strengths.map((s, i) => (
                    <li key={i} style={{ fontSize: '13.5px', color: 'var(--text-secondary)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--accent-green)', fontWeight: 800 }}>✓</span> <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {score.gaps?.length > 0 && (
              <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 800, marginBottom: '14px', color: 'var(--accent-pink)' }}>🎯 Critical Gaps</div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {score.gaps.map((g, i) => (
                    <li key={i} style={{ fontSize: '13.5px', color: 'var(--text-secondary)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--accent-pink)', fontWeight: 800 }}>!</span> <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Next Steps */}
          {score.next_steps?.length > 0 && (
            <div className="card mb-24" style={{ borderColor: 'rgba(0, 242, 254, 0.2)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 800, marginBottom: '16px' }}>🚀 Recommended Next Steps</div>
              <div className="flex-column" style={{ gap: '12px' }}>
                {score.next_steps.map((step, i) => (
                  <div key={i} className="flex-align-center" style={{ gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0, color: '#06050c'
                    }}>{i + 1}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', paddingTop: '2px', lineHeight: '1.4' }}>{step}</span>
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
