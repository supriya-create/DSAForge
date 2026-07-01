import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const PROBLEMS_PROMPT = (progress, platform) => `You are a DSA coach recommending problems for a student preparing for placements.

Student's DSA progress:
${progress.map(t => `- ${t.topic}: ${Math.round((t.solved/t.total)*100)}% complete (${t.solved} solved)`).join('\n')}

Recommend exactly 6 problems from ${platform}: 3 Easy, 2 Medium, 1 Hard.
Focus on their weakest topics (lowest completion %).

For each problem, respond in this EXACT format (no extra text):
PROBLEM: [Problem Title]
LEVEL: [Easy/Medium/Hard]
TOPIC: [Topic Name]
URL: [${platform === 'LeetCode' ? 'https://leetcode.com/problems/problem-name' : 'https://www.geeksforgeeks.org/problem-name'}]
WHY: [One sentence explaining why this problem is recommended for them]
---

Recommend exactly 6 problems following this format strictly.`;

const Problems = () => {
  const { dsaProgress, generateProblems: runGenerateProblems, fetchLatestProblems } = useApp();
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

  const parseProblems = (text) => {
    const blocks = text.split('---').filter(b => b.trim());
    return blocks.map(block => {
      const get = (key) => block.match(new RegExp(`${key}:\\s*(.+)`, 'i'))?.[1]?.trim() || '';
      return { title: get('PROBLEM'), level: get('LEVEL'), topic: get('TOPIC'), url: get('URL'), why: get('WHY') };
    }).filter(p => p.title);
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
      <div style={{ marginBottom: '28px' }}>
        <h1 className="section-title">🎯 Problem Recommendations</h1>
        <p className="section-subtitle">AI-curated problems targeting your specific weak areas — no more random grinding</p>
      </div>

      {/* Config */}
      <div className="card" style={{ marginBottom: '24px', borderColor: 'rgba(0,212,255,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700 }}>Smart Problem Picker</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Gets 3 Easy + 2 Medium + 1 Hard problems matched to your weak spots
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['LeetCode', 'GeeksForGeeks'].map(p => (
                <button key={p} onClick={() => setPlatform(p)} style={{
                  padding: '8px 16px', borderRadius: '8px', border: '1px solid',
                  borderColor: platform === p ? 'var(--accent-cyan)' : 'var(--border)',
                  background: platform === p ? 'rgba(0,212,255,0.1)' : 'transparent',
                  color: platform === p ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-body)'
                }}>{p}</button>
              ))}
            </div>
            <button className="btn-primary" onClick={generateProblems} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {loading ? <><span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />Loading...</> : '🎯 Get Recommendations'}
            </button>
          </div>
        </div>
      </div>

      {/* Distribution */}
      {problems.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Easy', count: easyProbs.length, target: 3, color: 'var(--accent-green)' },
            { label: 'Medium', count: medProbs.length, target: 2, color: 'var(--accent-orange)' },
            { label: 'Hard', count: hardProbs.length, target: 1, color: 'var(--accent-pink)' },
          ].map(d => (
            <div key={d.label} className="card" style={{ textAlign: 'center', borderColor: `${d.color}33` }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, color: d.color }}>{d.count}</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: d.color }}>{d.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>problems</div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!problems.length && !loading && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Ready to find your problems</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            The AI will analyze your weak topics and recommend the most impactful problems to solve next
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Searching for perfect problems...</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Analyzing your weak areas and finding targeted problems</div>
        </div>
      )}

      {/* Problems List */}
      {problems.length > 0 && !loading && (
        <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {problems.map((p, i) => {
            const isSolved = solvedProblems.includes(i);
            return (
              <div key={i} className="card" style={{
                borderColor: isSolved ? 'rgba(0,255,136,0.3)' : 'var(--border)',
                opacity: isSolved ? 0.7 : 1, transition: 'all 0.3s'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)',
                        background: 'var(--bg-card2)', padding: '2px 8px', borderRadius: '4px'
                      }}>#{i + 1}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, textDecoration: isSolved ? 'line-through' : 'none' }}>{p.title}</span>
                      <span className={`tag tag-${p.level?.toLowerCase()}`}>{p.level}</span>
                      <span style={{
                        fontSize: '12px', color: 'var(--accent-purple)', background: 'rgba(124,58,237,0.1)',
                        padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(124,58,237,0.2)'
                      }}>{p.topic}</span>
                    </div>
                    {p.why && (
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontStyle: 'italic' }}>
                        💡 {p.why}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {p.url && p.url !== '#' && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" style={{
                        background: 'var(--bg-card2)', border: '1px solid var(--border)',
                        color: 'var(--accent-cyan)', padding: '6px 14px', borderRadius: '8px',
                        fontSize: '13px', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s'
                      }}>Solve →</a>
                    )}
                    <button onClick={() => setSolvedProblems(prev => isSolved ? prev.filter(x => x !== i) : [...prev, i])} style={{
                      background: isSolved ? 'rgba(0,255,136,0.15)' : 'var(--bg-card2)',
                      border: `1px solid ${isSolved ? 'var(--accent-green)' : 'var(--border)'}`,
                      color: isSolved ? 'var(--accent-green)' : 'var(--text-secondary)',
                      padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
                      fontSize: '13px', fontFamily: 'var(--font-body)'
                    }}>{isSolved ? '✅ Done' : 'Mark Done'}</button>
                  </div>
                </div>
              </div>
            );
          })}
          {solvedProblems.length > 0 && (
            <div style={{ textAlign: 'center', padding: '12px', color: 'var(--accent-green)', fontSize: '14px' }}>
              🎉 {solvedProblems.length} problem{solvedProblems.length > 1 ? 's' : ''} solved! Great work!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Problems;
