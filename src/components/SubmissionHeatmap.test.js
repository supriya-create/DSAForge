import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import SubmissionHeatmap from './SubmissionHeatmap';

describe('SubmissionHeatmap', () => {
  it('renders the heatmap and tooltip content for submission dates', () => {
    const submissions = [
      { problemId: 'p1', problemTitle: 'One', timestamp: '2026-07-01T12:00:00Z' },
      { problemId: 'p2', problemTitle: 'Two', timestamp: '2026-07-01T13:00:00Z' },
      { problemId: 'p3', problemTitle: 'Three', timestamp: '2026-07-02T12:00:00Z' },
    ];

    render(<SubmissionHeatmap recentSubmissions={submissions} />);

    expect(screen.getByText(/Coding Activity/i)).toBeInTheDocument();
    expect(screen.getByText(/3 submissions/i)).toBeInTheDocument();
    expect(screen.getByText(/submissions ·/i)).toBeInTheDocument();
  });
});
