import React, { useMemo, useRef, useState } from 'react';

const formatDateLabel = (date) => {
  if (!date) return 'Unknown';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const getLevel = (count) => {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
};

const buildWeeklyGrid = (recentSubmissions = []) => {
  const dayCounts = new Map();
  let minTime = Infinity;
  let maxTime = -Infinity;

  recentSubmissions.forEach((submission) => {
    const date = new Date(submission?.timestamp || submission?.submittedAt || submission?.time || submission?.date);
    if (Number.isNaN(date.getTime())) return;
    date.setHours(0, 0, 0, 0);
    const key = date.toISOString().slice(0, 10);
    dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
    minTime = Math.min(minTime, date.getTime());
    maxTime = Math.max(maxTime, date.getTime());
  });

  if (dayCounts.size === 0) {
    return { weeks: [], dayLabels: ['S', 'M', 'T', 'W', 'T', 'F', 'S'], rangeLabel: '' };
  }

  const startDate = new Date(minTime);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(maxTime);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const days = [];
  for (let current = new Date(startDate); current <= endDate; current.setDate(current.getDate() + 1)) {
    const key = current.toISOString().slice(0, 10);
    days.push({
      date: new Date(current),
      count: dayCounts.get(key) || 0,
      key,
      level: getLevel(dayCounts.get(key) || 0),
    });
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const startLabel = formatDateLabel(new Date(startDate));
  const endLabel = formatDateLabel(new Date(endDate));
  const rangeLabel = `${startLabel} – ${endLabel}`;

  return { weeks, dayLabels: ['S', 'M', 'T', 'W', 'T', 'F', 'S'], rangeLabel };
};

const SubmissionHeatmap = ({ recentSubmissions = [] }) => {
  const { weeks, dayLabels, rangeLabel } = useMemo(() => buildWeeklyGrid(recentSubmissions), [recentSubmissions]);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const containerRef = useRef(null);

  const empty = weeks.length === 0;
  const totalProblems = recentSubmissions.length;

  const handleMouseEnter = (event, day) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setHovered({
      ...day,
      label: formatDateLabel(day.date),
      x: event.clientX - rect.left + 10,
      y: event.clientY - rect.top + 10,
    });
  };

  const handleMouseLeave = () => setHovered(null);

  const handleSelect = (day) => setSelected({ ...day, label: formatDateLabel(day.date) });

  return (
    <div className="card" style={{ marginBottom: '24px', padding: '20px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700 }}>Coding Activity</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Daily submission heatmap grouped by date.
          </div>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '180px' }}>
          {totalProblems} submissions · {rangeLabel}
        </div>
      </div>

      {empty ? (
        <div style={{ padding: '18px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}>
          No submission dates are available yet. Sync your profile to fill the heatmap.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
            {dayLabels.map((label, index) => (
              <span key={`${label}-${index}`} style={{ flex: '0 0 auto', width: '18px', fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                {label}
              </span>
            ))}
          </div>
          <div ref={containerRef} className="heatmap-grid" style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px' }}>
            {weeks.map((week, weekIndex) => (
              <div key={`week-${weekIndex}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {week.map((day) => (
                  <button
                    key={day.key}
                    type="button"
                    onMouseEnter={(event) => handleMouseEnter(event, day)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleSelect(day)}
                    className={`heatmap-cell level-${day.level}`}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 6,
                      border: '1px solid transparent',
                      cursor: 'pointer',
                      boxShadow: selected?.key === day.key ? '0 0 0 2px rgba(20, 184, 166, 0.25)' : 'none',
                    }}
                    aria-label={`${day.key}: ${day.count} solved`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="heatmap-legend" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <span key={level} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`heatmap-cell level-${level}`} style={{ width: 16, height: 16, borderRadius: 4, border: '1px solid transparent' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{level === 0 ? '0' : level === 4 ? '7+' : level}</span>
              </span>
            ))}
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>More</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginTop: '14px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '220px' }}>
              Tap a cell to view exact submissions for that date.
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Selected: {selected ? `${selected.label} · ${selected.count} solved` : 'None'}
            </div>
          </div>
          {hovered && (
            <div
              className="heatmap-tooltip"
              style={{
                position: 'absolute',
                left: hovered.x,
                top: hovered.y,
                transform: 'translate(-50%, -100%)',
                background: 'var(--bg-card2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                zIndex: 20,
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>{hovered.label}</div>
              <div>{hovered.count} problem{hovered.count === 1 ? '' : 's'} solved</div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SubmissionHeatmap;
