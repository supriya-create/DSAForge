import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const ROADMAP_PROMPT = (progress, weeks) => `You are a DSA placement preparation coach. Create a ${weeks}-week personalized study roadmap for this student.

Student's current DSA progress:
${progress.map(t => `- ${t.topic}: ${t.solved} solved (${Math.round((t.solved/t.total)*100)}% complete)`).join('\n')}

Create a detailed week-by-week roadmap that:
1. Prioritizes weak areas (low completion %)
2. Builds on existing strengths
3. Follows a logical learning progression
4. Includes specific topics/subtopics for each week

Format EXACTLY like this for each week:
WEEK [N]: [Theme Title]
- [Subtopic 1]
- [Subtopic 2]  
- [Subtopic 3]
GOAL: [Weekly goal in one sentence]

Generate all ${weeks} weeks in this format. Be specific with subtopics.`;

const Roadmap = () => {
  const { dsaProgress, generateAIRoadmap, fetchLatestRoadmap } = useApp();
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
      // Simulate API delay
      await new Promise(r => setTimeout(r, 1500));
      
      // Dynamic simulated roadmap weeks
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
      <div style={{ marginBottom: '28px' }}>
        <h1 className="section-title">🗺 Personalized Roadmap</h1>
        <p className="section-subtitle">AI-generated week-by-week study plan tailored to your weak areas</p>
      </div>

      {/* Config Card */}
      <div className="card" style={{ marginBottom: '24px', borderColor: 'rgba(0,212,255,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700 }}>Generate Your Study Plan</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>AI will prioritize your weakest topics and build a structured path</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Duration (weeks)</label>
              <select value={weeks} onChange={e => setWeeks(parseInt(e.target.value))} className="input-field" style={{ width: '140px' }}>
                {[2, 4, 6, 8, 12].map(w => <option key={w} value={w}>{w} weeks</option>)}
              </select>
            </div>
            <button className="btn-primary" onClick={generateRoadmap} disabled={loading} style={{ marginTop: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {loading ? (
                <>
                  <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
                  Building...
                </>
              ) : '🗺 Generate Roadmap'}
            </button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!roadmap && !loading && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🗺</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>No roadmap yet</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            Click "Generate Roadmap" and the AI will create a personalized week-by-week plan based on your current progress
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '16px' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{
                width: 12, height: 12, borderRadius: '50%', background: weekColors[i],
                animation: `pulse ${1 + i * 0.15}s ease-in-out infinite`
              }} />
            ))}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>Crafting your personalized roadmap...</div>
        </div>
      )}

      {/* Roadmap Timeline */}
      {roadmap && !loading && (
        <div className="animate-fadeIn" style={{ position: 'relative' }}>
          {/* Timeline line */}
          <div style={{ position: 'absolute', left: '28px', top: '40px', bottom: '40px', width: 2, background: 'linear-gradient(180deg, var(--accent-cyan), var(--accent-purple), var(--accent-pink))', opacity: 0.3 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {roadmap.map((week, i) => {
              const color = weekColors[i % weekColors.length];
              const isDone = completedWeeks.includes(week.week);
              return (
                <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  {/* Timeline dot */}
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                    background: isDone ? 'var(--accent-green)' : `linear-gradient(135deg, ${color}, transparent)`,
                    border: `2px solid ${isDone ? 'var(--accent-green)' : color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, color: isDone ? '#000' : color,
                    boxShadow: isDone ? '0 0 16px rgba(0,255,136,0.4)' : `0 0 16px ${color}33`,
                    cursor: 'pointer', transition: 'all 0.3s'
                  }} onClick={() => setCompletedWeeks(prev => isDone ? prev.filter(w => w !== week.week) : [...prev, week.week])}>
                    {isDone ? '✓' : `W${week.week}`}
                  </div>

                  {/* Content */}
                  <div className="card" style={{ flex: 1, borderColor: isDone ? 'rgba(0,255,136,0.2)' : `${color}33` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: color, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '1px', marginBottom: '4px' }}>WEEK {week.week}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700 }}>{week.title}</div>
                      </div>
                      {isDone && <span className="tag tag-strong">✅ Completed</span>}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: week.goal ? '12px' : 0 }}>
                      {week.topics.map((topic, j) => (
                        <div key={j} style={{
                          background: 'var(--bg-card2)', border: `1px solid ${color}33`,
                          borderRadius: '8px', padding: '6px 12px', fontSize: '13px',
                          color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                          <span style={{ color, fontSize: '10px' }}>●</span>
                          {topic}
                        </div>
                      ))}
                    </div>

                    {week.goal && (
                      <div style={{ background: `${color}11`, border: `1px solid ${color}22`, borderRadius: '8px', padding: '8px 12px', marginTop: '8px' }}>
                        <span style={{ fontSize: '12px', color: color, fontWeight: 600 }}>Goal: </span>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{week.goal}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Click on a week circle to mark it as completed
          </div>
        </div>
      )}
    </div>
  );
};

export default Roadmap;
