import React from 'react';
import { Search, HelpCircle, Settings, Mic, MicOff } from 'lucide-react';

/**
 * TopBar — main top navigation bar inside the content area.
 * Pure presentational component.
 *
 * Props:
 *   isListening — boolean mic state from speechRecognition
 */
export default function TopBar({ isListening }) {
  return (
    <header className="flex items-center justify-between px-8 pt-6 pb-3 shrink-0">
      {/* Page title */}
      <h1 className="text-lg font-bold text-stone-800 tracking-tight">EcoVoice</h1>

      {/* Search + icons */}
      <div className="flex items-center gap-3">
        {/* Search bar */}
        <div className="flex items-center gap-2 bg-stone-100 border border-stone-200 rounded-full px-4 py-2 w-52">
          <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="bg-transparent text-xs text-stone-600 placeholder-stone-400 outline-none w-full"
            readOnly
          />
        </div>

        {/* Mic status indicator */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all duration-300 ${
            isListening
              ? 'bg-forest-100 border-forest-300 text-forest-700'
              : 'bg-stone-100 border-stone-200 text-stone-400'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-forest-500 animate-ping' : 'bg-stone-300'}`} />
          {isListening ? 'Live' : 'Mic Off'}
        </div>

        {/* Icon group */}
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors">
          <Settings className="w-4 h-4" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-forest-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
          U
        </div>
      </div>
    </header>
  );
}
