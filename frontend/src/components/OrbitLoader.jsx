import React from 'react';

export default function OrbitLoader({ statusText = 'Processing...', subtitle = 'Please wait while Veritas AI completes calculations' }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-300">
      <div className="orbit-spinner mb-8 shadow-[0_0_50px_rgba(99,102,241,0.15)]">
        <div className="orbit"></div>
        <div className="orbit"></div>
        <div className="orbit"></div>
      </div>
      <h3 className="text-sm font-bold tracking-widest text-indigo-300 uppercase animate-pulse">
        {statusText}
      </h3>
      <p className="text-slate-400 text-xs mt-2 max-w-xs">
        {subtitle}
      </p>
    </div>
  );
}
