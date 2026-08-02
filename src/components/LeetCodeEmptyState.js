import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, Button } from './ui';

/**
 * Guided empty state shown when a user has no synced LeetCode data.
 * Gives a concrete next action (jump to the dashboard to add/sync their
 * username) instead of a dead-end message.
 */
const LeetCodeEmptyState = ({ icon = '⚡', title, subtitle }) => {
  const navigate = useNavigate();
  return (
    <EmptyState
      icon={icon}
      title={title}
      subtitle={subtitle}
      action={<Button onClick={() => navigate('/')}>Go to Dashboard &amp; Sync</Button>}
    />
  );
};

export default LeetCodeEmptyState;
