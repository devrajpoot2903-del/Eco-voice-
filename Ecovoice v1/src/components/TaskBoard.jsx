import React from 'react';
import TaskCard from './TaskCard';

/**
 * TaskBoard — renders the Today + Upcoming + Completed task sections.
 * Purely presentational; delegates all mutations via props.
 *
 * Props:
 *   tasks       — pre-sorted task array from useTasks
 *   onToggle    — (id) => void
 *   onTogglePin — (id) => void
 *   searchQuery — string | null  — D3: highlight matching tasks
 */
export default function TaskBoard({
  tasks = [],
  onToggle,
  onTogglePin,
  onTogglePriority,
  onArchive,
  searchQuery = '',
}) {
  const q = (searchQuery ?? '').trim().toLowerCase();

  // D3 — when a search is active, show ALL tasks filtered to matches only
  const isSearching = q.length > 0;

  const displayTasks = isSearching
    ? tasks.filter((t) => t.label.toLowerCase().includes(q))
    : tasks;

  const pending   = displayTasks.filter((t) => !t.done);
  const completed = displayTasks.filter((t) => t.done);

  // "Today" = first 4 pending; "Upcoming" = rest
  const todayTasks    = pending.slice(0, 4);
  const upcomingTasks = pending.slice(4);

  // D3 — helper to highlight matched text in task labels
  function Highlighted({ label }) {
    if (!q) return <span>{label}</span>;
    const idx = label.toLowerCase().indexOf(q);
    if (idx === -1) return <span>{label}</span>;
    return (
      <span>
        {label.slice(0, idx)}
        <mark className="bg-amber-200 text-amber-900 rounded px-0.5">{label.slice(idx, idx + q.length)}</mark>
        {label.slice(idx + q.length)}
      </span>
    );
  }

  return (
    <div className="space-y-5 pb-4">

      {/* D3 — search status banner */}
      {isSearching && (
        <div className="flex items-center gap-2 px-1 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <span>🔍</span>
          <span>
            {displayTasks.length > 0
              ? `Showing ${displayTasks.length} result${displayTasks.length !== 1 ? 's' : ''} for "${searchQuery}"`
              : `No tasks matching "${searchQuery}"`}
          </span>
        </div>
      )}

      {/* ── Today ─────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-base font-bold text-stone-800">
            {isSearching ? 'Results' : 'Today'}
          </h3>
          {pending.length > 0 && (
            <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
              {pending.length} {pending.length === 1 ? 'task' : 'tasks'}
            </span>
          )}
        </div>

        {todayTasks.length === 0 ? (
          <div className="text-center py-8 text-stone-400">
            <p className="text-sm">{isSearching ? 'No matching tasks.' : 'No tasks for today.'}</p>
            {!isSearching && <p className="text-xs mt-1 text-stone-300">Use the mic to add one.</p>}
          </div>
        ) : (
          <div className="space-y-0.5">
            {todayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={onToggle}
                onTogglePin={onTogglePin}
                onTogglePriority={onTogglePriority}
                onArchive={onArchive}
                highlighted={isSearching}
                searchQuery={q}
                LabelRenderer={Highlighted}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Upcoming ──────────────────────────────────────────────────── */}
      {upcomingTasks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-base font-bold text-stone-800">Upcoming</h3>
            <button className="text-[11px] font-semibold text-forest-700 hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-0.5">
            {upcomingTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={onToggle}
                onTogglePin={onTogglePin}
                onTogglePriority={onTogglePriority}
                onArchive={onArchive}
                highlighted={isSearching}
                searchQuery={q}
                LabelRenderer={Highlighted}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Completed ─────────────────────────────────────────────────── */}
      {completed.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-sm font-semibold text-stone-400">Completed</h3>
            <span className="text-[11px] text-stone-300">{completed.length} done</span>
          </div>
          <div className="space-y-0.5 opacity-75">
            {completed.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={onToggle}
                onTogglePin={onTogglePin}
                onTogglePriority={onTogglePriority}
                onArchive={onArchive}
                highlighted={isSearching}
                searchQuery={q}
                LabelRenderer={Highlighted}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
