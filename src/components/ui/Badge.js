import React from 'react';

/** Small pill badge. tone: strong/moderate/weak/easy/medium/hard or custom. */
const Badge = ({ tone = '', className = '', children, ...props }) => (
  <span className={`tag ${tone ? `tag-${tone}` : ''} ${className}`.trim()} {...props}>
    {children}
  </span>
);

export default Badge;
