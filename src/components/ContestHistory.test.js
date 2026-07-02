import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ContestHistory from './ContestHistory';

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  global.ResizeObserver = ResizeObserver;
});

describe('ContestHistory', () => {
  it('renders contest rows from the provided history', () => {
    render(
      <ContestHistory
        contestHistory={[
          {
            contestName: 'Weekly Contest 400',
            contestDate: '2025-01-18T20:35:00Z',
            ratingBefore: 1700,
            ratingAfter: 1760,
            rank: 1200,
            problemsSolved: 3,
          },
        ]}
      />
    );

    expect(screen.getByText('Weekly Contest 400')).toBeInTheDocument();
    expect(screen.getByText('1200')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
