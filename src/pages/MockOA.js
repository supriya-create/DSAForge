import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const MockOA = () => {
  const { dsaProgress, generateMockOA, fetchLatestMockOA, leetcodeData } = useApp();
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

  const startTest = () => {
    setTestStarted(true);
    setTimeLeft(90 * 60);
    setTimerActive(true);
  };

  const companies = ['Amazon', 'Microsoft', 'Google', 'Walmart', 'Flipkart', 'Uber', 'Adobe', 'Infosys', 'TCS', 'Wipro'];
  const timerColor = timeLeft > 1800 ? 'var(--accent-green)' : timeLeft > 600 ? 'var(--accent-orange)' : 'var(--accent-pink)';

  return (
    <div className="animate-fadeIn">
      <div className="mb-28">
        <h1 className="section-title">📝 Mock OA Generator</h1>
        <p className="section-subtitle">Practice company-style online assessments with AI-generated problems</p>
      </div>

      {!leetcodeData ? (
        <div className="card text-center" style={{ padding: '50px 24px', border: '1px dashed var(--border-bright)' }}>
          <span style={{ fontSize: '44px', display: 'block', marginBottom: '14px' }}>📝</span>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
            Sync LeetCode ID to Generate Mock OA
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '480px', margin: '0 auto 16px' }}>
            Please sync your LeetCode profile in the Dashboard to practice company-style online assessments tailored to your weak topics.
          </p>
        </div>
      ) : (
        <>
          {/* Config Card */}
          <div className="card mb-24" style={{ borderColor: 'rgba(139, 92, 246, 0.25)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 800, marginBottom: '16px' }}>Configure OA</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="mb-6" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Company</label>
                <select value={company} onChange={e => setCompany(e.target.value)} className="input-field" style={{ padding: '10px 14px' }}>
                  {companies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-6" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Difficulty Level</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="input-field" style={{ padding: '10px 14px' }}>
                  {['Easy', 'Medium', 'Hard', 'Mixed'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-16" style={{ background: 'rgba(3,2,7,0.3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              📌 Will focus on your weak topics: <span style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>{weakTopics}</span>
            </div>
            <button className="btn-primary" onClick={generateOA} disabled={loading}>
              {loading ? (
                <>
                  <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block' }} />
                  Generating...
                </>
              ) : `📝 Generate ${company} OA`}
            </button>
          </div>
        </>
      )}

      {/* Problems */}
      {problems.length > 0 && !loading && (
        <div className="animate-fadeIn">
          {/* OA Header */}
          <div className="flex-row-between mb-20 flex-wrap gap-12" style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(0, 242, 254, 0.05))',
            border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '16px', padding: '20px 24px'
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800 }}>
                {company} Online Assessment
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                3 Problems · 90 Minutes · {difficulty} Difficulty
              </div>
            </div>
            <div className="flex-align-center" style={{ gap: '14px' }}>
              {testStarted && (
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 800,
                  color: timerColor, background: 'rgba(3,2,7,0.4)', padding: '8px 20px',
                  borderRadius: '12px', border: `1px solid ${timerColor}33`,
                  boxShadow: `0 0 15px ${timerColor}15`
                }}>
                  {formatTime(timeLeft)}
                </div>
              )}
              {!testStarted ? (
                <button className="btn-primary" onClick={startTest}>▶ Start Timer</button>
              ) : (
                <button onClick={() => setTimerActive(!timerActive)} className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '12px' }}>
                  {timerActive ? '⏸ Pause' : '▶ Resume'}
                </button>
              )}
            </div>
          </div>

          {/* Score summary if test started */}
          {testStarted && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div className="card" style={{ textAlign: 'center', padding: '18px' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-green)' }}>{solvedSet.length}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px' }}>Solved</div>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: '18px' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-orange)' }}>{problems.length - solvedSet.length}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px' }}>Remaining</div>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: '18px' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: timerColor }}>{formatTime(timeLeft)}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px' }}>Time Left</div>
              </div>
            </div>
          )}

          {/* Problem Cards */}
          <div className="flex-column" style={{ gap: '16px' }}>
            {problems.map((p, i) => {
              const isSolved = solvedSet.includes(i);
              const diffColor = p.difficulty === 'Easy' ? 'var(--accent-green)' : p.difficulty === 'Medium' ? 'var(--accent-orange)' : 'var(--accent-pink)';
              const cardGlow = p.difficulty === 'Easy' ? 'card-glow-green' : p.difficulty === 'Medium' ? 'card-glow-orange' : 'card-glow-pink';
              return (
                <div key={i} className={`card ${cardGlow}`} style={{
                  borderColor: isSolved ? 'var(--accent-green)' : 'var(--border)',
                  background: 'rgba(13, 11, 26, 0.35)', opacity: isSolved ? 0.65 : 1
                }}>
                  <div className="flex-row-between mb-12 flex-wrap gap-8" style={{ alignItems: 'flex-start' }}>
                    <div className="flex-align-center" style={{ gap: '12px' }}>
                      <span style={{
                        width: 34, height: 34, borderRadius: '8px', background: `${diffColor}12`,
                        border: `1px solid ${diffColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 800, color: diffColor, flexShrink: 0
                      }}>Q{i + 1}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, textDecoration: isSolved ? 'line-through' : 'none' }}>{p.title}</span>
                    </div>
                    <div className="flex-align-center" style={{ gap: '10px' }}>
                      <span className={`tag tag-${p.difficulty?.toLowerCase()}`}>{p.difficulty}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>⏱ {p.time}m</span>
                      {testStarted && (
                        <button onClick={() => setSolvedSet(prev => isSolved ? prev.filter(x => x !== i) : [...prev, i])} className="btn-ghost" style={{
                          borderColor: isSolved ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)',
                          color: isSolved ? 'var(--accent-green)' : 'var(--text-secondary)',
                          padding: '6px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                          background: isSolved ? 'rgba(16, 185, 129, 0.05)' : 'rgba(3,2,7,0.2)'
                        }}>{isSolved ? '✅ Solved' : 'Mark Solved'}</button>
                      )}
                    </div>
                  </div>
                  {p.topic && (
                    <div className="mb-10" style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                      📌 {p.topic}
                    </div>
                  )}
                  {p.description && (
                    <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '14px' }}>
                      {p.description}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    {p.constraints && (
                      <div style={{ background: 'rgba(3, 2, 7, 0.3)', borderRadius: '10px', padding: '10px 14px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.5px' }}>CONSTRAINTS</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{p.constraints}</div>
                      </div>
                    )}
                    {p.hint && (
                      <div style={{ background: 'rgba(0, 242, 254, 0.03)', borderRadius: '10px', padding: '10px 14px', border: '1px solid rgba(0, 242, 254, 0.15)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.5px' }}>💡 HINT</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{p.hint}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!problems.length && !loading && (
        <div className="text-center" style={{ padding: '80px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Select a company and generate your OA</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Practice realistic company-style assessments with timed challenges</div>
        </div>
      )}
    </div>
  );
};

export default MockOA;
