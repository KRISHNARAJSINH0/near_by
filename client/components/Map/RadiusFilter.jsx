'use client';

import React from 'react';
import { Compass } from 'lucide-react';

export default function RadiusFilter({ selectedRadius = 10, onChange }) {
  const options = [
    { label: '2 KM', value: 2 },
    { label: '5 KM', value: 5 },
    { label: '10 KM', value: 10 },
    { label: '25 KM', value: 25 }
  ];

  return (
    <div className="glass-panel p-3.5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-white/8">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/20 flex items-center justify-center">
          <Compass className="w-4 h-4 text-violet-400 animate-spin" style={{ animationDuration: '10s' }} />
        </div>
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-wider">Geospatial Scan Radius</h4>
          <p className="text-[10px] text-zinc-500">Discover recruitment pins in your vicinity</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 w-full md:w-auto bg-zinc-950/60 p-1 rounded-xl border border-white/5">
        {options.map((opt) => {
          const active = selectedRadius === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex-1 md:flex-none px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                active
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
