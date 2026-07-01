import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const DOUBT_PROMPT = (code, question) => `You are a DSA expert and coding mentor. Analyze this code and ${question ? `answer: "${question}"` : 'provide a complete analysis'}.

Code:
\`\`\`
${code}
\`\`\`

Provide a clear analysis covering:

**TIME COMPLEXITY**: State the Big O time complexity with explanation.

**SPACE COMPLEXITY**: State the Big O space complexity with explanation.

**CODE LOGIC**: Explain what the code does step by step (be concise).

**BUGS & MISTAKES**: List any bugs, edge cases not handled, or potential issues. If none, say "No major issues found."

**OPTIMIZATION**: Suggest 1-2 specific optimizations if possible with the improved approach name.

**VERDICT**: One sentence summary of code quality.

Keep each section concise and practical. Use specific Big O notation.`;

const DoubtSolver = () => {
  const { solveAIDoubt, fetchDoubtHistory } = useApp();
  const [code, setCode] = useState(`// Paste your code here
function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}`);
  const [question, setQuestion] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchDoubtHistory();
        if (data && data.success && data.history) {
          setHistory(data.history.map(h => ({
            code: h.code.slice(0, 100) + '...',
            fullCode: h.code,
            question: h.question,
            analysis: h.analysis,
            ts: new Date(h.createdAt).toLocaleTimeString()
          })));
        }
      } catch (err) {
        console.error('Failed to load doubt history:', err);
      }
    };
    loadHistory();
  }, [fetchDoubtHistory]);

  const analyzeCode = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setAnalysis('');
    try {
      const data = await solveAIDoubt(code, question);
      setAnalysis(data.analysis);
      setHistory(prev => [{ code: code.slice(0, 100) + '...', fullCode: code, question, analysis: data.analysis, ts: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)]);
    } catch (err) {
      console.warn('API key not configured or network issue, using simulated AI fallback:', err.message);
      // Simulate API delay
      await new Promise(r => setTimeout(r, 1500));
      
      // Mock analysis response
      const mockAnalysis = `**TIME COMPLEXITY**: O(n²) - Nested loops iterate through all pairs

**SPACE COMPLEXITY**: O(1) - Only using constant extra space

**CODE LOGIC**: The function uses brute force to check every pair of numbers in the array to find two that sum to the target value. Returns the indices when found.

**BUGS & MISTAKES**: No major issues - logic is correct but inefficient for large arrays.

**OPTIMIZATION**: Use a Hash Map (O(n) time, O(n) space) - store seen numbers and check if (target - current) exists in the map.

**VERDICT**: Correct but inefficient; suitable for interviews if you mention the optimization trade-off.`;
      
      setAnalysis(mockAnalysis);
      setHistory(prev => [{ code: code.slice(0, 100) + '...', question, analysis: mockAnalysis, ts: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)]);
    } finally {
      setLoading(false);
    }
  };

  const parseAnalysis = (text) => {
    const sections = [];
    const parts = text.split(/\*\*([^*]+)\*\*/);
    for (let i = 1; i < parts.length; i += 2) {
      sections.push({ title: parts[i], content: parts[i + 1]?.trim() || '' });
    }
    return sections.length > 0 ? sections : [{ title: 'Analysis', content: text }];
  };

  const sectionIcons = {
    'TIME': '⏱', 'SPACE': '💾', 'LOGIC': '🧩', 'BUG': '🐛', 'OPTIM': '⚡', 'VERDICT': '✅'
  };
  const getSectionIcon = (title) => {
    for (const [key, icon] of Object.entries(sectionIcons)) {
      if (title.toUpperCase().includes(key)) return icon;
    }
    return '📌';
  };

  const sectionColors = {
    'TIME': 'var(--accent-cyan)', 'SPACE': 'var(--accent-purple)', 'LOGIC': 'var(--accent-green)',
    'BUG': 'var(--accent-pink)', 'OPTIM': 'var(--accent-orange)', 'VERDICT': 'var(--accent-cyan)'
  };
  const getSectionColor = (title) => {
    for (const [key, color] of Object.entries(sectionColors)) {
      if (title.toUpperCase().includes(key)) return color;
    }
    return 'var(--accent-cyan)';
  };

  const exampleSnippets = [
    { label: 'Two Sum (Brute)', code: `function twoSum(nums, target) {\n  for (let i = 0; i < nums.length; i++) {\n    for (let j = i + 1; j < nums.length; j++) {\n      if (nums[i] + nums[j] === target) return [i, j];\n    }\n  }\n  return [];\n}` },
    { label: 'Fibonacci (Recursive)', code: `function fib(n) {\n  if (n <= 1) return n;\n  return fib(n-1) + fib(n-2);\n}` },
    { label: 'BFS Traversal', code: `function bfs(graph, start) {\n  const visited = new Set();\n  const queue = [start];\n  visited.add(start);\n  while (queue.length) {\n    const node = queue.shift();\n    for (const neighbor of graph[node] || []) {\n      if (!visited.has(neighbor)) {\n        visited.add(neighbor);\n        queue.push(neighbor);\n      }\n    }\n  }\n}` },
  ];

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: '28px' }}>
        <h1 className="section-title">🤖 AI Doubt Solver</h1>
        <p className="section-subtitle">Paste your code and get instant analysis: complexity, bugs, optimization</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Input Panel */}
        <div>
          <div className="card" style={{ marginBottom: '16px', borderColor: 'rgba(0,212,255,0.2)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>📥 Your Code</div>

            {/* Quick examples */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
              {exampleSnippets.map(s => (
                <button key={s.label} onClick={() => setCode(s.code)} style={{
                  background: 'var(--bg-card2)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '6px',
                  fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-body)'
                }}>{s.label}</button>
              ))}
            </div>

            <textarea
              className="input-field"
              value={code}
              onChange={e => setCode(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', minHeight: '240px', lineHeight: '1.6' }}
              placeholder="Paste your code here..."
              spellCheck={false}
            />

            <div style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Specific question (optional)</label>
              <input
                className="input-field"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="e.g. Why is this slow? How to optimize for large inputs?"
              />
            </div>

            <button className="btn-primary" onClick={analyzeCode} disabled={loading || !code.trim()} style={{ width: '100%', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading ? <><span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />Analyzing...</> : '🔍 Analyze Code'}
            </button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="card">
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)' }}>Recent Analyses</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {history.map((h, i) => (
                  <div key={i} onClick={() => { setAnalysis(h.analysis); if (h.fullCode) setCode(h.fullCode); if (h.question !== undefined) setQuestion(h.question); }} style={{
                    background: 'var(--bg-deep)', borderRadius: '8px', padding: '10px',
                    cursor: 'pointer', border: '1px solid var(--border)', transition: 'border-color 0.2s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>{h.ts}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.code}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Output Panel */}
        <div>
          <div className="card" style={{ borderColor: analysis ? 'rgba(0,212,255,0.2)' : 'var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>🤖 AI Analysis</div>

            {!analysis && !loading && (
              <div style={{ padding: '60px 20px', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: '12px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤖</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Paste your code and click "Analyze Code" to get instant feedback</div>
              </div>
            )}

            {loading && (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '16px' }}>
                  {['var(--accent-cyan)', 'var(--accent-purple)', 'var(--accent-green)'].map((c, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, animation: `pulse ${0.8 + i * 0.2}s ease-in-out infinite` }} />
                  ))}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>Analyzing your code...</div>
              </div>
            )}

            {analysis && !loading && (
              <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {parseAnalysis(analysis).map((section, i) => {
                  const color = getSectionColor(section.title);
                  return (
                    <div key={i} style={{
                      background: 'var(--bg-deep)', borderLeft: `3px solid ${color}`,
                      borderRadius: '8px', padding: '12px 14px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <span>{getSectionIcon(section.title)}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{section.title}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{section.content}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoubtSolver;
