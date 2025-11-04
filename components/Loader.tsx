
import React from 'react';

export const Loader: React.FC = () => (
  <div className="mt-8 flex flex-col items-center justify-center p-8 bg-slate-800/50 rounded-xl border border-slate-700">
    <div className="w-12 h-12 border-4 border-t-cyan-400 border-r-cyan-400 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
    <p className="mt-4 text-slate-300 font-semibold tracking-wide">Optimizing your application...</p>
    <p className="mt-1 text-sm text-slate-400">Gemini is working its magic. This may take a moment.</p>
  </div>
);
