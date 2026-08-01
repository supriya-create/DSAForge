import React from 'react';

/** Shimmer/pulse placeholder for loading states. */
const Skeleton = ({ width = '100%', height = 14, radius = 8, style, className = '', ...props }) => (
  <div
    className={`skeleton ${className}`.trim()}
    style={{ width, height, borderRadius: radius, ...style }}
    {...props}
  />
);

export default Skeleton;
