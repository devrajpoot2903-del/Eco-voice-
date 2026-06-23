/**
 * useTasks.js  (Phase 3)
 * -----------------------
 * Domain hook that manages the EcoVoice task list.
 *
 * Responsibilities:
 *   - Persists tasks to localStorage via useLocalStorage.
 *   - Exposes a clean, intent-driven API — App.jsx only calls named actions.
 *   - Returns tasks pre-sorted so components need zero sort logic.
 *   - Keeps App.jsx free of any storage or mutation logic.
 *
 * MongoDB migration path:
 *   1. Replace `useLocalStorage` with a `useQuery`/`useMutation` pair.
 *   2. Swap action functions with API calls.
 *   3. App.jsx requires zero changes.
 *
 * Task shape  (Phase 3):
 *   {
 *     id:        number,         — Date.now() at creation (swap for ObjectId in MongoDB)
 *     label:     string,         — human-readable task text
 *     done:      boolean,        — completion status
 *     pinned:    boolean,        — pin / float-to-top status
 *     source:    'voice'|'manual', — how the task was created
 *     priority:  'normal'|'high',  — explicit priority level
 *     createdAt: number,         — Unix ms timestamp
 *   }
 *
 * Sort order (enforced by sortTasks):
 *   1. High-priority + pending  (priority=high, done=false)
 *   2. Pinned + pending         (pinned=true,   done=false)
 *   3. Normal pending
 *   4. Completed
 */

import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

const TASKS_KEY = 'tasks'; // resolves to localStorage key "ecovoice:tasks"

// ---------------------------------------------------------------------------
// Module-private helpers
// ---------------------------------------------------------------------------

/**
 * Fuzzy matcher — returns true when taskLabel contains every word of query,
 * case-insensitively. Supports partial / substring matching.
 *
 * @param {string} taskLabel
 * @param {string} query
 * @returns {boolean}
 */
function matchesTask(taskLabel, query) {
  const label = taskLabel.toLowerCase().trim();
  const q     = query.toLowerCase().trim();
  if (label.includes(q)) return true;
  return q.split(/\s+/).filter(Boolean).every((w) => label.includes(w));
}

/**
 * Ensure legacy tasks (created before Phase 3) always have the new fields
 * so the UI never crashes on undefined access.
 *
 * @param {object} t — raw task from localStorage
 * @returns {object}
 */
function migrateTask(t) {
  return {
    source:   'voice',
    priority: 'normal',
    archived: false,
    ...t,
    pinned: t.pinned ?? false,
    archived: t.archived ?? false,
  };
}

/**
 * A5 — Validate a task object is safe to use.
 * Filters out corrupted / partial localStorage entries.
 *
 * @param {unknown} t
 * @returns {boolean}
 */
function isValidTask(t) {
  return (
    t !== null &&
    typeof t === 'object' &&
    typeof t.id === 'number' &&
    typeof t.label === 'string' &&
    t.label.trim().length > 0 &&
    typeof t.done === 'boolean'
  );
}

/**
 * Sort comparator:
 *   high-priority pending → pinned pending → normal pending → completed
 *
 * Within each group, creation order is preserved (stable sort).
 */
function sortTasks(a, b) {
  const rank = (t) => {
    if (t.done)                                    return 3; // completed last
    if (!t.done && t.priority === 'high')          return 0; // high priority first
    if (!t.done && t.pinned)                       return 1; // pinned second
    return 2;                                                 // normal pending
  };
  return rank(a) - rank(b);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * @returns {{
 *   tasks:              Array<Task>,  — pre-sorted
 *   addTask:            (label: string, opts?: {source?, priority?}) => void,
 *   deleteByQuery:      (query: string) => void,
 *   completeByQuery:    (query: string) => void,
 *   uncompleteByQuery:  (query: string) => void,
 *   toggleTask:         (id: number) => void,
 *   pinByQuery:         (query: string) => void,
 *   unpinByQuery:       (query: string) => void,
 *   togglePin:          (id: number) => void,
 *   setPriorityByQuery: (query: string, priority: 'high'|'normal') => void,
 * }}
 */
export function useTasks() {
  const [rawTasks, setTasks] = useLocalStorage(TASKS_KEY, []);

  // Migrate legacy tasks, filter invalid entries, and sort on every rawTasks change.
  const tasks = useMemo(
    () =>
      (Array.isArray(rawTasks) ? rawTasks : [])
        .filter(isValidTask)
        .map(migrateTask)
        .filter((t) => !t.archived)
        .sort(sortTasks),
    [rawTasks],
  );

  const archivedTasks = useMemo(
    () =>
      (Array.isArray(rawTasks) ? rawTasks : [])
        .filter(isValidTask)
        .map(migrateTask)
        .filter((t) => t.archived)
        .sort((a, b) => b.createdAt - a.createdAt),
    [rawTasks],
  );

  // ── Create ────────────────────────────────────────────────────────────────

  /**
   * Add a new task to the list.
   *
   * @param {string} label
   * @param {{ source?: 'voice'|'manual', priority?: 'normal'|'high' }} opts
   */
  const addTask = useCallback((label, opts = {}) => {
    // A1 — guard: reject empty or non-string labels
    if (!label || typeof label !== 'string' || label.trim().length === 0) {
      console.warn('[EcoVoice/Tasks] addTask: rejected empty label');
      return;
    }
    const cleanLabel = label.trim();

    setTasks((prev) => {
      // A1 — guard: prevent exact duplicate labels (case-insensitive)
      const exists = prev.some(
        (t) => t.label.toLowerCase() === cleanLabel.toLowerCase()
      );
      if (exists) {
        console.warn('[EcoVoice/Tasks] addTask: duplicate task ignored:', cleanLabel);
        return prev; // no state change
      }
      const now = Date.now();
      return [
        ...prev,
        {
          id:        now,
          label:     cleanLabel,
          done:      false,
          pinned:    opts.priority === 'high' || opts.pinned === true,
          source:    opts.source   ?? 'voice',
          priority:  opts.priority ?? 'normal',
          createdAt: now,
        },
      ];
    });
  }, [setTasks]);

  // ── Delete ────────────────────────────────────────────────────────────────

  /** Remove all fuzzy-matching tasks. */
  const deleteByQuery = useCallback((query) => {
    setTasks((prev) => prev.filter((t) => !matchesTask(t.label, query)));
  }, [setTasks]);

  // ── Completion ────────────────────────────────────────────────────────────

  /** Set done = true on all fuzzy-matching tasks. */
  const completeByQuery = useCallback((query) => {
    setTasks((prev) =>
      prev.map((t) => matchesTask(t.label, query) ? { ...t, done: true } : t)
    );
  }, [setTasks]);

  /** Set done = false on all fuzzy-matching tasks. */
  const uncompleteByQuery = useCallback((query) => {
    setTasks((prev) =>
      prev.map((t) => matchesTask(t.label, query) ? { ...t, done: false } : t)
    );
  }, [setTasks]);

  /**
   * Toggle done/not-done by id.
   * Used by the checkbox button in TaskItem.
   */
  const toggleTask = useCallback((id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }, [setTasks]);

  // ── Pin / Unpin ───────────────────────────────────────────────────────────

  /** Set pinned = true on all fuzzy-matching tasks. */
  const pinByQuery = useCallback((query) => {
    setTasks((prev) =>
      prev.map((t) => matchesTask(t.label, query) ? { ...t, pinned: true } : t)
    );
  }, [setTasks]);

  /** Set pinned = false on all fuzzy-matching tasks. */
  const unpinByQuery = useCallback((query) => {
    setTasks((prev) =>
      prev.map((t) => matchesTask(t.label, query) ? { ...t, pinned: false } : t)
    );
  }, [setTasks]);

  /** Toggle pinned state by id (used by the pin button in TaskItem). */
  const togglePin = useCallback((id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t))
    );
  }, [setTasks]);

  // ── Priority ──────────────────────────────────────────────────────────────

  /**
   * Set the priority field on all fuzzy-matching tasks.
   * High-priority tasks are also auto-pinned; normal reverts pin if it was
   * set by a previous high-priority command (manual pins are preserved via
   * the PIN_TASK intent, not here).
   *
   * @param {string}           query
   * @param {'high'|'normal'}  priority
   */
  const setPriorityByQuery = useCallback((query, priority) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (!matchesTask(t.label, query)) return t;
        return {
          ...t,
          priority,
          // Auto-pin on high; only auto-unpin if it was set by a priority
          // command (i.e. priority was previously 'high'). Manual pins survive.
          pinned: priority === 'high' ? true : (t.priority === 'high' ? false : t.pinned),
        };
      })
    );
  }, [setTasks]);

  // ── Bulk operations ───────────────────────────────────────────────────────

  /** B3 — Remove every task. Returns the count deleted (for voice feedback). */
  const deleteAllTasks = useCallback(() => {
    let deleted = 0;
    setTasks((prev) => {
      deleted = prev.length;
      return [];
    });
    return deleted;
  }, [setTasks]);

  /** B4 — Mark every pending task as done. Returns count affected. */
  const completeAllTasks = useCallback(() => {
    let affected = 0;
    setTasks((prev) => {
      const next = prev.map((t) => {
        if (t.done) return t;
        affected += 1;
        return { ...t, done: true };
      });
      return next;
    });
    return affected;
  }, [setTasks]);

  // ── Undo helpers ──────────────────────────────────────────────────────────

  /**
   * D1 — Restore one or more previously deleted task objects.
   * Skips any task whose id already exists (idempotent).
   * @param {object[]} taskObjects — full task shapes to re-insert
   */
  const restoreTasks = useCallback((taskObjects) => {
    if (!Array.isArray(taskObjects) || taskObjects.length === 0) return;
    setTasks((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const toAdd = taskObjects.filter((t) => !existingIds.has(t.id));
      if (toAdd.length === 0) return prev;
      return [...prev, ...toAdd];
    });
  }, [setTasks]);

  /**
   * D1 — Uncomplete tasks that match a query (used by undo COMPLETE_TASK).
   * Alias kept separate so the intent is explicit at the call site.
   */
  const uncompleteByIds = useCallback((ids) => {
    const idSet = new Set(ids);
    setTasks((prev) =>
      prev.map((t) => idSet.has(t.id) ? { ...t, done: false } : t)
    );
  }, [setTasks]);

  /**
   * D1 — Unpin tasks by id set (used by undo PIN_TASK).
   */
  const unpinByIds = useCallback((ids) => {
    const idSet = new Set(ids);
    setTasks((prev) =>
      prev.map((t) => idSet.has(t.id) ? { ...t, pinned: false } : t)
    );
  }, [setTasks]);

  /**
   * D1 — Re-pin tasks by id set (used by undo UNPIN_TASK).
   */
  const pinByIds = useCallback((ids) => {
    const idSet = new Set(ids);
    setTasks((prev) =>
      prev.map((t) => idSet.has(t.id) ? { ...t, pinned: true } : t)
    );
  }, [setTasks]);

  const archiveTask = useCallback((id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, archived: true } : t))
    );
  }, [setTasks]);

  const restoreTask = useCallback((id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, archived: false } : t))
    );
  }, [setTasks]);

  const togglePriority = useCallback((id) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const newPriority = t.priority === 'high' ? 'normal' : 'high';
        return {
          ...t,
          priority: newPriority,
          pinned: newPriority === 'high' ? true : t.pinned,
        };
      })
    );
  }, [setTasks]);

  const deleteTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, [setTasks]);

  return {
    tasks,
    archivedTasks,
    addTask,
    deleteByQuery,
    completeByQuery,
    uncompleteByQuery,
    toggleTask,
    pinByQuery,
    unpinByQuery,
    togglePin,
    setPriorityByQuery,
    deleteAllTasks,
    completeAllTasks,
    archiveTask,
    restoreTask,
    togglePriority,
    deleteTask,
    // D1 — undo helpers
    restoreTasks,
    uncompleteByIds,
    unpinByIds,
    pinByIds,
  };
}
