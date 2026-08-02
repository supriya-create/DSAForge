import React from 'react';

/** Base card. Pass tone for subtle glow (green/orange/pink/cyan/purple). */
const Card = ({ tone = '', className = '', interactive = false, children, ...props }) => (
  <div
    className={`card ${tone ? `card-glow-${tone}` : ''} ${interactive ? 'card-interactive' : ''} ${className}`.trim()}
    {...props}
  >
    {children}
  </div>
);

export default Card;
