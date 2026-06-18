import React from 'react';
import { Mic } from 'lucide-react';

const STATUS_MAP = {
  idle: {
    label: 'Ready to Listen',
    sub: 'Press the button to activate voice input.',
    ring: 'border-slate-700',
    glow: '',
    icon: 'text-slate-400',
    button: 'bg-slate-800 border-slate-700 hover:border-emerald-500/50 hover:text-emerald-400 hover:shadow-[0_0_24px_rgba(16,185,129,0.12)]',
  },
  listening: {
    label: 'Listening…',
    sub: 'Speak clearly into your microphone.',
    ring: 'border-emerald-500/40 animate-pulse',
    glow: 'shadow-[0_0_48px_rgba(16,185,129,0.25)]',
    icon: 'text-emerald-400',
    button: 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_32px_rgba(16,185,129,0.2)]',
  },
  processing: {
    label: 'Processing…',
    sub: 'Analyzing your voice input.',
    ring: 'border-amber-500/40 animate-pulse',
    glow: '',
    icon: 'text-amber-400',
    button: 'bg-amber-500/10 border-amber-500/60 text-amber-400',
  },
};

export default function MicButton({ status = 'idle', onClick }) {
  const state = STATUS_MAP[status] || STATUS_MAP.idle;

  return (
    <div className="flex flex-col items-center justify-center gap-8 h-full py-10">
      {/* Outer decorative ring */}
      <div className={`relative flex items-center justify-center w-52 h-52 rounded-full border-2 ${state.ring} transition-all duration-500`}>
        {/* Inner glow layer */}
        <div className={`absolute inset-4 rounded-full border border-slate-800 ${state.glow} transition-all duration-500`} />

        {/* Mic Button */}
        <button
          onClick={onClick}
          className={`relative z-10 w-36 h-36 rounded-full border-2 flex items-center justify-center transition-all duration-300 outline-none cursor-pointer ${state.button}`}
        >
          <Mic className={`w-14 h-14 transition-colors duration-300 ${state.icon}`} />
        </button>

        {/* Rotating dashed ring when listening */}
        {status === 'listening' && (
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/20 animate-[spin_12s_linear_infinite]" />
        )}
      </div>

      {/* Status text */}
      <div className="text-center space-y-1.5">
        <p className="text-base font-semibold text-white tracking-tight">{state.label}</p>
        <p className="text-sm text-slate-400">{state.sub}</p>
      </div>
    </div>
  );
}
