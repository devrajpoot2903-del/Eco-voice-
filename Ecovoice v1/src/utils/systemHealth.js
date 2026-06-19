/**
 * systemHealth.js — EcoVoice System Health Utilities (Phase A5)
 * --------------------------------------------------------------
 * Self-correction and validation utilities.
 * Run these on startup or on demand to detect and fix common data issues.
 *
 * Functions:
 *   validateAndRepairTasks(tasks)  — returns a cleaned, deduplicated task array
 *   checkLocalStorage()            — verifies localStorage is readable/writable
 *   runHealthCheck(tasks)          — returns a health report object
 */

const STORAGE_KEY = 'ecovoice:tasks';

// ─── Task validation ───────────────────────────────────────────────────────────

/**
 * Validate a single task object has all required fields with correct types.
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
 * Deduplicate tasks by label (case-insensitive, keeps first occurrence).
 * @param {Array} tasks
 * @returns {Array}
 */
function deduplicateByLabel(tasks) {
  const seen = new Set();
  return tasks.filter((t) => {
    const key = t.label.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Deduplicate tasks by ID (keeps first occurrence of each ID).
 * @param {Array} tasks
 * @returns {Array}
 */
function deduplicateById(tasks) {
  const seen = new Set();
  return tasks.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
}

/**
 * A5 — Validate and auto-repair a task array.
 *
 * Repairs applied (in order):
 *   1. Removes non-object / null entries
 *   2. Removes entries with invalid required fields
 *   3. Removes duplicate IDs (keeps first)
 *   4. Removes duplicate labels (case-insensitive, keeps first)
 *
 * @param {unknown[]} tasks
 * @returns {{ tasks: Array, removed: number, report: string[] }}
 */
export function validateAndRepairTasks(tasks) {
  const report = [];
  const original = Array.isArray(tasks) ? tasks : [];

  if (!Array.isArray(tasks)) {
    report.push('localStorage tasks was not an array — reset to []');
    return { tasks: [], removed: 0, report };
  }

  const valid = original.filter((t) => {
    if (!isValidTask(t)) {
      report.push(`Removed invalid task: ${JSON.stringify(t).slice(0, 80)}`);
      return false;
    }
    return true;
  });

  const deduped1 = deduplicateById(valid);
  if (deduped1.length < valid.length) {
    report.push(`Removed ${valid.length - deduped1.length} duplicate ID(s)`);
  }

  const deduped2 = deduplicateByLabel(deduped1);
  if (deduped2.length < deduped1.length) {
    report.push(`Removed ${deduped1.length - deduped2.length} duplicate label(s)`);
  }

  const removed = original.length - deduped2.length;
  if (removed > 0) {
    console.warn(`[EcoVoice/Health] Repaired task list: removed ${removed} item(s)`, report);
  }

  return { tasks: deduped2, removed, report };
}

// ─── localStorage health check ─────────────────────────────────────────────────

/**
 * Verify localStorage is available and the tasks key contains valid JSON.
 *
 * @returns {{ ok: boolean, issue: string|null }}
 */
export function checkLocalStorage() {
  try {
    const testKey = '__ecovoice_health_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
  } catch {
    return { ok: false, issue: 'localStorage is not available (private browsing or quota exceeded)' };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return { ok: false, issue: 'Tasks data in localStorage is not an array' };
      }
    }
  } catch {
    return { ok: false, issue: 'Tasks data in localStorage contains invalid JSON' };
  }

  return { ok: true, issue: null };
}

// ─── Full health report ────────────────────────────────────────────────────────

/**
 * Run all health checks and return a summary report.
 * Safe to call at any time — read-only, no side effects.
 *
 * @param {Array} tasks — current task array from useTasks
 * @returns {{
 *   storage:   { ok: boolean, issue: string|null },
 *   taskCount: number,
 *   issues:    string[],
 *   healthy:   boolean,
 * }}
 */
export function runHealthCheck(tasks) {
  const storage = checkLocalStorage();
  const issues = [];

  if (!storage.ok) issues.push(storage.issue);

  if (!Array.isArray(tasks)) {
    issues.push('tasks is not an array');
  } else {
    const labels = tasks.map((t) => t.label?.toLowerCase().trim()).filter(Boolean);
    const uniqueLabels = new Set(labels);
    if (uniqueLabels.size < labels.length) {
      issues.push(`${labels.length - uniqueLabels.size} duplicate task label(s) detected`);
    }

    const ids = tasks.map((t) => t.id);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size < ids.length) {
      issues.push(`${ids.length - uniqueIds.size} duplicate task ID(s) detected`);
    }
  }

  const healthy = issues.length === 0;

  if (!healthy) {
    console.warn('[EcoVoice/Health] Issues found:', issues);
  } else {
    console.info('[EcoVoice/Health] All checks passed ✓');
  }

  return {
    storage,
    taskCount: Array.isArray(tasks) ? tasks.length : 0,
    issues,
    healthy,
  };
}
