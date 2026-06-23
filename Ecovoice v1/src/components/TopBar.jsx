import React from 'react';
import { Search, HelpCircle, Settings, Menu } from 'lucide-react';

/**
 * TopBar — main top navigation bar.
 * Props:
 *   isListening  — boolean mic state
 *   onMenuClick  — () => void — opens mobile sidebar
 */
export default function TopBar({
  isListening,
  onMenuClick,
  searchQuery = '',
  onSearchChange,
  onHelpClick,
  onSettingsClick,
}) {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-3 shrink-0 gap-2">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-700 transition-colors shrink-0"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <h1 className="text-base sm:text-lg font-bold text-stone-800 tracking-tight shrink-0">EcoVoice</h1>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Search bar — hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-2 bg-stone-100 border border-stone-200 rounded-full px-3 py-2 w-36 sm:w-44 md:w-52">
          <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="bg-transparent text-xs text-stone-600 placeholder-stone-400 outline-none w-full"
          />
        </div>

        {/* Mic status pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-semibold transition-all duration-300 shrink-0 ${
            isListening
              ? 'bg-forest-100 border-forest-300 text-forest-700'
              : 'bg-stone-100 border-stone-200 text-stone-400'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-forest-500 animate-ping' : 'bg-stone-300'}`} />
          <span className="hidden xs:inline">{isListening ? 'Live' : 'Off'}</span>
        </div>

        {/* Icons — hide on very small screens to prevent overflow */}
        <button
          onClick={onHelpClick}
          className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors shrink-0"
          title="Help Guide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
        <button
          onClick={onSettingsClick}
          className="hidden md:flex w-8 h-8 items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors shrink-0"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Avatar */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-forest-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
          U
        </div>
      </div>
    </header>
  );
}
