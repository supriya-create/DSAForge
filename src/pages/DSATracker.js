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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
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
        <div className="card animate-fadeIn" style={{ marginBottom: '20px', borderColor: 'rgba(0,212,255,0.3)' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Add New Topic</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Topic Name</label>
              <input className="input-field" placeholder="e.g. Tries" value={newTopic.topic} onChange={e => setNewTopic({ ...newTopic, topic: e.target.value })} />
            </div>
            {['solved', 'easy', 'medium', 'hard', 'total'].map(f => (
              <div key={f}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'capitalize' }}>{f}</label>
                <input className="input-field" type="number" min="0" value={newTopic[f]} onChange={e => setNewTopic({ ...newTopic, [f]: e.target.value })} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button className="btn-primary" onClick={handleAdd}>Add Topic</button>
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Stats summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Problems', value: dsaProgress.reduce((s, t) => s + t.solved, 0), color: 'var(--accent-cyan)' },
          { label: 'Easy Solved', value: dsaProgress.reduce((s, t) => s + t.easy, 0), color: 'var(--accent-green)' },
          { label: 'Medium Solved', value: dsaProgress.reduce((s, t) => s + t.medium, 0), color: 'var(--accent-orange)' },
          { label: 'Hard Solved', value: dsaProgress.reduce((s, t) => s + t.hard, 0), color: 'var(--accent-pink)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Topic Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {dsaProgress.map((t) => {
          const pct = Math.round((t.solved / t.total) * 100);
          const level = pct >= 70 ? 'strong' : pct >= 40 ? 'moderate' : 'weak';
          const isEditing = editingTopic === t.topic;

          return (
            <div key={t.topic} className="card" style={{
              borderColor: isEditing ? 'rgba(0,212,255,0.4)' : 'var(--border)',
              transition: 'all 0.3s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700 }}>{t.topic}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.total} total problems</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`tag tag-${level}`}>{level}</span>
                  {!isEditing ? (
                    <button onClick={() => startEdit(t)} style={{
                      background: 'var(--bg-card2)', border: '1px solid var(--border)',
                      color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '6px',
                      fontSize: '12px', cursor: 'pointer'
                    }}>Edit</button>
                  ) : (
                    <button onClick={() => saveEdit(t.topic)} className="btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }}>Save</button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Completion</span>
                  <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: pct >= 70 ? 'var(--accent-green)' : pct >= 40 ? 'var(--accent-orange)' : 'var(--accent-pink)' }}>{pct}%</span>
                </div>
                <div className="progress-bar" style={{ height: 8 }}>
                  <div className="progress-fill" style={{
                    width: `${pct}%`,
                    background: pct >= 70 ? 'linear-gradient(90deg,var(--accent-green),#00aa55)'
                      : pct >= 40 ? 'linear-gradient(90deg,var(--accent-orange),#cc5500)'
                        : 'linear-gradient(90deg,var(--accent-pink),#cc0055)'
                  }} />
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[
                  { label: 'Total', field: 'solved', color: 'var(--accent-cyan)' },
                  { label: 'Easy', field: 'easy', color: 'var(--accent-green)' },
                  { label: 'Medium', field: 'medium', color: 'var(--accent-orange)' },
                  { label: 'Hard', field: 'hard', color: 'var(--accent-pink)' },
                ].map(({ label, field, color }) => (
                  <div key={field} style={{ background: 'var(--bg-card2)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
                    {isEditing ? (
                      <input type="number" min="0" value={editVals[field]}
                        onChange={e => setEditVals({ ...editVals, [field]: e.target.value })}
                        style={{
                          width: '100%', background: 'var(--bg-deep)', border: '1px solid var(--border)',
                          color: color, textAlign: 'center', borderRadius: '4px', padding: '2px',
                          fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, outline: 'none'
                        }} />
                    ) : (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color }}>{t[field]}</div>
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
