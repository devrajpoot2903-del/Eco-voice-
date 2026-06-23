import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Pin, AlertCircle } from 'lucide-react';

export default function CreateTaskModal({ open, onClose, onSave }) {
  const [label, setLabel] = useState('');
  const [priority, setPriority] = useState('normal');
  const [pinned, setPinned] = useState(false);
  const inputRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setLabel('');
      setPriority('normal');
      setPinned(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!label.trim()) return;
    onSave?.(label.trim(), { priority, pinned });
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-task-title"
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 id="create-task-title" className="text-base font-bold text-stone-800">
            Create New Task
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="task-label" className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
              Task Description
            </label>
            <input
              id="task-label"
              ref={inputRef}
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="What do you need to do?"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-forest-600 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Priority */}
          <div>
            <span className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Priority
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPriority('normal')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  priority === 'normal'
                    ? 'bg-stone-50 border-stone-300 text-stone-700 shadow-sm'
                    : 'bg-white border-stone-200 text-stone-400 hover:bg-stone-50/50'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => {
                  setPriority('high');
                  setPinned(true); // High priority auto-pins
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  priority === 'high'
                    ? 'bg-red-50 border-red-200 text-red-700 shadow-sm'
                    : 'bg-white border-stone-200 text-stone-400 hover:bg-stone-50/50'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                High
              </button>
            </div>
          </div>

          {/* Pin option */}
          <div className="flex items-center justify-between bg-stone-50 rounded-xl p-3 border border-stone-100">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-amber-500 fill-amber-500/20" />
              <div>
                <span className="block text-xs font-bold text-stone-700 leading-none">Pin Task</span>
                <span className="text-[10px] text-stone-400 mt-0.5 block">Float this task to the top of your list</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                disabled={priority === 'high'} // High priority is always pinned
                onChange={(e) => setPinned(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-stone-200 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-forest-600"></div>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-forest-700 hover:bg-forest-800 active:bg-forest-900 transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
