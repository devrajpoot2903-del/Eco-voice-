/**
 * ActivityFeed.jsx — Recent Activity Panel (Phase B2)
 * ----------------------------------------------------
 * B2 Upgrades:
 *   - Shows ALL transcript entries (no cap at 6)
 *   - Smooth vertical scroll
 *   - Auto-scrolls to newest entry on update
 *   - Shows intent badge when available
 */

import React, { useRef, useEffect } from 'react';
import { Mic, CheckCircle2 } from 'lucide-react';

/**
 * Props:
 *   entries — transcript entry array [{ id, text, type, timestamp }]
 */
export default function ActivityFeed({ entries = [] }) {
  const bottomRef = useRef(null);

  // B2 — Auto-scroll to newest entry whenever entries change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  // Newest last — preserve natural chronological order
  const items = [...entries];

  return (
    <div className="bg-white rounded-2xl shadow-card p-5 border border-stone-100 flex-1 min-h-0 overflow-hidden flex flex-col">
      <p className="text-sm font-bold text-stone-800 mb-4 shrink-0">Recent Activity</p>

      {/* B2 — Scrollable container with smooth scroll */}
      <div className="flex-1 overflow-y-auto space-y-3 scroll-smooth pr-0.5">
        {items.length === 0 ? (
          <p className="text-xs text-stone-400 text-center pt-6">
            No activity yet.<br />Activate the mic and speak a command.
          </p>
        ) : (
          items.map((entry) => {
            const isVoice = entry.type === 'user';
            const time = new Date(entry.timestamp).toLocaleTimeString([], {
              hour:   '2-digit',
              minute: '2-digit',
              hour12: true,
            });

            return (
              <div key={entry.id} className="flex items-start gap-2.5">
                {/* Icon */}
                <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                  isVoice ? 'bg-forest-100' : 'bg-stone-100'
                }`}>
                  {isVoice
                    ? <Mic className="w-2.5 h-2.5 text-forest-600" />
                    : <CheckCircle2 className="w-2.5 h-2.5 text-stone-400" />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {isVoice ? (
                    <p className="text-xs font-medium text-stone-700 italic leading-snug">
                      "{entry.text.length > 55 ? entry.text.slice(0, 55) + '…' : entry.text}"
                    </p>
                  ) : (
                    <p className="text-xs text-stone-600 leading-snug">{entry.text}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-stone-400">{time}</span>
                    {isVoice && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-forest-100 text-forest-700">
                        Voice
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* B2 — Scroll anchor: always at the bottom */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
