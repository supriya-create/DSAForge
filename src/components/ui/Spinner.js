import React from 'react';

/** Inline spinner used inside loading buttons. */
const Spinner = ({ size = 16, color = 'rgba(0,0,0,0.3)' }) => (
  <span
    className="animate-spin"
    style={{
      width: size,
      height: size,
      border: `2px solid ${color}`,
      borderTopColor: '#000',
      borderRadius: '50%',
      display: 'inline-block',
    }}
  />
);

export default Spinner;
