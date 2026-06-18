import React from 'react';
import { CheckSquare, Circle, Pin, PinOff } from 'lucide-react';

/**
 * Single task row.
 *
 * Props:
 *   task        — task object (id, label, done, pinned, source, priority, createdAt)
 *   onToggle    — (id) => void  — toggles done state
 *   onTogglePin — (id) => void  — toggles pinned state
 */
function TaskItem({ task, onToggle, onTogglePin }) {
  // Row style changes based on pinned + done state.
  const rowClass = task.done
    ? 'flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-950/30 border border-emerald-800/30 border-l-2 border-l-emerald-500/60 transition-colors'
    : task.pinned
      ? 'flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-950/30 border border-amber-700/40 border-l-2 border-l-amber-400/70 transition-colors'
      : 'flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-colors';

  return (
    <div className={rowClass}>
      {/* ── Completion toggle ─────────────────────────────────────────── */}
      <button
        onClick={() => onToggle?.(task.id)}
        aria-label={task.done ? 'Mark as incomplete' : 'Mark as complete'}
        className="shrink-0 focus:outline-none"
      >
        {task.done ? (
          <CheckSquare className="w-4 h-4 text-emerald-400" />
        ) : (
          <Circle className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />
        )}
      </button>

      {/* ── Label ────────────────────────────────────────────────────── */}
      <span className={`text-sm flex-1 ${task.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
        {task.label}
      </span>

      {/* ── Priority badge (high only) ───────────────────────────────── */}
      {task.priority === 'high' && !task.done && (
        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-red-900/60 text-red-300 border border-red-700/40 shrink-0">
          high
        </span>
      )}

      {/* ── Source / tag badge ───────────────────────────────────────── */}
      {task.tag && (
        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 shrink-0">
          {task.tag}
        </span>
      )}

      {/* ── Pin toggle ───────────────────────────────────────────────── */}
      {/* Hidden for completed tasks — pinning a done task has no visible effect */}
      {!task.done && (
        <button
          onClick={() => onTogglePin?.(task.id)}
          aria-label={task.pinned ? 'Unpin task' : 'Pin task'}
          className="shrink-0 focus:outline-none ml-1"
          title={task.pinned ? 'Unpin' : 'Pin to top'}
        >
          {task.pinned ? (
            <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
          ) : (
            <PinOff className="w-3.5 h-3.5 text-slate-600 hover:text-amber-400 transition-colors" />
          )}
        </button>
      )}
    </div>
  );
}

const PLACEHOLDER_TASKS = [
  { id: 1, label: 'Voice tasks will appear here', done: false, pinned: false, source: 'voice',  priority: 'normal', tag: 'voice' },
  { id: 2, label: 'Say a command to add a task',  done: false, pinned: false, source: 'manual', priority: 'normal', tag: 'tip' },
  { id: 3, label: 'Example high priority task',   done: false, pinned: true,  source: 'voice',  priority: 'high',   tag: null },
  { id: 4, label: 'Example completed task',        done: true,  pinned: false, source: 'voice',  priority: 'normal', tag: null },
];

/**
 * Task board.
 *
 * Expects `tasks` to be pre-sorted (useTasks already does this):
 *   pinned pending → normal pending → completed
 *
 * Props:
 *   tasks        — sorted task array from useTasks
 *   onToggle     — (id) => void
 *   onTogglePin  — (id) => void
 */
export default function TaskList({ tasks, onToggle, onTogglePin }) {
  // Use real tasks if any exist, otherwise show placeholder hints.
  const items = tasks && tasks.length > 0 ? tasks : PLACEHOLDER_TASKS;

  const pinnedCount   = items.filter(t => t.pinned && !t.done).length;
  const remainingCount = items.filter(t => !t.done).length;
  const doneCount      = items.filter(t => t.done).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          Tasks
        </div>

        {/* Counters — auto-derived from the live task array on every render */}
        <span className="flex items-center gap-2 text-xs text-slate-500">
          {pinnedCount > 0 && (
            <span className="flex items-center gap-1 text-amber-500">
              <Pin className="w-3 h-3 fill-amber-500/30" />
              {pinnedCount} pinned
            </span>
          )}
          <span>{remainingCount} remaining</span>
          {doneCount > 0 && (
            <span className="text-emerald-600">· {doneCount} done</span>
          )}
        </span>
      </div>

      {/* ── Task items ──────────────────────────────────────────────────── */}
      <div className="p-4 space-y-2">
        {items.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggle}
            onTogglePin={onTogglePin}
          />
        ))}
      </div>
    </div>
  );
}
