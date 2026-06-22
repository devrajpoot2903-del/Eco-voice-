import React from 'react';
import { Mic } from 'lucide-react';

export default function VoiceHero({ status = 'idle', onClick, lastSpoken }) {
  const isListening   = status === 'listening';
  const isProcessing  = status === 'processing';
  const isSpeaking    = status === 'speaking';
  const isActive      = isListening || isProcessing || isSpeaking;

  return (
    <div className="flex flex-col items-center justify-center pt-3 sm:pt-4 pb-4 sm:pb-6">
      {/* Mic Button with rings */}
      <div className="relative flex items-center justify-center mb-4 sm:mb-5">
        {/* Outer pulse rings */}
        {isActive && (
          <>
            <div className="absolute w-32 sm:w-40 h-32 sm:h-40 rounded-full bg-forest-200/40 animate-ping-slow" />
            <div className="absolute w-24 sm:w-32 h-24 sm:h-32 rounded-full bg-forest-200/50 animate-ping-slow-delay" />
          </>
        )}

        {/* Static outer ring */}
        <div className={`w-20 sm:w-28 h-20 sm:h-28 rounded-full flex items-center justify-center transition-all duration-500 ${
          isListening  ? 'bg-forest-100/80 shadow-[0_0_40px_rgba(74,102,48,0.25)]' :
          isProcessing ? 'bg-amber-50 shadow-[0_0_30px_rgba(245,158,11,0.15)]' :
          isSpeaking   ? 'bg-blue-50 shadow-[0_0_30px_rgba(59,130,246,0.15)]' :
          'bg-forest-50/60'
        }`}>
          {/* Main mic button */}
          <button
            onClick={onClick}
            className={`w-14 sm:w-20 h-14 sm:h-20 rounded-full flex items-center justify-center shadow-md transition-all duration-300 cursor-pointer outline-none ${
              isListening  ? 'bg-forest-700 shadow-[0_4px_24px_rgba(74,102,48,0.45)]' :
              isProcessing ? 'bg-amber-500' :
              isSpeaking   ? 'bg-blue-500' :
              'bg-forest-700 hover:bg-forest-800 hover:shadow-[0_4px_24px_rgba(74,102,48,0.35)]'
            }`}
            aria-label={isActive ? 'Stop listening' : 'Start listening'}
          >
            <Mic className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
          </button>
        </div>
      </div>

      {/* Sound wave bars */}
      <div className={`flex items-end gap-1 mb-4 sm:mb-5 h-5 sm:h-6 transition-opacity duration-300 ${isListening ? 'opacity-100' : 'opacity-0'}`}>
        {[3, 5, 7, 5, 3].map((h, i) => (
          <div
            key={i}
            className="wave-bar w-1 rounded-full bg-forest-500"
            style={{ height: `${h * 3}px` }}
          />
        ))}
      </div>

      {/* Heading */}
      <h2 className="text-xl sm:text-3xl font-extrabold text-stone-800 text-center leading-tight mb-2 px-4">
        {isListening  ? 'Listening…'  :
         isProcessing ? 'Processing…' :
         isSpeaking   ? 'Speaking…'   :
         'How can I help you today?'}
      </h2>

      {/* Last spoken / hint */}
      {lastSpoken ? (
        <p className="text-xs sm:text-sm text-stone-400 text-center max-w-[260px] sm:max-w-xs italic px-4 line-clamp-2">
          "{lastSpoken}"
        </p>
      ) : (
        <p className="text-xs sm:text-sm text-stone-400 text-center px-4">
          {isListening ? 'Speak clearly into your microphone' : 'Press the mic button to start'}
        </p>
      )}
    </div>
  );
}
