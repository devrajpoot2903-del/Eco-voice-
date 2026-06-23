import React from 'react';
import { Archive, RotateCcw, Trash2, Calendar } from 'lucide-react';

export default function ArchivePanel({ archivedTasks = [], onRestore, onDelete }) {
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to permanently delete all archived tasks? This action is irreversible.')) {
      archivedTasks.forEach((t) => onDelete?.(t.id));
    }
  };

  const handleRestoreAll = () => {
    if (window.confirm('Restore all archived tasks back to your active list?')) {
      archivedTasks.forEach((t) => onRestore?.(t.id));
    }
  };

  return (
    <div className="flex flex-col h-full mt-4 sm:mt-6 min-h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1 shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-800">Archived Tasks</h2>
          <p className="text-xs text-stone-400 mt-0.5">View and manage tasks you've archived</p>
        </div>
        {archivedTasks.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestoreAll}
              className="flex items-center gap-1 text-[11px] font-bold text-forest-700 hover:bg-forest-50 px-2.5 py-1.5 rounded-lg transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore All
            </button>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete All
            </button>
          </div>
        )}
      </div>

      {/* Archive List */}
      <div className="flex-1 overflow-y-auto space-y-2 pb-4 px-1 min-h-0">
        {archivedTasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-100 p-6">
            <Archive className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-stone-600">Your archive is empty.</p>
            <p className="text-xs text-stone-400 mt-1">Archived tasks will appear here for safekeeping.</p>
          </div>
        ) : (
          archivedTasks.map((task) => {
            const date = new Date(task.createdAt);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

            return (
              <div
                key={task.id}
                className="bg-white hover:bg-stone-50/30 border border-stone-200/50 rounded-xl p-3.5 transition-colors flex items-center justify-between gap-4 group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-stone-700 leading-snug line-through opacity-75">
                    {task.label}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-stone-400 mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>Created {dateStr} at {timeStr}</span>
                    {task.priority === 'high' && (
                      <span className="ml-1 text-[8px] font-extrabold uppercase px-1 rounded bg-red-50 text-red-500 border border-red-100">
                        high
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onRestore?.(task.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-500 hover:text-forest-700 hover:bg-forest-50 transition-colors"
                    title="Restore task"
                    aria-label="Restore task"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Permanently delete "${task.label}"?`)) {
                        onDelete?.(task.id);
                      }
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete permanently"
                    aria-label="Delete permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
