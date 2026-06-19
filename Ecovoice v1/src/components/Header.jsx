import React from 'react';
import { Mic, MicOff, Leaf } from 'lucide-react';

export default function Header({ isListening }) {
  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
      {/* Logo + Title */}
      <div className="flex items-center gap-3">
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
          <Leaf className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white leading-none">EcoVoice</h1>
          <p className="text-xs text-slate-500 mt-0.5">Voice-Controlled Task Manager</p>
        </div>
      </div>

      {/* Mic Status Indicator */}
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all duration-300 ${
          isListening
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-slate-800 border-slate-700 text-slate-400'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isListening ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
          }`}
        />
        {isListening ? 'Mic Active' : 'Mic Off'}
        {isListening ? (
          <Mic className="w-3.5 h-3.5" />
        ) : (
          <MicOff className="w-3.5 h-3.5" />
        )}
      </div>
    </header>
  );
}
