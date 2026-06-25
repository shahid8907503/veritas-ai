import React, { useState } from 'react';

export default function GlassTextarea({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder = '',
  required = false,
  className = '',
  height = 'h-60',
  id
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative mb-5 group ${className}`} id={id}>
      {/* Floating/Top Label */}
      {label && (
        <label 
          className={`absolute left-3 transition-all duration-300 pointer-events-none text-xs flex items-center gap-1.5 z-20 ${
            isFocused || value
              ? '-top-2.5 bg-[#0a0b10] px-2 text-indigo-400 font-bold scale-90 border-x border-white/5 rounded-md'
              : 'top-3.5 text-slate-500 font-semibold'
          }`}
          style={{
            transformOrigin: 'left top',
          }}
        >
          {Icon && <Icon className={`h-3.5 w-3.5 ${isFocused ? 'text-indigo-400' : 'text-slate-500'}`} />}
          <span>{label}</span>
        </label>
      )}

      {/* Textarea Element */}
      <textarea
        required={required}
        value={value}
        onChange={onChange}
        placeholder={isFocused ? placeholder : ''}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full bg-slate-950/30 text-slate-100 placeholder-slate-600 rounded-xl px-4 py-3.5 text-xs outline-none border transition-all duration-300 z-10 resize-none ${height}`}
        style={{
          borderColor: isFocused ? 'rgba(99, 102, 241, 0.45)' : 'rgba(255, 255, 255, 0.06)',
          boxShadow: isFocused 
            ? '0 0 16px rgba(99, 102, 241, 0.18), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)' 
            : 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.02)',
          paddingLeft: label ? '2.5rem' : '1rem',
          paddingTop: label ? '1.25rem' : '1rem'
        }}
      />

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
