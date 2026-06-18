/**
 * ConfirmModal.jsx — EcoVoice Safety Confirmation Modal (Phase B5)
 * ----------------------------------------------------------------
 * Lightweight confirmation dialog for dangerous operations.
 * Currently used for DELETE_ALL_TASKS.
 *
 * Props:
 *   open       {boolean}   — whether modal is visible
 *   title      {string}    — modal heading
 *   message    {string}    — body copy
 *   confirmLabel {string}  — label for the destructive confirm button
 *   onConfirm  {()=>void}  — called when user confirms
 *   onCancel   {()=>void}  — called when user cancels or clicks backdrop
 */

import React, { useEffect } from 'react';

export default function ConfirmModal({
  open,
  title       = 'Are you sure?',
  message     = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Panel */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
          <span className="text-2xl" role="img" aria-label="Warning">⚠️</span>
        </div>

        {/* Title */}
        <h2
          id="confirm-modal-title"
          className="text-base font-semibold text-stone-800 text-center mb-2"
        >
          {title}
        </h2>

        {/* Message */}
        <p className="text-xs text-stone-500 text-center mb-6 leading-relaxed">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
            autoFocus
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 active:bg-red-700 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
