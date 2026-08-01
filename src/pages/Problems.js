import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import LeetCodeEmptyState from '../components/LeetCodeEmptyState';

const Problems = () => {
  const { dsaProgress, generateProblems: runGenerateProblems, fetchLatestProblems, leetcodeData } = useApp();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState('LeetCode');
  const [solvedProblems, setSolvedProblems] = useState([]);

  useEffect(() => {
    const loadLatestProblems = async () => {
      try {
        const response = await fetchLatestProblems();
        if (response && response.success && response.problems && response.problems.length > 0) {
          setProblems(response.problems);
        }
      } catch (err) {
        console.error('Failed to load latest recommended problems:', err);
      }
    };
    loadLatestProblems();
  }, [fetchLatestProblems]);

  const weakTopics = [...dsaProgress].sort((a, b) => (a.solved / a.total) - (b.solved / b.total)).slice(0, 3).map(t => t.topic).join(', ');

  const generateProblems = async () => {
    setLoading(true);
    setProblems([]);
    try {
      const response = await runGenerateProblems(platform, weakTopics);
      if (response && response.success && response.problems) {
        setProblems(response.problems);
      } else {
        throw new Error('Failed to recommend problems.');
      }
    } catch (err) {
      console.warn('Failed to fetch recommendations from backend, using simulated AI fallback:', err);
      await new Promise(r => setTimeout(r, 1500));
      const mockProblems = [
        { title: 'Two Sum', level: 'Easy', topic: 'Arrays', url: `https://${platform === 'LeetCode' ? 'leetcode.com/problems/two-sum' : 'www.geeksforgeeks.org/two-sum'}`, why: 'Classic foundation problem to warm up on arrays' },
        { title: 'Valid Parentheses', level: 'Easy', topic: 'Strings', url: `https://${platform === 'LeetCode' ? 'leetcode.com/problems/valid-parentheses' : 'www.geeksforgeeks.org/valid-parentheses'}`, why: 'Strengthen string and stack fundamentals' },
        { title: 'Binary Tree Level Order Traversal', level: 'Easy', topic: 'Trees', url: `https://${platform === 'LeetCode' ? 'leetcode.com/problems/binary-tree-level-order-traversal' : 'www.geeksforgeeks.org/level-order-traversal'}`, why: 'Important tree traversal pattern' },
        { title: 'Longest Substring Without Repeating Characters', level: 'Medium', topic: 'Strings', url: `https://${platform === 'LeetCode' ? 'leetcode.com/problems/longest-substring-without-repeating-characters' : 'www.geeksforgeeks.org/longest-substring-without-repeating'}`, why: 'Sliding window technique essential for interviews' },
        { title: 'Number of Islands', level: 'Medium', topic: 'Graphs', url: `https://${platform === 'LeetCode' ? 'leetcode.com/problems/number-of-islands' : 'www.geeksforgeeks.org/number-of-islands'}`, why: 'Graph traversal and DFS/BFS practice' },
        { title: 'Trapping Rain Water', level: 'Hard', topic: 'Dynamic Programming', url: `https://${platform === 'LeetCode' ? 'leetcode.com/problems/trapping-rain-water' : 'www.geeksforgeeks.org/trapping-rain-water'}`, why: 'Advanced problem to test optimization skills' }
      ];
      setProblems(mockProblems);
    }
    setLoading(false);
  };

  const getLevelColor = (level) => {
    if (level === 'Easy') return 'var(--accent-green)';
    if (level === 'Medium') return 'var(--accent-orange)';
    return 'var(--accent-pink)';
  };

  const easyProbs = problems.filter(p => p.level === 'Easy');
  const medProbs = problems.filter(p => p.level === 'Medium');
  const hardProbs = problems.filter(p => p.level === 'Hard');

  return (
    <div className="animate-fadeIn">
      <div className="mb-28">
        <h1 className="section-title">🎯 Problem Recommendations</h1>
        <p className="section-subtitle">AI-curated problems targeting your specific weak areas — no more random grinding</p>
      </div>

      {!leetcodeData ? (
        <LeetCodeEmptyState
          icon="🎯"
          title="Sync LeetCode ID to Get Problem Recommendations"
          subtitle="Please sync your LeetCode profile in the Dashboard to allow the AI to target your weak spots and recommend the most impactful problems."
        />
      ) : (
        <>
          {/* Config */}
          <div className="card mb-24" style={{ borderColor: 'rgba(0, 242, 254, 0.25)' }}>
            <div className="flex-row-between flex-wrap gap-16">
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 800 }}>Smart Problem Picker</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Gets 3 Easy + 2 Medium + 1 Hard problems matched to your weak spots
                </div>
              </div>
              <div className="flex-align-center flex-wrap" style={{ gap: '14px' }}>
                <div className="flex-align-center" style={{ gap: '6px' }}>
                  {['LeetCode', 'GeeksForGeeks'].map(p => (
                    <button key={p} onClick={() => setPlatform(p)} style={{
                      padding: '10px 18px', borderRadius: '10px', border: '1px solid',
                      borderColor: platform === p ? 'var(--accent-cyan)' : 'var(--border)',
                      background: platform === p ? 'rgba(0, 242, 254, 0.08)' : 'rgba(3,2,7,0.3)',
                      color: platform === p ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-body)',
                      transition: 'all 0.25s'
                    }}>{p}</button>
                  ))}
                </div>
                <button className="btn-primary" onClick={generateProblems} disabled={loading}>
                  {loading ? (
                    <>
                      <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block' }} />
                      Loading...
                    </>
                  ) : '🎯 Get Recommendations'}
                </button>
              </div>
            </div>
          </div>

          {/* Distribution */}
          {problems.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Easy', count: easyProbs.length, target: 3, color: 'var(--accent-green)', tagClass: 'tag-easy' },
                { label: 'Medium', count: medProbs.length, target: 2, color: 'var(--accent-orange)', tagClass: 'tag-medium' },
                { label: 'Hard', count: hardProbs.length, target: 1, color: 'var(--accent-pink)', tagClass: 'tag-hard' },
              ].map(d => (
                <div key={d.label} className="card text-center" style={{ borderColor: `${d.color}25` }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, color: d.color }}>{d.count}</div>
                  <div className={`tag ${d.tagClass} mt-6`}>{d.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>target: {d.target}</div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!problems.length && !loading && (
            <div className="text-center" style={{ padding: '80px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Ready to find your problems</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
                The AI will analyze your weak topics and recommend the most impactful problems to solve next
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center" style={{ padding: '60px' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
              <div style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '15px', fontWeight: 600 }}>Searching for perfect problems...</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Analyzing your weak areas and finding targeted problems</div>
            </div>
          )}
        </>
      )}

      {/* Problems List */}
      {problems.length > 0 && !loading && (
        <div className="animate-fadeIn flex-column" style={{ gap: '14px' }}>
          {problems.map((p, i) => {
            const isSolved = solvedProblems.includes(i);
            const cardGlow = p.level === 'Easy' ? 'card-glow-green' : p.level === 'Medium' ? 'card-glow-orange' : 'card-glow-pink';
            return (
              <div key={i} className={`card card-interactive ${cardGlow}`} style={{
                opacity: isSolved ? 0.65 : 1, transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                borderColor: isSolved ? 'var(--accent-green)' : 'var(--border)',
                background: 'rgba(13, 11, 26, 0.35)'
              }}>
                <div className="flex-row-between flex-wrap gap-16" style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div className="flex-align-center mb-8 flex-wrap" style={{ gap: '10px' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)',
                        background: 'rgba(3,2,7,0.3)', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border)'
                      }}>#{i + 1}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, textDecoration: isSolved ? 'line-through' : 'none' }}>{p.title}</span>
                      <span className={`tag tag-${p.level?.toLowerCase()}`}>{p.level}</span>
                      <span style={{
                        fontSize: '11px', color: 'var(--accent-purple)', background: 'rgba(124,58,237,0.08)',
                        padding: '4px 10px', borderRadius: '99px', border: '1px solid rgba(124,58,237,0.15)',
                        fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)'
                      }}>{p.topic}</span>
                    </div>
                    {p.why && (
                      <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '4px', lineHeight: '1.5' }}>
                        💡 {p.why}
                      </div>
                    )}
                  </div>
                  <div className="flex-align-center" style={{ gap: '10px', flexShrink: 0 }}>
                    {p.url && p.url !== '#' && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{
                        color: 'var(--accent-cyan)', borderColor: 'rgba(0, 242, 254, 0.2)',
                        padding: '8px 16px', borderRadius: '10px', fontWeight: 700, textDecoration: 'none',
                        background: 'rgba(0, 242, 254, 0.03)'
                      }}>Solve →</a>
                    )}
                    <button onClick={() => setSolvedProblems(prev => isSolved ? prev.filter(x => x !== i) : [...prev, i])} className="btn-ghost" style={{
                      borderColor: isSolved ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)',
                      color: isSolved ? 'var(--accent-green)' : 'var(--text-secondary)',
                      padding: '8px 16px', borderRadius: '10px', fontWeight: 700,
                      background: isSolved ? 'rgba(16, 185, 129, 0.05)' : 'rgba(3,2,7,0.2)'
                    }}>{isSolved ? '✅ Done' : 'Mark Done'}</button>
                  </div>
                </div>
              </div>
            );
          })}
          {solvedProblems.length > 0 && (
            <div className="text-center mt-12" style={{ color: 'var(--accent-green)', fontSize: '14.5px', fontWeight: 600 }}>
              🎉 {solvedProblems.length} problem{solvedProblems.length > 1 ? 's' : ''} solved! Great work!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Problems;
