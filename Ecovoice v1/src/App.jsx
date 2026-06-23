import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── Business logic (DO NOT MODIFY) ──────────────────────────────────────────
import { createSpeechRecognition, RecognitionState } from './services/speechRecognition';
import { parseCommand } from './services/commandParser';
import { processWithAI, isAIAvailable } from './services/aiCommandProcessor';
import { useTasks } from './hooks/useTasks';

// ── Stability + Phase D services ──────────────────────────────────────────────
import { speak, stopSpeaking } from './services/speechService';
import { recordCommand } from './services/commandHistory';
import { runHealthCheck } from './utils/systemHealth';
import { recordUndoAction, popUndoAction } from './services/undoService';

// ── UI Components ─────────────────────────────────────────────────────────────
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import VoiceHero from './components/VoiceHero';
import TaskBoard from './components/TaskBoard';
import DailyProgress from './components/DailyProgress';
import ActivityFeed from './components/ActivityFeed';
import HelpPanel from './components/HelpPanel';
import ConfirmModal from './components/ConfirmModal';
import TaskCard from './components/TaskCard';
import CreateTaskModal from './components/CreateTaskModal';
import HistoryPanel from './components/HistoryPanel';
import ArchivePanel from './components/ArchivePanel';
import SettingsPanel from './components/SettingsPanel';

// ── Voice feedback map ────────────────────────────────────────────────────────
const VOICE_FEEDBACK = {
  CREATE_TASK: { ok: (t) => `Task "${t}" added.`, fail: () => "I couldn't create that task — the label was empty." },
  DELETE_TASK: { ok: () => `Task deleted.`, fail: () => "I couldn't find that task." },
  COMPLETE_TASK: { ok: () => `Task marked as complete.`, fail: () => "No matching task found to complete." },
  UNCOMPLETE_TASK: { ok: () => `Task moved back to pending.`, fail: () => "No matching task found." },
  PIN_TASK: { ok: () => `Task pinned.`, fail: () => "I couldn't find that task to pin." },
  UNPIN_TASK: { ok: () => `Task unpinned.`, fail: () => "I couldn't find that task to unpin." },
  SET_PRIORITY: { ok: () => `Priority updated.`, fail: () => "I couldn't find that task." },
  DELETE_ALL_TASKS: { ok: (n) => `All ${n} task${n !== 1 ? 's' : ''} deleted.`, fail: () => "There are no tasks to delete." },
  COMPLETE_ALL_TASKS: { ok: (n) => `${n} task${n !== 1 ? 's' : ''} marked as complete.`, fail: () => "There are no tasks to complete." },
};

// ── E3 — Self-introduction text ───────────────────────────────────────────────
const SELF_INTRO_TEXT =
  'I am EcoVoice. A voice controlled task manager that helps you create, manage, complete, pin, search and organize tasks using natural voice commands.';

export default function App() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [micStatus, setMicStatus] = useState(RecognitionState.IDLE);
  const [transcript, setTranscript] = useState([]);
  const [unsupported, setUnsupported] = useState(false);
  const [activeNav, setActiveNav] = useState('today');
  const [helpOpen, setHelpOpen] = useState(false);
  const [geminiWarn, setGeminiWarn] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    onConfirm: () => {},
    onCancel: () => {},
  });
  const [chatMode, setChatMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar toggle
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  const {
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
    restoreTasks,
    uncompleteByIds,
    unpinByIds,
    pinByIds,
    archiveTask,
    restoreTask,
    togglePriority,
    deleteTask,
  } = useTasks();

  // ── A5 — Startup health check ──────────────────────────────────────────────
  useEffect(() => {
    const report = runHealthCheck(tasks);
    if (!report.healthy) {
      console.warn('[EcoVoice] Startup health issues detected:', report.issues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Live tasks ref (stale-closure fix — DO NOT add tasks to SR useEffect deps)
  const tasksRef = useRef(tasks);
  useEffect(() => { tasksRef.current = tasks; });

  const srRef = useRef(null);

  // ── aiReply: push to transcript + speak ───────────────────────────────────
  const aiReply = useCallback((text) => {
    setTranscript((prev) => [
      ...prev,
      { id: Date.now() + 1, type: 'ai', text, timestamp: Date.now() },
    ]);
    srRef.current?.enterSpeaking();
    speak(text, {
      onEnd: () => { srRef.current?.startAfterDelay(750); },
    });
  }, []);

  // ── B5 — DELETE_ALL / COMPLETE_ALL confirmation ──────────────────────────
  const pendingDeleteAll = useRef(null);
  const pendingCompleteAll = useRef(null);
  const pendingCompleteAllSource = useRef('parser');

  const executeDeleteAll = useCallback(() => {
    const count = tasksRef.current.length;
    console.debug('[EcoVoice DEBUG] executeDeleteAll — task count:', count);
    if (count === 0) {
      aiReply(VOICE_FEEDBACK.DELETE_ALL_TASKS.fail());
      recordCommand({ transcript: pendingDeleteAll.current ?? 'delete all', intent: 'DELETE_ALL_TASKS', result: 'empty', source: 'parser' });
    } else {
      deleteAllTasks();
      aiReply(VOICE_FEEDBACK.DELETE_ALL_TASKS.ok(count));
      recordCommand({ transcript: pendingDeleteAll.current ?? 'delete all', intent: 'DELETE_ALL_TASKS', result: 'ok', source: 'parser' });
    }
    pendingDeleteAll.current = null;
    setConfirmConfig((prev) => ({ ...prev, open: false }));
  }, [deleteAllTasks, aiReply]);

  const cancelDeleteAll = useCallback(() => {
    aiReply('Deletion cancelled.');
    pendingDeleteAll.current = null;
    setConfirmConfig((prev) => ({ ...prev, open: false }));
  }, [aiReply]);

  const executeCompleteAll = useCallback(() => {
    const count = tasksRef.current.filter((t) => !t.done).length;
    console.debug('[EcoVoice DEBUG] executeCompleteAll — task count:', count);
    if (count === 0) {
      aiReply(VOICE_FEEDBACK.COMPLETE_ALL_TASKS.fail());
      recordCommand({ transcript: pendingCompleteAll.current ?? 'complete all', intent: 'COMPLETE_ALL_TASKS', result: 'empty', source: pendingCompleteAllSource.current });
    } else {
      completeAllTasks();
      aiReply(VOICE_FEEDBACK.COMPLETE_ALL_TASKS.ok(count));
      recordCommand({ transcript: pendingCompleteAll.current ?? 'complete all', intent: 'COMPLETE_ALL_TASKS', result: 'ok', source: pendingCompleteAllSource.current });
    }
    pendingCompleteAll.current = null;
    setConfirmConfig((prev) => ({ ...prev, open: false }));
  }, [completeAllTasks, aiReply]);

  const cancelCompleteAll = useCallback(() => {
    aiReply('Completion cancelled.');
    pendingCompleteAll.current = null;
    setConfirmConfig((prev) => ({ ...prev, open: false }));
  }, [aiReply]);

  // ── B5 — ARCHIVE_ALL confirmation ─────────────────────────────────────────
  const pendingArchiveAll = useRef(null);

  const executeArchiveAll = useCallback(() => {
    const count = tasksRef.current.length;
    console.debug('[EcoVoice DEBUG] executeArchiveAll — task count:', count);
    if (count === 0) {
      aiReply("There are no tasks to archive.");
      recordCommand({ transcript: pendingArchiveAll.current ?? 'archive all', intent: 'ARCHIVE_ALL_TASKS', result: 'empty', source: 'parser' });
    } else {
      // Archive all tasks
      tasksRef.current.forEach((t) => archiveTask(t.id));
      aiReply(`All ${count} tasks archived.`);
      recordCommand({ transcript: pendingArchiveAll.current ?? 'archive all', intent: 'ARCHIVE_ALL_TASKS', result: 'ok', source: 'parser' });
    }
    pendingArchiveAll.current = null;
    setConfirmConfig((prev) => ({ ...prev, open: false }));
  }, [archiveTask, aiReply]);

  const cancelArchiveAll = useCallback(() => {
    aiReply('Archiving cancelled.');
    pendingArchiveAll.current = null;
    setConfirmConfig((prev) => ({ ...prev, open: false }));
  }, [aiReply]);

  // ── B5 — PIN_ALL / UNPIN_ALL confirmation ─────────────────────────────────
  const pendingPinAll = useRef(null);
  const pendingUnpinAll = useRef(null);

  const executePinAll = useCallback(() => {
    const liveTasks = tasksRef.current;
    const pending = liveTasks.filter((t) => !t.pinned && !t.done);
    if (pending.length === 0) {
      aiReply("No pending tasks to pin.");
      recordCommand({ transcript: pendingPinAll.current ?? 'pin all', intent: 'PIN_ALL_TASKS', result: 'empty', source: 'parser' });
    } else {
      const ids = pending.map((t) => t.id);
      pinByIds(ids);
      aiReply("All pending tasks pinned.");
      recordCommand({ transcript: pendingPinAll.current ?? 'pin all', intent: 'PIN_ALL_TASKS', result: 'ok', source: 'parser' });
    }
    pendingPinAll.current = null;
    setConfirmConfig((prev) => ({ ...prev, open: false }));
  }, [pinByIds, aiReply]);

  const cancelPinAll = useCallback(() => {
    aiReply('Pinning cancelled.');
    pendingPinAll.current = null;
    setConfirmConfig((prev) => ({ ...prev, open: false }));
  }, [aiReply]);

  const executeUnpinAll = useCallback(() => {
    const liveTasks = tasksRef.current;
    const pinned = liveTasks.filter((t) => t.pinned && !t.done);
    if (pinned.length === 0) {
      aiReply("No pinned tasks to unpin.");
      recordCommand({ transcript: pendingUnpinAll.current ?? 'unpin all', intent: 'UNPIN_ALL_TASKS', result: 'empty', source: 'parser' });
    } else {
      const ids = pinned.map((t) => t.id);
      unpinByIds(ids);
      aiReply("All tasks unpinned.");
      recordCommand({ transcript: pendingUnpinAll.current ?? 'unpin all', intent: 'UNPIN_ALL_TASKS', result: 'ok', source: 'parser' });
    }
    pendingUnpinAll.current = null;
    setConfirmConfig((prev) => ({ ...prev, open: false }));
  }, [unpinByIds, aiReply]);

  const cancelUnpinAll = useCallback(() => {
    aiReply('Unpinning cancelled.');
    pendingUnpinAll.current = null;
    setConfirmConfig((prev) => ({ ...prev, open: false }));
  }, [aiReply]);

  // ── D1 — UNDO executor ────────────────────────────────────────────────────
  const executeUndo = useCallback(() => {
    const action = popUndoAction();
    console.debug('[EcoVoice DEBUG] UNDO — action:', action);

    if (!action) {
      aiReply('Nothing to undo.');
      return;
    }

    switch (action.intent) {
      case 'CREATE_TASK':
        if (action.snapshot && action.snapshot.length > 0) {
          const label = action.snapshot[0].label;
          deleteByQuery(label);
          aiReply(`Undone. Task "${label}" removed.`);
        } else {
          aiReply('Nothing to undo.');
        }
        break;
      case 'DELETE_TASK':
        restoreTasks(action.snapshot);
        aiReply('Undone. Task restored.');
        break;
      case 'COMPLETE_TASK':
        uncompleteByIds(action.snapshot.map((t) => t.id));
        aiReply('Undone. Task moved back to pending.');
        break;
      case 'PIN_TASK':
        unpinByIds(action.snapshot.map((t) => t.id));
        aiReply('Undone. Task unpinned.');
        break;
      case 'UNPIN_TASK':
        pinByIds(action.snapshot.map((t) => t.id));
        aiReply('Undone. Task pinned again.');
        break;
      default:
        aiReply('Nothing to undo.');
    }
  }, [deleteByQuery, restoreTasks, uncompleteByIds, unpinByIds, pinByIds, aiReply]);

  // ── Speech Recognition ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleResult = async (text) => {
      if (!text || text.trim() === '') return;

        const tasksBefore = tasksRef.current.length;
        console.group(`[EcoVoice DEBUG] onResult: "${text}"`);
        console.log('  Transcript  :', text);
        console.log('  Tasks before:', tasksBefore);
        console.log('  Chat mode   :', chatModeRef.current);

        setTranscript((prev) => [
          ...prev,
          { id: Date.now(), type: 'user', text, timestamp: Date.now() },
        ]);

        let command;
        let source = 'ai';
        const localCmd = parseCommand(text);
        const BULK_INTENTS = ['DELETE_ALL_TASKS', 'COMPLETE_ALL_TASKS', 'ARCHIVE_ALL_TASKS', 'PIN_ALL_TASKS', 'UNPIN_ALL_TASKS'];
        if (BULK_INTENTS.includes(localCmd.type)) {
          command = localCmd;
          source = 'parser';
        } else {
          try {
            command = isAIAvailable()
              ? await processWithAI(text)
              : localCmd;
            if (!isAIAvailable()) source = 'parser';
          } catch (err) {
            console.error('[EcoVoice] Command dispatch error:', err);
            command = { type: 'UNKNOWN' };
            source = 'error';
          }
        }

        console.log('  Detected intent:', command.type, '| source:', source);

        if (command.type === 'GEMINI_UNAVAILABLE') {
          setGeminiWarn(command.response);
          setTimeout(() => setGeminiWarn(null), 8000);
          command = command.fallback ?? { type: 'UNKNOWN' };
          source = 'fallback';
          console.log('  → Gemini unavailable, fallback:', command.type);
        } else {
          setGeminiWarn(null);
        }

        if (command.type === 'SHOW_HELP') {
          setHelpOpen(true);
          srRef.current?.enterSpeaking();
          speak('Here are all the voice commands you can use.', {
            onEnd: () => { srRef.current?.startAfterDelay(750); },
          });
          recordCommand({ transcript: text, intent: 'SHOW_HELP', result: 'ok', source });
          console.log('  → Handler: SHOW_HELP'); console.groupEnd();
          return;
        }

        if (command.type === 'MISSING_TASK_TARGET') {
          const prompt = command.prompt ?? 'Which task did you mean?';
          aiReply(prompt);
          recordCommand({ transcript: text, intent: command.intent ?? 'MISSING_TASK_TARGET', task: '', result: 'missing_target', source });
          console.log('  → MISSING_TASK_TARGET'); console.groupEnd();
          return;
        }

        if (command.type === 'DELETE_ALL_TASKS') {
          pendingDeleteAll.current = text;
          const msg = text.toLowerCase().includes('permanent')
            ? 'Are you sure you want to permanently delete all tasks?'
            : 'Are you sure you want to delete all tasks?';
          setConfirmConfig({
            open: true,
            title: 'Confirm Action',
            message: msg,
            confirmLabel: 'Confirm',
            onConfirm: executeDeleteAll,
            onCancel: cancelDeleteAll,
          });
          srRef.current?.enterSpeaking();
          speak(msg, {
            onEnd: () => { srRef.current?.startAfterDelay(750); },
          });
          recordCommand({ transcript: text, intent: 'DELETE_ALL_TASKS', result: 'pending_confirm', source });
          console.log('  → DELETE_ALL_TASKS — awaiting confirmation'); console.groupEnd();
          return;
        }

        if (command.type === 'COMPLETE_ALL_TASKS') {
          const liveTasks = tasksRef.current;
          const pending = liveTasks.filter((t) => !t.done).length;
          if (pending === 0) {
            aiReply(VOICE_FEEDBACK.COMPLETE_ALL_TASKS.fail());
            recordCommand({ transcript: text, intent: 'COMPLETE_ALL_TASKS', result: 'empty', source });
            console.log('  → COMPLETE_ALL_TASKS — empty'); console.groupEnd();
            return;
          }
          pendingCompleteAll.current = text;
          pendingCompleteAllSource.current = source;
          const msg = text.toLowerCase().includes('mark')
            ? 'Are you sure you want to mark all tasks as completed?'
            : 'Are you sure you want to complete all tasks?';
          setConfirmConfig({
            open: true,
            title: 'Confirm Action',
            message: msg,
            confirmLabel: 'Confirm',
            onConfirm: executeCompleteAll,
            onCancel: cancelCompleteAll,
          });
          srRef.current?.enterSpeaking();
          speak(msg, {
            onEnd: () => { srRef.current?.startAfterDelay(750); },
          });
          recordCommand({ transcript: text, intent: 'COMPLETE_ALL_TASKS', result: 'pending_confirm', source });
          console.log('  → COMPLETE_ALL_TASKS — awaiting confirmation'); console.groupEnd();
          return;
        }

        if (command.type === 'ARCHIVE_ALL_TASKS') {
          const liveTasks = tasksRef.current;
          if (liveTasks.length === 0) {
            aiReply("There are no tasks to archive.");
            recordCommand({ transcript: text, intent: 'ARCHIVE_ALL_TASKS', result: 'empty', source });
            console.log('  → ARCHIVE_ALL_TASKS — empty'); console.groupEnd();
            return;
          }
          pendingArchiveAll.current = text;
          setConfirmConfig({
            open: true,
            title: 'Confirm Action',
            message: 'Are you sure you want to archive all tasks?',
            confirmLabel: 'Confirm',
            onConfirm: executeArchiveAll,
            onCancel: cancelArchiveAll,
          });
          srRef.current?.enterSpeaking();
          speak('Are you sure you want to archive all tasks?', {
            onEnd: () => { srRef.current?.startAfterDelay(750); },
          });
          recordCommand({ transcript: text, intent: 'ARCHIVE_ALL_TASKS', result: 'pending_confirm', source });
          console.log('  → ARCHIVE_ALL_TASKS — awaiting confirmation'); console.groupEnd();
          return;
        }
        if (command.type === 'PIN_ALL_TASKS') {
          const liveTasks = tasksRef.current;
          const pending = liveTasks.filter((t) => !t.pinned && !t.done);
          if (pending.length === 0) {
            aiReply("No pending tasks to pin.");
            recordCommand({ transcript: text, intent: 'PIN_ALL_TASKS', result: 'empty', source });
            console.log('  → PIN_ALL_TASKS — empty'); console.groupEnd();
            return;
          }
          pendingPinAll.current = text;
          setConfirmConfig({
            open: true,
            title: 'Confirm Action',
            message: 'Are you sure you want to pin all tasks?',
            confirmLabel: 'Confirm',
            onConfirm: executePinAll,
            onCancel: cancelPinAll,
          });
          srRef.current?.enterSpeaking();
          speak('Are you sure you want to pin all tasks?', {
            onEnd: () => { srRef.current?.startAfterDelay(750); },
          });
          recordCommand({ transcript: text, intent: 'PIN_ALL_TASKS', result: 'pending_confirm', source });
          console.log('  → PIN_ALL_TASKS — awaiting confirmation'); console.groupEnd();
          return;
        }

        if (command.type === 'UNPIN_ALL_TASKS') {
          const liveTasks = tasksRef.current;
          const pinned = liveTasks.filter((t) => t.pinned && !t.done);
          if (pinned.length === 0) {
            aiReply("No pinned tasks to unpin.");
            recordCommand({ transcript: text, intent: 'UNPIN_ALL_TASKS', result: 'empty', source });
            console.log('  → UNPIN_ALL_TASKS — empty'); console.groupEnd();
            return;
          }
          pendingUnpinAll.current = text;
          setConfirmConfig({
            open: true,
            title: 'Confirm Action',
            message: 'Are you sure you want to unpin all tasks?',
            confirmLabel: 'Confirm',
            onConfirm: executeUnpinAll,
            onCancel: cancelUnpinAll,
          });
          srRef.current?.enterSpeaking();
          speak('Are you sure you want to unpin all tasks?', {
            onEnd: () => { srRef.current?.startAfterDelay(750); },
          });
          recordCommand({ transcript: text, intent: 'UNPIN_ALL_TASKS', result: 'pending_confirm', source });
          console.log('  → UNPIN_ALL_TASKS — awaiting confirmation'); console.groupEnd();
          return;
        }
        if (command.type === 'UNDO') {
          executeUndo();
          recordCommand({ transcript: text, intent: 'UNDO', result: 'ok', source });
          console.log('  → Handler: UNDO'); console.groupEnd();
          return;
        }

        if (command.type === 'SEARCH_TASKS') {
          const q = command.query ?? '';
          setSearchQuery(q);
          const liveTasks = tasksRef.current;
          const matches = liveTasks.filter((t) =>
            t.label.toLowerCase().includes(q.toLowerCase())
          ).length;
          console.debug('[EcoVoice DEBUG] SEARCH — query:', q, '| matches:', matches, '| total:', liveTasks.length);
          const feedback = q
            ? (matches > 0
              ? `Found ${matches} matching task${matches !== 1 ? 's' : ''}.`
              : 'No matching task found.')
            : 'Search cleared.';
          aiReply(feedback);
          recordCommand({ transcript: text, intent: 'SEARCH_TASKS', task: q, result: 'ok', source });
          console.log('  → Handler: SEARCH_TASKS'); console.groupEnd();
          return;
        }

        if (command.type === 'CLEAR_SEARCH') {
          setSearchQuery('');
          console.debug('[EcoVoice DEBUG] CLEAR_SEARCH — total tasks:', tasksRef.current.length);
          aiReply('Showing all tasks.');
          recordCommand({ transcript: text, intent: 'CLEAR_SEARCH', result: 'ok', source });
          console.log('  → Handler: CLEAR_SEARCH'); console.groupEnd();
          return;
        }

        if (command.type === 'ENTER_CHAT_MODE') {
          setChatMode(true);
          aiReply('Chat mode activated. Ask me anything.');
          recordCommand({ transcript: text, intent: 'ENTER_CHAT_MODE', result: 'ok', source });
          console.log('  → Handler: ENTER_CHAT_MODE'); console.groupEnd();
          return;
        }

        if (command.type === 'EXIT_CHAT_MODE') {
          setChatMode(false);
          aiReply('Task mode activated. Ready for your commands.');
          recordCommand({ transcript: text, intent: 'EXIT_CHAT_MODE', result: 'ok', source });
          console.log('  → Handler: EXIT_CHAT_MODE'); console.groupEnd();
          return;
        }

        if (command.type === 'SELF_INTRO') {
          aiReply(SELF_INTRO_TEXT);
          recordCommand({ transcript: text, intent: 'SELF_INTRO', result: 'ok', source });
          console.log('  → Handler: SELF_INTRO'); console.groupEnd();
          return;
        }

        // ── Fix #2: CHAT intent handler (Groq conversational replies) ──────────
        if (command.type === 'CHAT') {
          const chatResponse = command.response || "I'm here! Ask me anything.";
          aiReply(chatResponse);
          recordCommand({ transcript: text, intent: 'CHAT', result: 'ok', source });
          console.log('  → Handler: CHAT | response:', chatResponse); console.groupEnd();
          return;
        }

        let result = 'ok';
        let feedbackText = command.response ?? null;
        let handlerCalled = command.type;

        if (command.type === 'CREATE_TASK') {
          if (!command.task || command.task.trim() === '') {
            result = 'empty';
            if (!feedbackText) feedbackText = VOICE_FEEDBACK.CREATE_TASK.fail();
          } else {
            const newTaskSnapshot = [{ label: command.task.trim() }];
            addTask(command.task, { source: 'voice', priority: command.priority ?? 'normal' });
            recordUndoAction('CREATE_TASK', command.task, newTaskSnapshot);
            setSearchQuery('');
            if (!feedbackText) feedbackText = VOICE_FEEDBACK.CREATE_TASK.ok(command.task);
          }
        } else if (command.type === 'DELETE_TASK') {
          const liveTasks = tasksRef.current;
          const affected = liveTasks.filter((t) =>
            t.label.toLowerCase().includes((command.query ?? '').toLowerCase())
          );
          deleteByQuery(command.query);
          recordUndoAction('DELETE_TASK', command.query, affected);
          setSearchQuery('');
          if (!feedbackText) feedbackText = VOICE_FEEDBACK.DELETE_TASK.ok();
        } else if (command.type === 'COMPLETE_TASK') {
          const liveTasks = tasksRef.current;
          const affected = liveTasks.filter((t) =>
            t.label.toLowerCase().includes((command.query ?? '').toLowerCase()) && !t.done
          );
          completeByQuery(command.query);
          recordUndoAction('COMPLETE_TASK', command.query, affected);
          setSearchQuery('');
          if (!feedbackText) feedbackText = VOICE_FEEDBACK.COMPLETE_TASK.ok();
        } else if (command.type === 'UNCOMPLETE_TASK') {
          uncompleteByQuery(command.query);
          setSearchQuery('');
          if (!feedbackText) feedbackText = VOICE_FEEDBACK.UNCOMPLETE_TASK.ok();
        } else if (command.type === 'PIN_TASK') {
          const liveTasks = tasksRef.current;
          const affected = liveTasks.filter((t) =>
            t.label.toLowerCase().includes((command.query ?? '').toLowerCase()) && !t.pinned
          );
          pinByQuery(command.query);
          recordUndoAction('PIN_TASK', command.query, affected);
          setSearchQuery('');
          if (!feedbackText) feedbackText = VOICE_FEEDBACK.PIN_TASK.ok();
        } else if (command.type === 'UNPIN_TASK') {
          const liveTasks = tasksRef.current;
          const affected = liveTasks.filter((t) =>
            t.label.toLowerCase().includes((command.query ?? '').toLowerCase()) && t.pinned
          );
          unpinByQuery(command.query);
          recordUndoAction('UNPIN_TASK', command.query, affected);
          setSearchQuery('');
          if (!feedbackText) feedbackText = VOICE_FEEDBACK.UNPIN_TASK.ok();
        } else if (command.type === 'SET_PRIORITY') {
          setPriorityByQuery(command.query, command.priority);
          setSearchQuery('');
          if (!feedbackText) feedbackText = VOICE_FEEDBACK.SET_PRIORITY.ok();
        } else if (command.type === 'COMPLETE_ALL_TASKS') {
          const liveTasks = tasksRef.current;
          const pending = liveTasks.filter((t) => !t.done).length;
          console.log('  COMPLETE_ALL — pending tasks (live):', pending);
          if (pending === 0) {
            result = 'empty';
            feedbackText = VOICE_FEEDBACK.COMPLETE_ALL_TASKS.fail();
          } else {
            completeAllTasks();
            feedbackText = VOICE_FEEDBACK.COMPLETE_ALL_TASKS.ok(pending);
          }
        } else if (command.type === 'UNKNOWN') {
          result = 'unknown';
          handlerCalled = 'none';
          if (!feedbackText) feedbackText = "I didn't quite catch that. Try saying help to see all commands.";
        }

        console.log('  Handler called  :', handlerCalled);
        console.log('  Execution result:', result);
        console.log('  Voice feedback  :', feedbackText ?? '(none)');
        console.groupEnd();

        recordCommand({
          transcript: text,
          intent: command.type,
          task: command.task ?? command.query ?? '',
          result,
          source,
        });

        if (feedbackText) {
          aiReply(feedbackText);
        }
      };

      const sr = createSpeechRecognition({
        onStateChange: (nextState) => setMicStatus(nextState),
        onResult: handleResult,
        onError: (errorCode) => {
          console.error('[EcoVoice] Recognition error:', errorCode);
        },
      });

    if (!sr.supported) setUnsupported(true);
    srRef.current = sr;
    return () => srRef.current?.stop();

  }, [addTask, deleteByQuery, completeByQuery, uncompleteByQuery, pinByQuery, unpinByQuery, setPriorityByQuery, deleteAllTasks, completeAllTasks, executeUndo, aiReply]);

  const chatModeRef = useRef(chatMode);
  useEffect(() => { chatModeRef.current = chatMode; });

  // ── Mic toggle ─────────────────────────────────────────────────────────────
  const handleMicClick = () => {
    if (unsupported) return;
    const sr = srRef.current;
    if (!sr) return;
    if (micStatus === RecognitionState.IDLE || micStatus === RecognitionState.ERROR) {
      sr.start();
    } else {
      sr.stop();
      stopSpeaking();
    }
  };

  const isListening = micStatus === RecognitionState.LISTENING
    || micStatus === RecognitionState.PROCESSING
    || micStatus === RecognitionState.SPEAKING;
  const lastSpoken = transcript.length > 0 ? transcript[transcript.length - 1].text : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#1a1a2e] md:p-4">

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="w-full md:max-w-6xl h-screen md:h-auto md:max-h-[720px] md:rounded-3xl overflow-hidden shadow-2xl flex md:border md:border-white/10">

        {/* ── Sidebar — hidden on mobile, slides in as overlay ── */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-50
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:flex
        `}>
          <Sidebar
            activeNav={activeNav}
            onNav={(id) => { setActiveNav(id); setSidebarOpen(false); }}
            onNewTask={() => { setCreateTaskOpen(true); setSidebarOpen(false); }}
          />
        </div>

        {/* ── Main content area ── */}
        <div className="flex-1 flex flex-col bg-cream min-w-0 overflow-hidden w-full">

          {/* Unsupported browser banner */}
          {unsupported && (
            <div className="bg-red-50 border-b border-red-200 text-red-600 text-xs text-center py-2 px-4 shrink-0">
              ⚠️ Speech Recognition is not supported in this browser. Please use Chrome or Edge.
            </div>
          )}

          {/* Gemini unavailability banner */}
          {geminiWarn && (
            <div className="bg-amber-50 border-b border-amber-200 text-amber-700 text-xs text-center py-2 px-4 shrink-0 flex items-center justify-center gap-2">
              <span>⚠️</span>
              <span className="truncate">{geminiWarn}</span>
              <button onClick={() => setGeminiWarn(null)} className="ml-2 text-amber-500 hover:text-amber-700 font-bold shrink-0" aria-label="Dismiss Gemini warning">✕</button>
            </div>
          )}

          {/* Chat Mode indicator */}
          {chatMode && (
            <div className="bg-violet-50 border-b border-violet-200 text-violet-700 text-xs text-center py-1.5 px-4 shrink-0 flex items-center justify-center gap-2 font-semibold tracking-wide uppercase">
              <span>💬</span>
              <span>Chat Mode</span>
              <button
                onClick={() => { setChatMode(false); aiReply('Task mode activated.'); }}
                className="ml-2 text-violet-400 hover:text-violet-700 font-bold normal-case tracking-normal text-xs"
                aria-label="Exit chat mode"
              >
                Exit
              </button>
            </div>
          )}

          <TopBar
            isListening={isListening}
            onMenuClick={() => setSidebarOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onHelpClick={() => setHelpOpen(true)}
            onSettingsClick={() => setActiveNav('settings')}
          />

          <div className="flex flex-1 overflow-hidden">
            {/* Task panel */}
            <div className="flex-1 flex flex-col overflow-y-auto px-4 sm:px-6 lg:px-8 pb-6 min-w-0">
              {activeNav === 'today' && (
                <>
                  <VoiceHero status={micStatus} onClick={handleMicClick} lastSpoken={lastSpoken} />
                  <TaskBoard
                    tasks={tasks}
                    onToggle={toggleTask}
                    onTogglePin={togglePin}
                    onTogglePriority={togglePriority}
                    onArchive={archiveTask}
                    searchQuery={searchQuery}
                  />
                </>
              )}

              {activeNav === 'upcoming' && (
                <>
                  <VoiceHero status={micStatus} onClick={handleMicClick} lastSpoken={lastSpoken} />
                  <div className="mt-4 sm:mt-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-stone-800 mb-4 px-1">Upcoming Tasks</h2>
                    {tasks.filter(t => !t.done).slice(4).length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-2xl border border-stone-100 p-6">
                        <p className="text-sm font-semibold text-stone-500">No upcoming tasks.</p>
                        <p className="text-xs text-stone-400 mt-1">Create more tasks or wait for today's tasks to clear.</p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {tasks.filter(t => !t.done).slice(4).map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onToggle={toggleTask}
                            onTogglePin={togglePin}
                            onTogglePriority={togglePriority}
                            onArchive={archiveTask}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeNav === 'history' && (
                <HistoryPanel />
              )}

              {activeNav === 'archive' && (
                <ArchivePanel
                  archivedTasks={archivedTasks}
                  onRestore={restoreTask}
                  onDelete={deleteTask}
                />
              )}

              {activeNav === 'settings' && (
                <SettingsPanel />
              )}
            </div>

            {/* Aside — hidden on mobile/tablet, visible on lg+ */}
            <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-4 overflow-y-auto px-4 pt-2 pb-6 border-l border-stone-200/60 bg-parchment/40">
              <DailyProgress tasks={tasks} />
              <ActivityFeed entries={transcript} />
            </aside>
          </div>

          {/* ── Mobile bottom tab bar ── */}
          <nav className="lg:hidden shrink-0 flex items-center justify-around border-t border-stone-200 bg-cream px-2 py-2 safe-area-pb">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-stone-500 hover:text-forest-700 hover:bg-forest-50 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-[10px] font-medium">Menu</span>
            </button>

            <button
              onClick={handleMicClick}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
                isListening ? 'text-forest-700 bg-forest-50' : 'text-stone-500'
              }`}
              aria-label="Toggle mic"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
              </svg>
              <span className="text-[10px] font-medium">{isListening ? 'Live' : 'Mic'}</span>
            </button>

            <button
              onClick={() => setHelpOpen(true)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-stone-500 hover:text-forest-700 hover:bg-forest-50 transition-colors"
              aria-label="Help"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[10px] font-medium">Help</span>
            </button>

            <button
              onClick={() => setActiveNav('history')}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                activeNav === 'history' ? 'text-forest-700 bg-forest-50' : 'text-stone-500'
              }`}
              aria-label="Activity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-[10px] font-medium">Activity</span>
            </button>
          </nav>
        </div>
      </div>

      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />

      <CreateTaskModal
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        onSave={(label, opts) => addTask(label, { source: 'manual', priority: opts.priority, pinned: opts.pinned })}
      />

      <ConfirmModal
        open={confirmConfig.open}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        onConfirm={confirmConfig.onConfirm}
        onCancel={confirmConfig.onCancel}
      />
    </div>
  );
}
