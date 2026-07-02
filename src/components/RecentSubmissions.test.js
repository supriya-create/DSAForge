import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import RecentSubmissions from './RecentSubmissions';

describe('RecentSubmissions', () => {
  it('renders a page of recent submission cards', () => {
    const submissions = Array.from({ length: 8 }, (_, index) => ({
      problemId: `prob-${index}`,
      problemTitle: `Problem ${index + 1}`,
      difficulty: index % 2 === 0 ? 'Easy' : 'Hard',
      status: index % 3 === 0 ? 'Accepted' : 'Wrong Answer',
      language: 'JavaScript',
      timestamp: '2026-07-02T10:00:00Z',
    }));

    render(<RecentSubmissions recentSubmissions={submissions} />);

    expect(screen.getByText('Recent Submissions')).toBeInTheDocument();
    expect(screen.getByText('Problem 1')).toBeInTheDocument();
    expect(screen.getAllByText('Accepted').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('JavaScript').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });
});
