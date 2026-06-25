import React, { useState } from 'react';

export default function GlassSelect({
  label,
  icon: Icon,
  value,
  onChange,
  children,
  className = '',
  id
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative mb-5 group ${className}`} id={id}>
      {/* Floating/Top Label */}
      {label && (
        <label 
          className={`absolute left-3 transition-all duration-300 pointer-events-none text-xs flex items-center gap-1.5 z-20 -top-2.5 bg-[#0a0b10] px-2 text-indigo-400 font-bold scale-90 border-x border-white/5 rounded-md`}
          style={{
            transformOrigin: 'left top',
          }}
        >
          {Icon && <Icon className={`h-3.5 w-3.5 ${isFocused ? 'text-indigo-400' : 'text-slate-500'}`} />}
          <span>{label}</span>
        </label>
      )}

      {/* Select Element */}
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full bg-[#0a0b12] text-slate-200 rounded-xl px-4 py-3.5 text-xs outline-none border transition-all duration-300 z-10 cursor-pointer appearance-none"
        style={{
          borderColor: isFocused ? 'rgba(99, 102, 241, 0.45)' : 'rgba(255, 255, 255, 0.06)',
          boxShadow: isFocused 
            ? '0 0 16px rgba(99, 102, 241, 0.18), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)' 
            : 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.02)',
          paddingLeft: label ? '2.5rem' : '1rem',
          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23818cf8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 1rem center',
          backgroundSize: '1rem'
        }}
      >
        {children}
      </select>

      {/* Underlay glow bar */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 pointer-events-none"
        style={{
          width: isFocused ? '96%' : '0%'
        }}
      />
    </div>
  );
}
