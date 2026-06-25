import React from 'react';

export default function GlassCard({ children, className = '', hoverEffect = false, id }) {
  return (
    <div 
      id={id}
      className={`glass-panel rounded-2xl p-6 transition-all duration-300 ${
        hoverEffect ? 'glass-panel-hover' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
