import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from 'recharts';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const normalizeContestHistory = (history = []) => {
  return (history || [])
    .map((item, index) => ({
      id: item?.contestId || item?.id || index,
      contestName: item?.contestId || item?.contestName || item?.name || item?.contest?.name || 'Unnamed Contest',
      date: item?.attendedAt || item?.contestDate || item?.date || item?.contest?.date || item?.startTime || '',
      ratingBefore: Number(item?.ratingBefore ?? item?.before ?? item?.rating_before ?? (item?.rating ? Math.round(item.rating - 20) : 0)),
      ratingAfter: Number(item?.rating ?? item?.ratingAfter ?? item?.after ?? item?.rating_after ?? 0),
      rank: item?.rank ?? item?.ranking ?? item?.position ?? 'N/A',
      problemsSolved: Number(item?.problemsSolved ?? item?.solved ?? item?.problems_solved ?? 0),
    }))
    .filter((entry) => entry.contestName);
};

const ContestHistory = ({ contestHistory = [] }) => {
  const normalizedHistory = normalizeContestHistory(contestHistory);

  const chartData = normalizedHistory.map((entry) => ({
    name: entry.contestName,
    before: entry.ratingBefore,
    after: entry.ratingAfter,
  }));

  return (
    <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700 }}>Contest History</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Track rating jumps and placements over time</div>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {normalizedHistory.length} contest{normalizedHistory.length === 1 ? '' : 's'}
        </div>
      </div>

      {normalizedHistory.length === 0 ? (
        <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', border: '1px dashed var(--border)' }}>
          No contest history is available yet. Sync your LeetCode profile to populate this section.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{ minHeight: '280px' }}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#8B9CC8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8B9CC8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                />
                <Line type="monotone" dataKey="before" stroke="#8B9CC8" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="after" stroke="#00D4FF" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '420px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Contest', 'Date', 'Before', 'After', 'Rank', 'Solved'].map((header) => (
                    <th
                      key={header}
                      style={{ textAlign: 'left', padding: '8px 10px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {normalizedHistory.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid rgba(30,45,71,0.45)' }}>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 600 }}>{entry.contestName}</td>
                    <td style={{ padding: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>{formatDate(entry.date)}</td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#8B9CC8' }}>{entry.ratingBefore}</td>
                    <td style={{ padding: '10px', fontSize: '13px', color: 'var(--accent-cyan)' }}>{entry.ratingAfter}</td>
                    <td style={{ padding: '10px', fontSize: '13px' }}>{entry.rank}</td>
                    <td style={{ padding: '10px', fontSize: '13px', color: 'var(--accent-green)' }}>{entry.problemsSolved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestHistory;
