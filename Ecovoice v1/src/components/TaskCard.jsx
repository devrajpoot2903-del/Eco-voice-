import React from 'react';
import { Pin, CheckSquare, Circle } from 'lucide-react';

/**
 * TaskCard — single task row in the task board.
 * Matches the design reference: left priority dot, task label, meta row.
 *
 * Props:
 *   task        — task object { id, label, done, pinned, priority, source, createdAt }
 *   onToggle    — (id) => void — toggles done state
 *   onTogglePin — (id) => void — toggles pinned state
 */
export default function TaskCard({ task, onToggle, onTogglePin, LabelRenderer }) {
  // Priority dot color
  const dotColor =
    task.done        ? 'bg-stone-300' :
    task.priority === 'high' || task.pinned ? 'bg-red-500' :
    'bg-forest-500';

  // Time display: use createdAt as a proxy for "due at"
  const timeStr = new Date(task.createdAt).toLocaleTimeString([], {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  }).toUpperCase();

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
      task.done
        ? 'opacity-60'
        : 'hover:bg-stone-100/60'
    }`}>
      {/* Priority dot — clicks to toggle pin */}
      <button
        onClick={() => onTogglePin?.(task.id)}
        className="shrink-0 mt-1 focus:outline-none"
        title={task.pinned ? 'Unpin' : 'Pin to top'}
      >
        <span className={`block w-2.5 h-2.5 rounded-full ${dotColor} transition-colors`} />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <button
          onClick={() => onToggle?.(task.id)}
          className="w-full text-left focus:outline-none"
        >
          <p className={`text-sm font-semibold leading-snug ${
            task.done ? 'line-through text-stone-400' : 'text-stone-800'
          }`}>
            {LabelRenderer ? <LabelRenderer label={task.label} /> : task.label}
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5 uppercase tracking-wide">
            {task.done ? 'Completed' : `Due at ${timeStr}`}
          </p>
        </button>
      </div>

      {/* Right side: badges */}
      <div className="flex items-center gap-1.5 shrink-0">
        {task.pinned && !task.done && (
          <Pin className="w-3 h-3 text-amber-500 fill-amber-400/30" />
        )}
        {task.priority === 'high' && !task.done && (
          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
            high
          </span>
        )}
        {/* Completion toggle icon */}
        <button
          onClick={() => onToggle?.(task.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
          aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.done
            ? <CheckSquare className="w-3.5 h-3.5 text-forest-600" />
            : <Circle className="w-3.5 h-3.5 text-stone-300 hover:text-forest-500 transition-colors" />
          }
        </button>
      </div>
    </div>
  );
}
