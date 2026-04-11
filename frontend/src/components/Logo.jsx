import React from 'react';
import { Target } from 'lucide-react';

export default function Logo() {
  return (
    <div className="flex items-center gap-2 group cursor-pointer">
      {/* The Icon/Logo Mark */}
      <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
        <Target className="w-6 h-6 text-white" strokeWidth={2.5} />
        {/* Subtle "Ping" effect to show AI is 'active' */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 border-2 border-white"></span>
        </span>
      </div>

      {/* The Text Branding */}
      <div className="flex flex-col leading-none">
        <span className="text-xl font-black tracking-tight text-slate-900">
          Match<span className="text-blue-600">Talent</span>
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
          AI Powered
        </span>
      </div>
    </div>
  );
}