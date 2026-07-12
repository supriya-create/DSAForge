import React, { useState, useMemo } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useApp } from '../context/AppContext';
import ContestHistory from '../components/ContestHistory';
import RecentSubmissions from '../components/RecentSubmissions';
import SubmissionHeatmap from '../components/SubmissionHeatmap';
const Dashboard = () => {
  const { user, dsaProgress, streak, weeklyActivity, leetcodeData, leetcodeLoading, leetcodeError, fetchLeetCodeData, updateProfile } = useApp();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    college: user?.college || '',
    year: user?.year || '1st Year',
    leetcode: user?.leetcode || user?.leetcodeUsername || ''
  });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const handleOpenEdit = () => {
    setProfileForm({
      name: user?.name || '',
      college: user?.college || '',
      year: user?.year || '1st Year',
      leetcode: user?.leetcode || user?.leetcodeUsername || ''
    });
    setEditError('');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError('');
    try {
      await updateProfile(profileForm);
      setIsEditingProfile(false);
    } catch (err) {
      console.error(err);
      setEditError(err.message || 'Failed to update profile');
    } finally {
      setEditSaving(false);
    }
  };

  const leetcodeUsername = user?.leetcodeUsername || user?.leetcode || null;
  const totalSolved = leetcodeData?.summary?.totalSolved ?? 0;
  const easySolved = leetcodeData?.summary?.easySolved ?? 0;
  const mediumSolved = leetcodeData?.summary?.mediumSolved ?? 0;
  const hardSolved = leetcodeData?.summary?.hardSolved ?? 0;
  const acceptanceRate = leetcodeData?.acceptanceRate ?? 0;
  const ranking = leetcodeData?.summary?.ranking ?? 'N/A';
  const contestRating = leetcodeData?.contestRating ?? 0;
  const lastSynced = leetcodeData?.lastSynced ? new Date(leetcodeData.lastSynced).toLocaleString() : 'Not synced yet';

  const hasLeetCodeStats = Boolean(
    leetcodeData?.summary?.totalSolved ||
    leetcodeData?.summary?.easySolved ||
    leetcodeData?.summary?.mediumSolved ||
    leetcodeData?.summary?.hardSolved ||
    leetcodeData?.contestRating ||
    leetcodeData?.summary?.ranking ||
    leetcodeData?.lastSynced
  );

  const radarData = dsaProgress.slice(0, 8).map(t => ({
    topic: t.topic.split(' ')[0],
    score: Math.round((t.solved / t.total) * 100)
  }));

  const topStrong = [...dsaProgress].sort((a, b) => (b.solved / b.total) - (a.solved / a.total)).slice(0, 3);
  const topWeak = [...dsaProgress].sort((a, b) => (a.solved / a.total) - (b.solved / b.total)).slice(0, 3);

  const overallScore = Math.round(dsaProgress.reduce((acc, t) => acc + (t.solved / t.total), 0) / dsaProgress.length * 100);

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>
              Good morning, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>{user?.college || 'No college'}</span>
              <span>·</span>
              <span>{user?.year || 'No year'}</span>
              <span>·</span>
              <span>LeetCode: <span style={{ color: 'var(--accent-cyan)' }}>@{leetcodeUsername || 'not set'}</span></span>
              <button 
                onClick={handleOpenEdit} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--accent-cyan)', 
                  cursor: 'pointer', 
                  fontSize: '12px', 
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  textDecoration: 'underline'
                }}
              >
                (Edit Profile)
              </button>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => fetchLeetCodeData(leetcodeUsername)} disabled={!leetcodeUsername || leetcodeLoading} style={{
                padding: '8px 14px', borderRadius: '999px', border: '1px solid var(--border)',
                background: leetcodeLoading ? 'rgba(255,255,255,0.08)' : 'rgba(0,212,255,0.08)',
                color: 'var(--text-primary)', cursor: leetcodeUsername ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 700
              }}>
                {leetcodeLoading ? 'Syncing LeetCode…' : 'Sync LeetCode'}
              </button>
              {leetcodeData && (
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {totalSolved} solved · Rank {ranking}
                </span>
              )}
            </div>
            {leetcodeError && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--accent-pink)' }}>{leetcodeError}</div>
            )}
          </div>
          <div style={{
            background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)',
            borderRadius: '12px', padding: '12px 20px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px' }}>{streak}🔥</div>
            <div style={{ fontSize: '12px', color: 'var(--accent-orange)', fontWeight: 600 }}>Day Streak</div>
          </div>
        </div>
      </div>

      {/* LeetCode Stats */}
      <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700 }}>LeetCode Profile Stats</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Synced from MongoDB-backed profile data</div>
          </div>
          {leetcodeLoading && <div style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>Loading…</div>}
        </div>

        {leetcodeLoading ? (
          <div className="stats-grid">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="stat-card" style={{ padding: '14px' }}>
                <div style={{ height: '10px', width: '55%', background: 'rgba(255,255,255,0.12)', borderRadius: '999px', marginBottom: '10px' }} />
                <div style={{ height: '22px', width: '70%', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', marginBottom: '8px' }} />
                <div style={{ height: '10px', width: '40%', background: 'rgba(255,255,255,0.08)', borderRadius: '999px' }} />
              </div>
            ))}
          </div>
        ) : leetcodeError ? (
          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', color: 'var(--accent-pink)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {leetcodeError}
          </div>
        ) : !hasLeetCodeStats ? (
          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', border: '1px dashed var(--border)' }}>
            No LeetCode stats are available yet. Sync your profile to populate this dashboard.
          </div>
        ) : (
          <div className="stats-grid">
            {[
              { label: 'Total Solved', value: totalSolved, sub: 'problems', color: 'var(--accent-cyan)', icon: '✅' },
              { label: 'Easy', value: easySolved, sub: 'easy problems', color: 'var(--accent-green)', icon: '🟢' },
              { label: 'Medium', value: mediumSolved, sub: 'medium problems', color: 'var(--accent-orange)', icon: '🟠' },
              { label: 'Hard', value: hardSolved, sub: 'hard problems', color: 'var(--accent-pink)', icon: '🔴' },
              { label: 'Acceptance Rate', value: `${acceptanceRate}%`, sub: 'accepted submissions', color: 'var(--accent-purple)', icon: '📈' },
              { label: 'Ranking', value: ranking === 'N/A' ? 'N/A' : `#${ranking}`, sub: 'global rank', color: 'var(--accent-cyan)', icon: '🏅' },
              { label: 'Contest Rating', value: contestRating, sub: 'contest score', color: 'var(--accent-orange)', icon: '⚡' },
              { label: 'Last Synced', value: lastSynced, sub: 'latest refresh', color: 'var(--text-secondary)', icon: '🕒' },
            ].map(stat => (
              <div key={stat.label} className="stat-card" style={{ padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{stat.sub}</div>
                  </div>
                  <div style={{ fontSize: '20px' }}>{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="charts-grid" style={{ marginBottom: '24px' }}>
        {/* Radar Chart */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Topic Mastery</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Performance across DSA domains</div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.07)" />
              <PolarAngleAxis dataKey="topic" tick={{ fill: '#8B9CC8', fontSize: 11 }} />
              <Radar name="Score" dataKey="score" stroke="#00D4FF" fill="#00D4FF" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Chart */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Weekly Activity</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Problems solved this week</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={weeklyActivity}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: '#8B9CC8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8B9CC8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
              <Area type="monotone" dataKey="solved" stroke="#00D4FF" strokeWidth={2} fill="url(#areaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <SubmissionHeatmap recentSubmissions={leetcodeData?.recentSubmissions || []} />
      <ContestHistory contestHistory={leetcodeData?.contestHistory || []} />
      <RecentSubmissions recentSubmissions={leetcodeData?.recentSubmissions || []} />

      {/* Strengths and Weaknesses */}
      <div className="strengths-grid" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div style={{ fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '16px' }}>💪 Strong Areas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topStrong.map((t, i) => {
              const pct = Math.round((t.solved / t.total) * 100);
              return (
                <div key={t.topic}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{t.topic}</span>
                    <span className="tag tag-strong">{pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent-green), #00aa55)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '16px' }}>🎯 Focus Areas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topWeak.map((t, i) => {
              const pct = Math.round((t.solved / t.total) * 100);
              return (
                <div key={t.topic}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{t.topic}</span>
                    <span className="tag tag-weak">{pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent-pink), #cc0066)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Topic Progress Table */}
      <div className="card">
        <div style={{ fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '16px' }}>📋 All Topics Overview</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="dsa-table">
            <thead>
              <tr>
                {['Topic', 'Solved', 'Easy', 'Medium', 'Hard', 'Progress', 'Level'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dsaProgress.map((t, i) => {
                const pct = Math.round((t.solved / t.total) * 100);
                const level = pct >= 70 ? 'strong' : pct >= 40 ? 'moderate' : 'weak';
                return (
                  <tr key={t.topic}>
                    <td style={{ fontWeight: 600 }}>{t.topic}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 600 }}>{t.solved}</td>
                    <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{t.easy}</td>
                    <td style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>{t.medium}</td>
                    <td style={{ color: 'var(--accent-pink)', fontWeight: 600 }}>{t.hard}</td>
                    <td style={{ minWidth: '120px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{
                            width: `${pct}%`,
                            background: pct >= 70 ? 'var(--accent-green)' : pct >= 40 ? 'var(--accent-orange)' : 'var(--accent-pink)'
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: 32 }}>{pct}%</span>
                      </div>
                    </td>
                    <td><span className={`tag tag-${level}`}>{level}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(26, 20, 16, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '32px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 0 50px rgba(0,0,0,0.6)',
            position: 'relative'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: 800,
              marginBottom: '8px'
            }}>Edit Profile Details</h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '13px',
              marginBottom: '20px'
            }}>
              Configure your college, graduation details, and LeetCode handle.
            </p>

            {editError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>Full Name</label>
                <input
                  type="text"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-card2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  value={profileForm.name}
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>College</label>
                <input
                  type="text"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-card2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  value={profileForm.college}
                  onChange={e => setProfileForm({ ...profileForm, college: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>Year</label>
                <select
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-card2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  value={profileForm.year}
                  onChange={e => setProfileForm({ ...profileForm, year: e.target.value })}
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Post Graduate">Post Graduate</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>LeetCode Username</label>
                <input
                  type="text"
                  placeholder="e.g. aryan_codes"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-card2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  value={profileForm.leetcode}
                  onChange={e => setProfileForm({ ...profileForm, leetcode: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'var(--bg-card2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: editSaving ? 0.7 : 1
                  }}
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
