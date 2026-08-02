import React from 'react';

/**
 * Guided empty state with an optional action. Replaces the repeated
 * dead-end "Sync LeetCode ID to view..." screens so users always have a
 * clear next step.
 */
const EmptyState = ({ icon = '⚡', title, subtitle, action, children }) => (
  <div className="card text-center empty-state">
    <span className="empty-state-icon">{icon}</span>
    {title && <div className="empty-state-title">{title}</div>}
    {subtitle && <p className="empty-state-subtitle">{subtitle}</p>}
    {action && <div className="empty-state-action">{action}</div>}
    {children}
  </div>
);

export default EmptyState;
