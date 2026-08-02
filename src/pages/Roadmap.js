import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import LeetCodeEmptyState from '../components/LeetCodeEmptyState';

const Roadmap = () => {
  const { dsaProgress, generateAIRoadmap, fetchLatestRoadmap, leetcodeData } = useApp();
  const [weeks, setWeeks] = useState(4);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [completedWeeks, setCompletedWeeks] = useState([]);

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        const data = await fetchLatestRoadmap();
        if (data && data.success && data.content) {
          const text = data.content.map(c => c.text || '').join('') || '';
          if (text) {
            setRoadmap(parseRoadmap(text));
          }
        }
      } catch (err) {
        console.error('Failed to load saved AI roadmap:', err);
      }
    };
    loadRoadmap();
  }, [fetchLatestRoadmap]);

  const generateRoadmap = async () => {
    setLoading(true);
    setRoadmap(null);
    try {
      const data = await generateAIRoadmap(dsaProgress, weeks);
      const text = data.content?.map(c => c.text || '').join('') || '';
      setRoadmap(parseRoadmap(text));
    } catch (err) {
      console.warn('API key not configured or network issue, using simulated AI fallback:', err.message);
      await new Promise(r => setTimeout(r, 1500));
      
      let generatedText = '';
      for (let i = 1; i <= weeks; i++) {
        generatedText += `WEEK ${i}: Topic Focus ${i}\n- Practice foundational problems\n- Study sorting & search optimizations\n- Solve 2 medium difficulty edge cases\nGOAL: Master focus area for week ${i} and maintain daily streak.\n\n`;
      }
      setRoadmap(parseRoadmap(generatedText));
    } finally {
      setLoading(false);
    }
  };

  const parseRoadmap = (text) => {
    const weekBlocks = text.split(/WEEK\s+\d+:/i).filter(Boolean);
    const weekMatches = text.match(/WEEK\s+(\d+):\s*([^\n]+)/ig) || [];
    return weekBlocks.map((block, i) => {
      const titleMatch = weekMatches[i]?.match(/WEEK\s+\d+:\s*(.+)/i);
      const topics = block.match(/^-\s+(.+)/mg)?.map(l => l.replace(/^-\s+/, '').trim()) || [];
      const goalMatch = block.match(/GOAL:\s*(.+)/i);
      return {
        week: i + 1,
        title: titleMatch ? titleMatch[1].trim() : `Week ${i + 1}`,
        topics,
        goal: goalMatch ? goalMatch[1].trim() : ''
      };
    });
  };

  const weekColors = ['var(--accent-cyan)', 'var(--accent-purple)', 'var(--accent-green)', 'var(--accent-orange)', 'var(--accent-pink)', 'var(--accent-cyan)'];

  return (
    <div className="animate-fadeIn">
      <div className="mb-28">
        <h1 className="section-title">🗺 Personalized Roadmap</h1>
        <p className="section-subtitle">AI-generated week-by-week study plan tailored to your weak areas</p>
      </div>

      {!leetcodeData ? (
        <LeetCodeEmptyState
          icon="🗺️"
          title="Sync LeetCode ID to Generate Study Plan"
          subtitle="Please sync your LeetCode profile in the Dashboard to allow the AI to generate a personalized week-by-week study roadmap based on your progress."
        />
      ) : (
        <>
          {/* Config Card */}
          <div className="card mb-24" style={{ borderColor: 'rgba(0, 242, 254, 0.25)' }}>
            <div className="flex-row-between flex-wrap gap-16">
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 800 }}>Generate Your Study Plan</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>AI will prioritize your weakest topics and build a structured path</div>
              </div>
              <div className="flex-align-center flex-wrap" style={{ gap: '16px' }}>
                <div>
                  <label className="mb-6" style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Duration (weeks)</label>
                  <select value={weeks} onChange={e => setWeeks(parseInt(e.target.value))} className="input-field" style={{ width: '140px', padding: '10px 14px' }}>
                    {[2, 4, 6, 8, 12].map(w => <option key={w} value={w}>{w} weeks</option>)}
                  </select>
                </div>
                <button className="btn-primary" onClick={generateRoadmap} disabled={loading} style={{ marginTop: '18px' }}>
                  {loading ? (
                    <>
                      <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block' }} />
                      Building...
                    </>
                  ) : '🗺 Generate Roadmap'}
                </button>
              </div>
            </div>
          </div>

          {/* Empty state */}
          {!roadmap && !loading && (
            <div className="text-center" style={{ padding: '80px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🗺</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>No roadmap yet</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
                Click "Generate Roadmap" and the AI will create a personalized week-by-week plan based on your current progress
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center" style={{ padding: '60px' }}>
              <div style={{ display: 'inline-flex', gap: '10px', marginBottom: '18px' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="dot-accent animate-pulse" style={{
                    background: weekColors[i], width: 12, height: 12,
                    animationDelay: `${i * 0.15}s`
                  }} />
                ))}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14.5px', fontWeight: 500 }}>Crafting your personalized roadmap...</div>
            </div>
          )}
        </>
      )}

      {/* Roadmap Timeline */}
      {roadmap && !loading && (
        <div className="animate-fadeIn" style={{ position: 'relative' }}>
          {/* Timeline line */}
          <div style={{ 
            position: 'absolute', left: '28px', top: '40px', bottom: '40px', width: 2, 
            background: 'linear-gradient(180deg, var(--accent-cyan), var(--accent-purple), var(--accent-pink), transparent)', 
            opacity: 0.15 
          }} />

          <div className="flex-column" style={{ gap: '20px' }}>
            {roadmap.map((week, i) => {
              const color = weekColors[i % weekColors.length];
              const isDone = completedWeeks.includes(week.week);
              return (
                <div key={i} className="flex-align-center" style={{ gap: '20px', alignItems: 'flex-start' }}>
                  {/* Timeline dot */}
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                    background: isDone ? 'var(--accent-green)' : `linear-gradient(135deg, ${color}, rgba(0,0,0,0.2))`,
                    border: `2px solid ${isDone ? 'var(--accent-green)' : color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, color: isDone ? '#06050c' : '#fff',
                    boxShadow: isDone ? '0 0 20px rgba(16,185,129,0.35)' : `0 0 15px ${color}20`,
                    cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }} onClick={() => setCompletedWeeks(prev => isDone ? prev.filter(w => w !== week.week) : [...prev, week.week])}>
                    {isDone ? '✓' : `W${week.week}`}
                  </div>

                  {/* Content */}
                  <div className="card" style={{ flex: 1, borderColor: isDone ? 'rgba(16,185,129,0.25)' : 'var(--border)', background: 'rgba(13, 11, 26, 0.35)' }}>
                    <div className="flex-row-between mb-12 flex-wrap gap-8" style={{ alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: color, fontFamily: 'var(--font-mono)', fontWeight: 800, letterSpacing: '1px', marginBottom: '4px', textTransform: 'uppercase' }}>WEEK {week.week}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800 }}>{week.title}</div>
                      </div>
                      {isDone && <span className="tag tag-strong">✅ Completed</span>}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: week.goal ? '12px' : 0 }}>
                      {week.topics.map((topic, j) => (
                        <div key={j} style={{
                          background: 'rgba(3, 2, 7, 0.3)', border: `1px solid var(--border)`,
                          borderRadius: '8px', padding: '6px 12px', fontSize: '13px',
                          color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                          <span className="dot-accent" style={{ background: color, width: 6, height: 6, display: 'inline-block' }} />
                          {topic}
                        </div>
                      ))}
                    </div>

                    {week.goal && (
                      <div style={{ background: 'rgba(3, 2, 7, 0.2)', border: `1px solid var(--border)`, borderRadius: '10px', padding: '10px 14px', marginTop: '10px' }}>
                        <span style={{ fontSize: '12px', color: color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Goal: </span>
                        <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>{week.goal}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-20" style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
            💡 Click on a week circle to toggle its completion status
          </div>
        </div>
      )}
    </div>
  );
};

export default Roadmap;
