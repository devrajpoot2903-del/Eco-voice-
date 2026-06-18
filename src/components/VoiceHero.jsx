import React from 'react';
import { Mic } from 'lucide-react';

/**
 * VoiceHero — center panel hero section.
 * Shows the microphone button, status heading, and last transcript line.
 *
 * Props:
 *   status      — 'idle' | 'listening' | 'processing' | 'error'
 *   onClick     — () => void  (toggle mic)
 *   lastSpoken  — string | null  (last transcript text)
 */
export default function VoiceHero({ status = 'idle', onClick, lastSpoken }) {
  const isListening   = status === 'listening';
  const isProcessing  = status === 'processing';
  const isActive      = isListening || isProcessing;

  return (
    <div className="flex flex-col items-center justify-center pt-4 pb-6">
      {/* ── Mic Button with rings ──────────────────────────────────────── */}
      <div className="relative flex items-center justify-center mb-5">
        {/* Outer pulse rings — only when active */}
        {isActive && (
          <>
            <div className="absolute w-40 h-40 rounded-full bg-forest-200/40 animate-ping-slow" />
            <div className="absolute w-32 h-32 rounded-full bg-forest-200/50 animate-ping-slow-delay" />
          </>
        )}

        {/* Subtle static outer ring always visible */}
        <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 ${
          isListening  ? 'bg-forest-100/80 shadow-[0_0_40px_rgba(74,102,48,0.25)]' :
          isProcessing ? 'bg-amber-50 shadow-[0_0_30px_rgba(245,158,11,0.15)]' :
          'bg-forest-50/60'
        }`}>
          {/* Main mic button */}
          <button
            onClick={onClick}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-all duration-300 cursor-pointer outline-none ${
              isListening  ? 'bg-forest-700 shadow-[0_4px_24px_rgba(74,102,48,0.45)]' :
              isProcessing ? 'bg-amber-500' :
              'bg-forest-700 hover:bg-forest-800 hover:shadow-[0_4px_24px_rgba(74,102,48,0.35)]'
            }`}
            aria-label={isActive ? 'Stop listening' : 'Start listening'}
          >
            <Mic className="w-8 h-8 text-white" />
          </button>
        </div>
      </div>

      {/* ── Sound wave bars (visible when listening) ──────────────────── */}
      <div className={`flex items-end gap-1 mb-5 h-6 transition-opacity duration-300 ${isListening ? 'opacity-100' : 'opacity-0'}`}>
        {[3, 5, 7, 5, 3].map((h, i) => (
          <div
            key={i}
            className="wave-bar w-1 rounded-full bg-forest-500"
            style={{ height: `${h * 3}px` }}
          />
        ))}
      </div>

      {/* ── Heading ───────────────────────────────────────────────────── */}
      <h2 className="text-3xl font-extrabold text-stone-800 text-center leading-tight mb-2">
        {isListening  ? 'Listening…'    :
         isProcessing ? 'Processing…'   :
         'How can I help you\ntoday?'}
      </h2>

      {/* ── Last spoken / hint ────────────────────────────────────────── */}
      {lastSpoken ? (
        <p className="text-sm text-stone-400 text-center max-w-xs italic">
          "{lastSpoken}"
        </p>
      ) : (
        <p className="text-sm text-stone-400 text-center">
          {isListening ? 'Speak clearly into your microphone' : 'Press the mic button to start'}
        </p>
      )}
    </div>
  );
}
