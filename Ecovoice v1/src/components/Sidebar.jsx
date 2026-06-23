import React from 'react';
import { CalendarDays, RotateCcw, Archive, Settings, Plus, Leaf, X } from 'lucide-react';

const NAV_ITEMS = [
  { icon: CalendarDays, label: 'Today',    id: 'today' },
  { icon: CalendarDays, label: 'Upcoming', id: 'upcoming' },
  { icon: RotateCcw,    label: 'History',  id: 'history' },
];

const BOTTOM_NAV = [
  { icon: Archive,  label: 'Archive',  id: 'archive' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

export default function Sidebar({ activeNav = 'today', onNav, onNewTask }) {
  return (
    <aside className="w-60 shrink-0 bg-cream flex flex-col h-full border-r border-stone-200/80">
      {/* Brand + close button on mobile */}
      <div className="px-6 pt-7 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-forest-700" />
            <span className="text-sm font-bold text-forest-900 tracking-tight">EcoVoice</span>
          </div>
          {/* Close button — visible only on mobile when sidebar is open */}
          <button
            onClick={onNewTask}
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-stone-400 leading-none pl-6">Your Voice, Organized</p>

        {/* New Task Button */}
        <button
          onClick={onNewTask}
          className="mt-5 w-full flex items-center justify-center gap-2 bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors duration-200 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ icon: Icon, label, id }) => (
          <button
            key={id}
            onClick={() => onNav?.(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              activeNav === id
                ? 'bg-forest-100 text-forest-800'
                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* Bottom Nav */}
      <nav className="px-3 pb-6 space-y-0.5 border-t border-stone-200/60 pt-4 mt-2">
        {BOTTOM_NAV.map(({ icon: Icon, label, id }) => (
          <button
            key={id}
            onClick={() => onNav?.(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              activeNav === id
                ? 'bg-forest-100 text-forest-800'
                : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
