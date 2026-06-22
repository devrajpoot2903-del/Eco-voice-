/**
 * HelpPanel.jsx — EcoVoice Help Panel (Phase A6)
 * ------------------------------------------------
 * Lightweight overlay showing all supported voice commands.
 * Triggered by voice ("help", "what can you do") or a keyboard shortcut.
 * Does NOT redesign existing UI — renders as a floating sheet over the app.
 */

import React from 'react';

const COMMANDS = [
  {
    category: 'Create Task',
    icon: '➕',
    examples: [
      '"I need to study DSA"',
      '"Remind me to call mom"',
      '"Buy groceries tomorrow"',
      '"Schedule gym session"',
    ],
  },
  {
    category: 'Delete Task',
    icon: '🗑️',
    examples: [
      '"Delete study DSA"',
      '"Remove buy groceries"',
      '"Erase call mom"',
    ],
  },
  {
    category: 'Complete Task',
    icon: '✅',
    examples: [
      '"Complete study DSA"',
      '"Mark call mom as done"',
      '"Finish buy groceries"',
    ],
  },
  {
    category: 'Pin Task',
    icon: '📌',
    examples: [
      '"Pin study DSA"',
      '"Star buy groceries"',
      '"Mark call mom important"',
    ],
  },
  {
    category: 'Set Priority',
    icon: '🔴',
    examples: [
      '"Mark study DSA high priority"',
      '"Make call mom urgent"',
      '"Set groceries to normal priority"',
    ],
  },
  {
    category: 'Chat Mode',
    icon: '💬',
    examples: [
      '"What can you do?"',
      '"How do priorities work?"',
      '"Namaste" / "Hello"',
    ],
  },
];

/**
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function HelpPanel({ open, onClose }) {
  if (!open) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="EcoVoice Help"
    >
      {/* Panel — stop propagation so clicking inside doesn't close */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-3 sm:mx-4 max-h-[90vh] sm:max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-stone-100 gap-2">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-stone-800 truncate">Voice Commands</h2>
            <p className="text-xs text-stone-400 mt-0.5">Speak naturally — EcoVoice understands you</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors text-lg"
            aria-label="Close help panel"
          >
            ✕
          </button>
        </div>

        {/* Command list */}
        <div className="px-4 sm:px-6 py-4 space-y-4 sm:space-y-5">
          {COMMANDS.map((group) => (
            <div key={group.category}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{group.icon}</span>
                <span className="text-sm font-semibold text-stone-700">{group.category}</span>
              </div>
              <ul className="space-y-1 pl-6 sm:pl-7">
                {group.examples.map((ex) => (
                  <li
                    key={ex}
                    className="text-xs text-stone-500 font-mono bg-stone-50 rounded px-2 py-1 border border-stone-100 break-words"
                  >
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="px-4 sm:px-6 pb-5">
          <p className="text-xs text-stone-400 text-center">
            Tip: Say <span className="font-medium text-stone-500">"help"</span> anytime to open this panel
          </p>
        </div>
      </div>
    </div>
  );
}
