import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const DSATracker = () => {
  const { dsaProgress, updateProgress, addTopic } = useApp();
  const [editingTopic, setEditingTopic] = useState(null);
  const [editVals, setEditVals] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newTopic, setNewTopic] = useState({ topic: '', solved: 0, easy: 0, medium: 0, hard: 0, total: 50 });

  const startEdit = (t) => {
    setEditingTopic(t.topic);
    setEditVals({ solved: t.solved, easy: t.easy, medium: t.medium, hard: t.hard, total: t.total });
  };

  const saveEdit = (topicName) => {
    updateProgress(topicName, editVals);
    setEditingTopic(null);
  };

  const handleAdd = () => {
    if (!newTopic.topic.trim()) return;
    addTopic({ ...newTopic, solved: parseInt(newTopic.solved) || 0, easy: parseInt(newTopic.easy) || 0, medium: parseInt(newTopic.medium) || 0, hard: parseInt(newTopic.hard) || 0, total: parseInt(newTopic.total) || 50 });
    setNewTopic({ topic: '', solved: 0, easy: 0, medium: 0, hard: 0, total: 50 });
    setShowAdd(false);
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex-row-between mb-28 flex-wrap gap-16">
        <div>
          <h1 className="section-title">DSA Progress Tracker</h1>
          <p className="section-subtitle">Track your problem-solving progress across all DSA topics</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
          + Add Topic
        </button>
      </div>

      {/* Add Topic Form */}
      {showAdd && (
        <div className="card animate-fadeIn mb-24" style={{ borderColor: 'rgba(0, 242, 254, 0.25)' }}>
          <div className="mb-16" style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800 }}>Add New Topic</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '14px', alignItems: 'end' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="mb-6" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Topic Name</label>
              <input className="input-field" placeholder="e.g. Tries" value={newTopic.topic} onChange={e => setNewTopic({ ...newTopic, topic: e.target.value })} />
            </div>
            {['solved', 'easy', 'medium', 'hard', 'total'].map(f => (
              <div key={f}>
                <label className="mb-6" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', textTransform: 'capitalize', fontWeight: 600 }}>{f}</label>
                <input className="input-field" type="number" min="0" value={newTopic[f]} onChange={e => setNewTopic({ ...newTopic, [f]: e.target.value })} />
              </div>
            ))}
          </div>
          <div className="flex-align-center mt-20" style={{ gap: '12px' }}>
            <button className="btn-primary" onClick={handleAdd}>Add Topic</button>
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Stats summary */}
      <div className="stats-grid mb-28">
        {[
          { label: 'Total Problems', value: dsaProgress.reduce((s, t) => s + t.solved, 0), color: 'var(--accent-cyan)', glow: 'card-glow-cyan' },
          { label: 'Easy Solved', value: dsaProgress.reduce((s, t) => s + t.easy, 0), color: 'var(--accent-green)', glow: 'card-glow-green' },
          { label: 'Medium Solved', value: dsaProgress.reduce((s, t) => s + t.medium, 0), color: 'var(--accent-orange)', glow: 'card-glow-orange' },
          { label: 'Hard Solved', value: dsaProgress.reduce((s, t) => s + t.hard, 0), color: 'var(--accent-pink)', glow: 'card-glow-pink' },
        ].map(s => (
          <div key={s.label} className={`card text-center ${s.glow}`} style={{ padding: '20px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '6px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Topic Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {dsaProgress.map((t) => {
          const pct = Math.round((t.solved / t.total) * 100);
          const level = pct >= 70 ? 'strong' : pct >= 40 ? 'moderate' : 'weak';
          const isEditing = editingTopic === t.topic;
          const cardGlow = pct >= 70 ? 'card-glow-green' : pct >= 40 ? 'card-glow-orange' : 'card-glow-pink';

          return (
            <div key={t.topic} className={`card ${cardGlow}`} style={{
              borderColor: isEditing ? 'var(--accent-cyan)' : 'var(--border)',
              background: 'rgba(13, 11, 26, 0.35)'
            }}>
              <div className="flex-row-between mb-16" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 800 }}>{t.topic}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>{t.total} total problems</div>
                </div>
                <div className="flex-align-center" style={{ gap: '8px' }}>
                  <span className={`tag tag-${level}`}>{level}</span>
                  {!isEditing ? (
                    <button onClick={() => startEdit(t)} className="btn-ghost" style={{
                      padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase'
                    }}>Edit</button>
                  ) : (
                    <button onClick={() => saveEdit(t.topic)} className="btn-primary" style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '8px', fontWeight: 700 }}>Save</button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-20">
                <div className="flex-row-between mb-6">
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Completion</span>
                  <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: pct >= 70 ? 'var(--accent-green)' : pct >= 40 ? 'var(--accent-orange)' : 'var(--accent-pink)' }}>{pct}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${pct}%`,
                    background: pct >= 70 ? 'linear-gradient(90deg, var(--accent-green), #059669)'
                      : pct >= 40 ? 'linear-gradient(90deg, var(--accent-orange), #d97706)'
                        : 'linear-gradient(90deg, var(--accent-pink), #dc2626)'
                  }} />
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[
                  { label: 'Solved', field: 'solved', color: 'var(--accent-cyan)' },
                  { label: 'Easy', field: 'easy', color: 'var(--accent-green)' },
                  { label: 'Medium', field: 'medium', color: 'var(--accent-orange)' },
                  { label: 'Hard', field: 'hard', color: 'var(--accent-pink)' },
                ].map(({ label, field, color }) => (
                  <div key={field} style={{ background: 'rgba(3, 2, 7, 0.3)', borderRadius: '10px', padding: '8px', textAlign: 'center', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.3px' }}>{label}</div>
                    {isEditing ? (
                      <input type="number" min="0" value={editVals[field]}
                        onChange={e => setEditVals({ ...editVals, [field]: e.target.value })}
                        style={{
                          width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-bright)',
                          color: color, textAlign: 'center', borderRadius: '6px', padding: '2px',
                          fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, outline: 'none'
                        }} />
                    ) : (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color }}>{t[field]}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DSATracker;
