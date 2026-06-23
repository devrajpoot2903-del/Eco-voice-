import React from 'react';
import { Pin, CheckSquare, Circle, Archive, AlertCircle } from 'lucide-react';

/**
 * TaskCard — single task row in the task board.
 * Matches the design reference: left priority dot, task label, meta row.
 *
 * Props:
 *   task             — task object { id, label, done, pinned, priority, source, createdAt }
 *   onToggle         — (id) => void — toggles done state
 *   onTogglePin      — (id) => void — toggles pinned state
 *   onTogglePriority — (id) => void — toggles priority (high/normal)
 *   onArchive        — (id) => void — archives task
 */
export default function TaskCard({ task, onToggle, onTogglePin, onTogglePriority, onArchive, LabelRenderer }) {
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

      {/* Right side: badges & hover actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Pinned badge (static - hidden on hover when action buttons appear) */}
        {task.pinned && !task.done && (
          <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-400/30 group-hover:hidden transition-all duration-150" />
        )}
        {/* Priority badge (static - hidden on hover when action buttons appear) */}
        {task.priority === 'high' && !task.done && (
          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200 group-hover:hidden transition-all duration-150">
            high
          </span>
        )}

        {/* Hover action menu buttons */}
        <div className="hidden group-hover:flex items-center gap-1.5 transition-all duration-150">
          {!task.done && (
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePriority?.(task.id); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-200/80 text-stone-400 hover:text-stone-600 transition-colors"
              title={task.priority === 'high' ? 'Set Normal Priority' : 'Set High Priority'}
              aria-label="Toggle priority"
            >
              <AlertCircle className={`w-3.5 h-3.5 ${task.priority === 'high' ? 'text-red-500' : ''}`} />
            </button>
          )}

          {!task.done && (
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePin?.(task.id); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-200/80 text-stone-400 hover:text-amber-500 transition-colors"
              title={task.pinned ? 'Unpin' : 'Pin'}
              aria-label="Toggle pin"
            >
              <Pin className={`w-3.5 h-3.5 ${task.pinned ? 'text-amber-500 fill-amber-400/20' : ''}`} />
            </button>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); onArchive?.(task.id); }}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-200/80 text-stone-400 hover:text-forest-700 transition-colors"
            title="Archive"
            aria-label="Archive task"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Completion checkbox button */}
        <button
          onClick={() => onToggle?.(task.id)}
          className="focus:outline-none"
          aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.done
            ? <CheckSquare className="w-4 h-4 text-forest-600" />
            : <Circle className="w-4 h-4 text-stone-300 hover:text-forest-500 transition-colors" />
          }
        </button>
      </div>
    </div>
  );
}
