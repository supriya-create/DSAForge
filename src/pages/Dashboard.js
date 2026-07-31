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
    leetcodeUsername: user?.leetcodeUsername || user?.leetcode || ''
  });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const handleOpenEdit = () => {
    setProfileForm({
      name: user?.name || '',
      college: user?.college || '',
      year: user?.year || '1st Year',
      leetcodeUsername: user?.leetcodeUsername || user?.leetcode || ''
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

  // Radar chart shows ALL topics with full names (no truncation to first word).
  const radarData = dsaProgress.map(t => ({
    topic: t.topic,
    score: Math.round((t.solved / t.total) * 100)
  }));

  const topStrong = [...dsaProgress].sort((a, b) => (b.solved / b.total) - (a.solved / a.total)).slice(0, 3);
  const topWeak = [...dsaProgress].sort((a, b) => (a.solved / a.total) - (b.solved / b.total)).slice(0, 3);

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-28">
        <div className="flex-row-between flex-wrap gap-16">
          <div>
            <h1 className="mb-4" style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: 800 }}>
              Good morning, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="flex-align-center gap-8 flex-wrap" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              <span>{user?.college || 'No college'}</span>
              <span>·</span>
              <span>{user?.year || 'No year'}</span>
              <span>·</span>
              <span>LeetCode: <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>@{leetcodeUsername || 'not set'}</span></span>
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
                  textDecoration: 'underline',
                  fontWeight: 600
                }}
              >
                (Edit Profile)
              </button>
            </p>
            <div className="flex-align-center gap-10 mt-12 flex-wrap">
              <button 
                onClick={() => fetchLeetCodeData(leetcodeUsername)} 
                disabled={!leetcodeUsername || leetcodeLoading} 
                className="btn-ghost"
                style={{
                  padding: '8px 16px', 
                  borderRadius: '99px',
                  borderColor: leetcodeUsername ? 'rgba(0, 242, 254, 0.3)' : 'var(--border)',
                  color: leetcodeUsername ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '12px',
                  background: leetcodeLoading ? 'rgba(255,255,255,0.04)' : 'rgba(0, 242, 254, 0.05)'
                }}
              >
                {leetcodeLoading ? 'Syncing LeetCode…' : 'Sync LeetCode'}
              </button>
              {leetcodeData && (
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {totalSolved} solved · Rank {ranking}
                </span>
              )}
            </div>
            {leetcodeError && (
              <div className="mt-8" style={{ fontSize: '12px', color: 'var(--accent-pink)', fontWeight: 500 }}>{leetcodeError}</div>
            )}
          </div>
          <div className="text-center" style={{
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: '16px', padding: '12px 24px', boxShadow: '0 4px 20px rgba(245,158,11,0.05)'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 800 }}>{streak}🔥</div>
            <div style={{ fontSize: '12px', color: 'var(--accent-orange)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Day Streak</div>
          </div>
        </div>
      </div>

      {/* LeetCode Stats */}
      <div className="card mb-24" style={{ padding: '24px' }}>
        <div className="flex-row-between mb-16 flex-wrap gap-12">
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 800 }}>LeetCode Profile Stats</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Synchronized profile records from backend</div>
          </div>
          {leetcodeLoading && <div className="animate-pulse" style={{ fontSize: '13px', color: 'var(--accent-cyan)', fontWeight: 600 }}>Syncing...</div>}
        </div>

        {leetcodeLoading ? (
          <div className="stats-grid">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="stat-card animate-pulse" style={{ padding: '18px' }}>
                <div style={{ height: '10px', width: '55%', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', marginBottom: '12px' }} />
                <div style={{ height: '24px', width: '70%', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', marginBottom: '8px' }} />
                <div style={{ height: '10px', width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: '999px' }} />
              </div>
            ))}
          </div>
        ) : leetcodeError ? (
          <div style={{ padding: '18px', borderRadius: '14px', background: 'rgba(239,68,68,0.06)', color: 'var(--accent-pink)', border: '1px solid rgba(239,68,68,0.15)', fontSize: '14px' }}>
            ⚠️ {leetcodeError}
          </div>
        ) : !hasLeetCodeStats ? (
          <div className="text-center" style={{ padding: '32px', borderRadius: '16px', background: 'rgba(255,255,255,0.01)', color: 'var(--text-secondary)', border: '1px dashed var(--border-bright)' }}>
            <span style={{ fontSize: '20px', display: 'block', marginBottom: '8px' }}>⚡</span>
            No LeetCode stats are available yet. Sync your profile to populate this dashboard.
          </div>
        ) : (
          <div className="stats-grid">
            {[
              { label: 'Total Solved', value: totalSolved, sub: 'problems', color: 'var(--accent-cyan)', glow: 'card-glow-cyan', icon: '✅' },
              { label: 'Easy', value: easySolved, sub: 'easy problems', color: 'var(--accent-green)', glow: 'card-glow-green', icon: '🟢' },
              { label: 'Medium', value: mediumSolved, sub: 'medium problems', color: 'var(--accent-orange)', glow: 'card-glow-orange', icon: '🟠' },
              { label: 'Hard', value: hardSolved, sub: 'hard problems', color: 'var(--accent-pink)', glow: 'card-glow-pink', icon: '🔴' },
              { label: 'Acceptance Rate', value: `${acceptanceRate}%`, sub: 'accepted rate', color: 'var(--accent-purple)', glow: 'card-glow-purple', icon: '📈' },
              { label: 'Ranking', value: ranking === 'N/A' ? 'N/A' : `#${ranking.toLocaleString()}`, sub: 'global rank', color: 'var(--accent-cyan)', glow: 'card-glow-cyan', icon: '🏅' },
              { label: 'Contest Rating', value: Math.round(contestRating), sub: 'contest score', color: 'var(--accent-orange)', glow: 'card-glow-orange', icon: '⚡' },
              { label: 'Last Synced', value: lastSynced.split(',')[0], sub: lastSynced.split(',')[1] || 'latest update', color: 'var(--text-secondary)', glow: '', icon: '🕒' },
            ].map(stat => (
              <div key={stat.label} className={`stat-card ${stat.glow}`} style={{ padding: '16px', position: 'relative' }}>
                <div className="flex-row-between" style={{ alignItems: 'flex-start' }}>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{stat.label}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: stat.color, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{stat.value}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{stat.sub}</div>
                  </div>
                  <div style={{ fontSize: '18px', opacity: 0.8 }}>{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {leetcodeData ? (
        <>
          {/* Charts Row */}
          <div className="charts-grid mb-24">
            {/* Radar Chart */}
            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 800, marginBottom: '4px' }}>Topic Mastery</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Performance across DSA domains</div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke="rgba(255,255,255,0.04)" />
                  <PolarAngleAxis dataKey="topic" tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 500 }} />
                  <Radar name="Score" dataKey="score" stroke="#00D4FF" fill="#00D4FF" fillOpacity={0.12} strokeWidth={2.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Activity Chart */}
            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 800, marginBottom: '4px' }}>Weekly Activity</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Problems solved this week</div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={weeklyActivity}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00F2FE" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#00F2FE" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--bg-card-solid)', 
                      border: '1px solid var(--border-bright)', 
                      borderRadius: 12, 
                      color: 'var(--text-primary)',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                      fontFamily: 'var(--font-body)'
                    }} 
                  />
                  <Area type="monotone" dataKey="solved" stroke="#00F2FE" strokeWidth={2.5} fill="url(#areaGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <SubmissionHeatmap recentSubmissions={leetcodeData?.recentSubmissions || []} />
          <ContestHistory contestHistory={leetcodeData?.contestHistory || []} />
          <RecentSubmissions recentSubmissions={leetcodeData?.recentSubmissions || []} />

          {/* Strengths and Focus Areas */}
          <div className="strengths-grid mb-24">
            <div className="card">
              <div style={{ fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '18px' }}>💪 Strong Areas</div>
              <div className="flex-column" style={{ gap: '14px' }}>
                {topStrong.map((t) => {
                  const pct = Math.round((t.solved / t.total) * 100);
                  return (
                    <div key={t.topic}>
                      <div className="flex-row-between mb-6">
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{t.topic}</span>
                        <span className="tag tag-strong">{pct}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent-green), #059669)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="card">
              <div style={{ fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '18px' }}>🎯 Focus Areas</div>
              <div className="flex-column" style={{ gap: '14px' }}>
                {topWeak.map((t) => {
                  const pct = Math.round((t.solved / t.total) * 100);
                  return (
                    <div key={t.topic}>
                      <div className="flex-row-between mb-6">
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{t.topic}</span>
                        <span className="tag tag-weak">{pct}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent-pink), #dc2626)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card mb-24 text-center" style={{ padding: '40px 24px', border: '1px dashed var(--border-bright)' }}>
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>📊</span>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
            Sync LeetCode ID to View Progress Analysis & Charts
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '480px', margin: '0 auto' }}>
            Please sync your LeetCode profile to unlock Topic Mastery charts, Weekly Activity tracking, Submission Heatmap, and Strengths/Focus areas.
          </p>
        </div>
      )}

      {/* Topic Progress Table */}
      <div className="card">
        <div style={{ fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '18px' }}>📋 All Topics Overview</div>
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
              {dsaProgress.map((t) => {
                const pct = Math.round((t.solved / t.total) * 100);
                const level = pct >= 70 ? 'strong' : pct >= 40 ? 'moderate' : 'weak';
                return (
                  <tr key={t.topic}>
                    <td style={{ fontWeight: 700 }}>{t.topic}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>{t.solved}</td>
                    <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{t.easy}</td>
                    <td style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>{t.medium}</td>
                    <td style={{ color: 'var(--accent-pink)', fontWeight: 600 }}>{t.hard}</td>
                    <td style={{ minWidth: '140px' }}>
                      <div className="flex-align-center" style={{ gap: '12px' }}>
                        <div className="progress-bar flex-1">
                          <div className="progress-fill" style={{
                            width: `${pct}%`,
                            background: pct >= 70 ? 'var(--accent-green)' : pct >= 40 ? 'var(--accent-orange)' : 'var(--accent-pink)'
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: 32, fontWeight: 600 }}>{pct}%</span>
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
          background: 'rgba(3, 2, 7, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            borderColor: 'var(--border-bright)',
            background: 'var(--bg-card-solid)'
          }}>
            <h3 className="mb-8" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800 }}>Edit Profile Details</h3>
            <p className="mb-20" style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
              Configure your college, graduation details, and LeetCode handle.
            </p>

            {editError && (
              <div className="mb-16 text-center" style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--accent-pink)',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '13px'
              }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="flex-column" style={{ gap: '14px' }}>
              <div>
                <label className="mb-6" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Full Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={profileForm.name}
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-6" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>College</label>
                <input
                  type="text"
                  className="input-field"
                  value={profileForm.college}
                  onChange={e => setProfileForm({ ...profileForm, college: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-6" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Year</label>
                <select
                  className="input-field"
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
                <label className="mb-6" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>LeetCode Username</label>
                <input
                  type="text"
                  placeholder="e.g. aryan_codes"
                  className="input-field"
                  value={profileForm.leetcodeUsername}
                  onChange={e => setProfileForm({ ...profileForm, leetcodeUsername: e.target.value })}
                />
              </div>

              <div className="flex-align-center mt-12" style={{ gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="btn-ghost"
                  style={{ flex: 1, padding: '11px', borderRadius: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="btn-primary"
                  style={{ flex: 1, padding: '11px', borderRadius: '12px' }}
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
