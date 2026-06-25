import React from 'react';

export default function NeonCard({ children, className = '', containerClassName = '', id }) {
  return (
    <div 
      id={id}
      className={`neon-border-card shadow-[0_0_30px_rgba(99,102,241,0.1)] hover:shadow-[0_0_40px_rgba(99,102,241,0.2)] transition-shadow duration-500 ${containerClassName}`}
    >
      <div className={`neon-border-card-inner p-6 ${className}`}>
        {children}
      </div>
    </div>
  );
}
