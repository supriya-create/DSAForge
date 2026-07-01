import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useApp } from '../context/AppContext';

const activityData = [
  { day: 'Mon', solved: 4 }, { day: 'Tue', solved: 7 }, { day: 'Wed', solved: 3 },
  { day: 'Thu', solved: 9 }, { day: 'Fri', solved: 5 }, { day: 'Sat', solved: 11 }, { day: 'Sun', solved: 6 },
];

const Dashboard = () => {
  const { user, dsaProgress, totalSolved, streak, leetcodeData, leetcodeLoading, leetcodeError, fetchLeetCodeData } = useApp();

  const leetcodeSolved = leetcodeData?.submitStats?.acSubmissionNum?.reduce((sum, entry) => sum + (entry.count || 0), 0) || 0;
  const leetcodeRank = leetcodeData?.profile?.ranking || 'N/A';

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
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {user?.college} · {user?.year} · LeetCode: <span style={{ color: 'var(--accent-cyan)' }}>@{user?.leetcode}</span>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => fetchLeetCodeData(user?.leetcode)} disabled={!user?.leetcode || leetcodeLoading} style={{
                padding: '8px 14px', borderRadius: '999px', border: '1px solid var(--border)',
                background: leetcodeLoading ? 'rgba(255,255,255,0.08)' : 'rgba(0,212,255,0.08)',
                color: 'var(--text-primary)', cursor: user?.leetcode ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 700
              }}>
                {leetcodeLoading ? 'Syncing LeetCode…' : 'Sync LeetCode'}
              </button>
              {leetcodeData && (
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {leetcodeSolved} solved · Rank {leetcodeRank}
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

      {/* Top Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Solved', value: totalSolved, sub: 'problems', color: 'var(--accent-cyan)', icon: '✅' },
          { label: 'Readiness Score', value: `${overallScore}%`, sub: 'placement ready', color: 'var(--accent-green)', icon: '🏆' },
          { label: 'Topics Covered', value: dsaProgress.length, sub: 'of 15 topics', color: 'var(--accent-purple)', icon: '📚' },
          { label: 'This Week', value: activityData.reduce((s, d) => s + d.solved, 0), sub: 'problems solved', color: 'var(--accent-orange)', icon: '⚡' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{
            background: `linear-gradient(135deg, var(--bg-card), var(--bg-card2))`,
            borderColor: 'var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{stat.sub}</div>
              </div>
              <div style={{ fontSize: '24px' }}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
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
            <AreaChart data={activityData}>
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

      {/* Strengths and Weaknesses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
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
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Topic', 'Solved', 'Easy', 'Medium', 'Hard', 'Progress', 'Level'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dsaProgress.map((t, i) => {
                const pct = Math.round((t.solved / t.total) * 100);
                const level = pct >= 70 ? 'strong' : pct >= 40 ? 'moderate' : 'weak';
                return (
                  <tr key={t.topic} style={{ borderBottom: '1px solid rgba(30,45,71,0.5)', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: 500 }}>{t.topic}</td>
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--accent-cyan)' }}>{t.solved}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--accent-green)' }}>{t.easy}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--accent-orange)' }}>{t.medium}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--accent-pink)' }}>{t.hard}</td>
                    <td style={{ padding: '12px', minWidth: '120px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{
                            width: `${pct}%`,
                            background: pct >= 70 ? 'var(--accent-green)' : pct >= 40 ? 'var(--accent-orange)' : 'var(--accent-pink)'
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: 32 }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}><span className={`tag tag-${level}`}>{level}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
