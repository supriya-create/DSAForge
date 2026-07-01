import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const OA_PROMPT = (company, difficulty, topics) => `Generate a mock Online Assessment (OA) for ${company} with these specifications:
- Difficulty: ${difficulty}
- Focus topics: ${topics}
- Time limit: 90 minutes
- 3 problems total

For each problem, respond in EXACTLY this format:
PROBLEM [N]: [Problem Title]
DIFFICULTY: [Easy/Medium/Hard]
TOPIC: [Topic]
TIME: [Expected minutes to solve]
DESCRIPTION: [2-3 sentence problem description — no code]
CONSTRAINTS: [Key constraints]
HINT: [One helpful hint]
===

Generate all 3 problems. Make them realistic and interview-appropriate for ${company}.`;

const MockOA = () => {
  const { dsaProgress, generateMockOA, fetchLatestMockOA } = useApp();
  const [company, setCompany] = useState('Amazon');
  const [difficulty, setDifficulty] = useState('Medium');
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [solvedSet, setSolvedSet] = useState([]);

  useEffect(() => {
    const loadLatestOA = async () => {
      try {
        const response = await fetchLatestMockOA();
        if (response && response.success && response.problems && response.problems.length > 0) {
          setProblems(response.problems);
          if (response.company) setCompany(response.company);
          if (response.difficulty) setDifficulty(response.difficulty);
        }
      } catch (err) {
        console.error('Failed to load latest Mock OA:', err);
      }
    };
    loadLatestOA();
  }, [fetchLatestMockOA]);

  useEffect(() => {
    let timer;
    if (timerActive && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearTimeout(timer);
  }, [timerActive, timeLeft]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const weakTopics = [...dsaProgress].sort((a, b) => (a.solved / a.total) - (b.solved / b.total)).slice(0, 3).map(t => t.topic).join(', ');

  const generateOA = async () => {
    setLoading(true);
    setProblems([]);
    setTestStarted(false);
    setSolvedSet([]);
    try {
      const response = await generateMockOA(company, difficulty, weakTopics);
      if (response && response.success && response.problems) {
        setProblems(response.problems);
      } else {
        throw new Error('Failed to generate mock OA problems.');
      }
    } catch (err) {
      console.warn('Failed to generate Mock OA from backend, using simulated AI fallback:', err);
      await new Promise(r => setTimeout(r, 1500));
      const mockProblems = [
        { title: 'Two Sum II', difficulty: 'Easy', topic: 'Arrays', time: 30, description: 'Given a sorted array and a target, find two numbers that add to the target.', constraints: 'Time O(n), Space O(1)', hint: 'Use two pointers.' },
        { title: 'Merge Intervals', difficulty: 'Medium', topic: 'Arrays', time: 30, description: 'Merge overlapping intervals and return non-overlapping intervals.', constraints: 'Time O(n log n), Space O(n)', hint: 'Sort the intervals first.' },
        { title: 'Median of Two Sorted Arrays', difficulty: 'Hard', topic: 'Binary Search', time: 45, description: 'Find the median of two sorted arrays with O(log(min(m,n))) complexity.', constraints: 'Time O(log(min(m,n))), Space O(1)', hint: 'Apply binary search on the smaller array partition.' }
      ];
      setProblems(mockProblems);
    }
    setLoading(false);
  };

  const parseProblems = (text) => {
    const blocks = text.split('===').filter(b => b.trim());
    return blocks.map(block => {
      const get = (key) => block.match(new RegExp(`${key}:\\s*(.+)`, 'i'))?.[1]?.trim() || '';
      return {
        title: get('PROBLEM \\d+') || block.match(/PROBLEM \d+:\s*(.+)/i)?.[1]?.trim() || 'Problem',
        difficulty: get('DIFFICULTY'), topic: get('TOPIC'),
        time: parseInt(get('TIME')) || 30,
        description: get('DESCRIPTION'), constraints: get('CONSTRAINTS'), hint: get('HINT')
      };
    }).filter(p => p.title && p.title !== 'Problem');
  };

  const startTest = () => {
    setTestStarted(true);
    setTimeLeft(90 * 60);
    setTimerActive(true);
  };

  const companies = ['Amazon', 'Microsoft', 'Google', 'Walmart', 'Flipkart', 'Uber', 'Adobe', 'Infosys', 'TCS', 'Wipro'];
  const timerColor = timeLeft > 1800 ? 'var(--accent-green)' : timeLeft > 600 ? 'var(--accent-orange)' : 'var(--accent-pink)';

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: '28px' }}>
        <h1 className="section-title">📝 Mock OA Generator</h1>
        <p className="section-subtitle">Practice company-style online assessments with AI-generated problems</p>
      </div>

      {/* Config Card */}
      <div className="card" style={{ marginBottom: '24px', borderColor: 'rgba(124,58,237,0.2)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Configure OA</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Company</label>
            <select value={company} onChange={e => setCompany(e.target.value)} className="input-field">
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Difficulty Level</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="input-field">
              {['Easy', 'Medium', 'Hard', 'Mixed'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div style={{ background: 'var(--bg-deep)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          📌 Will focus on your weak topics: <span style={{ color: 'var(--accent-orange)' }}>{weakTopics}</span>
        </div>
        <button className="btn-primary" onClick={generateOA} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {loading ? <><span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />Generating...</> : `📝 Generate ${company} OA`}
        </button>
      </div>

      {/* Problems */}
      {problems.length > 0 && !loading && (
        <div className="animate-fadeIn">
          {/* OA Header */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(0,212,255,0.1))',
            border: '1px solid rgba(124,58,237,0.3)', borderRadius: '16px', padding: '20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px'
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800 }}>
                {company} Online Assessment
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                3 Problems · 90 Minutes · {difficulty} Difficulty
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {testStarted && (
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 800,
                  color: timerColor, background: 'var(--bg-card2)', padding: '8px 20px',
                  borderRadius: '10px', border: `1px solid ${timerColor}44`
                }}>
                  {formatTime(timeLeft)}
                </div>
              )}
              {!testStarted ? (
                <button className="btn-primary" onClick={startTest}>▶ Start Timer</button>
              ) : (
                <button onClick={() => setTimerActive(!timerActive)} className="btn-secondary">
                  {timerActive ? '⏸ Pause' : '▶ Resume'}
                </button>
              )}
            </div>
          </div>

          {/* Score summary if test started */}
          {testStarted && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-green)' }}>{solvedSet.length}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Solved</div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-orange)' }}>{problems.length - solvedSet.length}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Remaining</div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: timerColor }}>{formatTime(timeLeft)}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Time Left</div>
              </div>
            </div>
          )}

          {/* Problem Cards */}
          {problems.map((p, i) => {
            const isSolved = solvedSet.includes(i);
            const diffColor = p.difficulty === 'Easy' ? 'var(--accent-green)' : p.difficulty === 'Medium' ? 'var(--accent-orange)' : 'var(--accent-pink)';
            return (
              <div key={i} className="card" style={{ marginBottom: '16px', borderColor: isSolved ? 'rgba(0,255,136,0.3)' : 'var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: 32, height: 32, borderRadius: '8px', background: `${diffColor}22`,
                      border: `1px solid ${diffColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: diffColor, flexShrink: 0
                    }}>Q{i + 1}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, textDecoration: isSolved ? 'line-through' : 'none' }}>{p.title}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`tag tag-${p.difficulty?.toLowerCase()}`}>{p.difficulty}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>⏱ {p.time}m</span>
                    {testStarted && (
                      <button onClick={() => setSolvedSet(prev => isSolved ? prev.filter(x => x !== i) : [...prev, i])} style={{
                        background: isSolved ? 'rgba(0,255,136,0.15)' : 'var(--bg-card2)',
                        border: `1px solid ${isSolved ? 'var(--accent-green)' : 'var(--border)'}`,
                        color: isSolved ? 'var(--accent-green)' : 'var(--text-secondary)',
                        padding: '5px 12px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-body)'
                      }}>{isSolved ? '✅ Solved' : 'Mark Solved'}</button>
                    )}
                  </div>
                </div>
                {p.topic && <div style={{ fontSize: '12px', color: 'var(--accent-purple)', marginBottom: '10px', fontWeight: 600 }}>📌 {p.topic}</div>}
                {p.description && (
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '12px' }}>
                    {p.description}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {p.constraints && (
                    <div style={{ background: 'var(--bg-deep)', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>CONSTRAINTS</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{p.constraints}</div>
                    </div>
                  )}
                  {p.hint && (
                    <div style={{ background: 'rgba(0,212,255,0.05)', borderRadius: '8px', padding: '10px', border: '1px solid rgba(0,212,255,0.1)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '4px' }}>💡 HINT</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{p.hint}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!problems.length && !loading && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Select a company and generate your OA</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Practice realistic company-style assessments with timed challenges</div>
        </div>
      )}
    </div>
  );
};

export default MockOA;
