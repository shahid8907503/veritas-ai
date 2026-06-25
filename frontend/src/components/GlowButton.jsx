import React from 'react';

export default function GlowButton({ 
  children, 
  onClick, 
  type = 'button', 
  disabled = false, 
  className = '', 
  variant = 'indigo' // 'indigo', 'rose', 'emerald'
}) {
  const colorMap = {
    indigo: {
      primary: '#6366f1',
      secondary: '#a855f7',
      shadow: 'rgba(99, 102, 241, 0.4)'
    },
    rose: {
      primary: '#f43f5e',
      secondary: '#ec4899',
      shadow: 'rgba(244, 63, 94, 0.4)'
    },
    emerald: {
      primary: '#10b981',
      secondary: '#06b6d4',
      shadow: 'rgba(16, 185, 129, 0.4)'
    }
  };

  const theme = colorMap[variant] || colorMap.indigo;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`relative overflow-hidden font-bold tracking-wider text-xs uppercase px-6 py-3.5 rounded-xl border-2 border-solid transition-all duration-500 z-10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 group ${className}`}
      style={{
        borderColor: theme.primary,
        backgroundColor: 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = `0 0 15px ${theme.primary}, 0 0 30px ${theme.secondary}`;
          e.currentTarget.style.borderColor = 'transparent';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = theme.primary;
      }}
    >
      {/* Ripple/Background Expansion Layers */}
      <span 
        className="absolute block w-0 h-0 transition-all duration-700 ease-out rounded-full -z-10 group-hover:w-[450px] group-hover:h-[450px] top-0 left-0 -translate-x-1/2 -translate-y-1/2"
        style={{ backgroundColor: theme.primary }}
      />
      <span 
        className="absolute block w-0 h-0 transition-all duration-700 ease-out rounded-full -z-10 group-hover:w-[450px] group-hover:h-[450px] bottom-0 right-0 translate-x-1/2 translate-y-1/2"
        style={{ backgroundColor: theme.secondary }}
      />

      <span className="relative flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
