import React, { useMemo, useState } from 'react';

const formatTimestamp = (value) => {
  if (!value) return 'Unknown';
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return value;
  return timestamp.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getStatusColor = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized.includes('accepted') || normalized.includes('ac')) return 'var(--accent-green)';
  if (normalized.includes('wrong') || normalized.includes('failed') || normalized.includes('tle')) return 'var(--accent-pink)';
  if (normalized.includes('partial') || normalized.includes('pending')) return 'var(--accent-orange)';
  return 'var(--text-secondary)';
};

const RecentSubmissions = ({ recentSubmissions = [] }) => {
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const submissions = useMemo(() => {
    if (!Array.isArray(recentSubmissions)) return [];
    return recentSubmissions.map((item, index) => ({
      id: item?.problemId || item?.id || index,
      problemName: item?.problemTitle || item?.problemName || 'Untitled Problem',
      difficulty: item?.difficulty || 'Unknown',
      status: item?.status || 'Unknown',
      language: item?.language || 'Unknown',
      time: item?.timestamp || item?.submissionTime || item?.submittedAt || null,
    }));
  }, [recentSubmissions]);

  const pageCount = Math.max(1, Math.ceil(submissions.length / pageSize));

  const currentPageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return submissions.slice(start, start + pageSize);
  }, [page, submissions]);

  const handlePrev = () => setPage((current) => Math.max(1, current - 1));
  const handleNext = () => setPage((current) => Math.min(pageCount, current + 1));

  return (
    <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700 }}>Recent Submissions</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            A card-based view of your latest LeetCode submissions.
          </div>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Showing {currentPageItems.length} of {submissions.length}
        </div>
      </div>

      {submissions.length === 0 ? (
        <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', border: '1px dashed var(--border)' }}>
          No recent submissions found. Sync your LeetCode profile to populate this section.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {currentPageItems.map((submission) => (
            <div key={submission.id} className="card" style={{ padding: '18px', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', lineHeight: 1.35, color: 'var(--text-primary)' }}>
                    {submission.problemName}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                      {submission.difficulty}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: getStatusColor(submission.status), borderRadius: '999px', padding: '4px 8px', border: `1px solid ${getStatusColor(submission.status)}` }}>
                      {submission.status}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}><strong>Language:</strong> {submission.language}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}><strong>Submitted:</strong> {formatTimestamp(submission.time)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {submissions.length > 0 && (
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handlePrev}
              disabled={page === 1}
              style={{
                padding: '8px 14px', borderRadius: '999px', border: '1px solid var(--border)', background: page === 1 ? 'rgba(255,255,255,0.06)' : 'rgba(0,212,255,0.08)',
                color: page === 1 ? 'var(--text-secondary)' : 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={page === pageCount}
              style={{
                padding: '8px 14px', borderRadius: '999px', border: '1px solid var(--border)', background: page === pageCount ? 'rgba(255,255,255,0.06)' : 'rgba(0,212,255,0.08)',
                color: page === pageCount ? 'var(--text-secondary)' : 'var(--text-primary)', cursor: page === pageCount ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Page {page} of {pageCount}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentSubmissions;
