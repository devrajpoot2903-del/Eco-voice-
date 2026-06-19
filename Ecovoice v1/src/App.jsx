import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── Business logic (DO NOT MODIFY) ──────────────────────────────────────────
import { createSpeechRecognition, RecognitionState } from './services/speechRecognition';
import { parseCommand } from './services/commandParser';
import { processWithAI, isAIAvailable } from './services/aiCommandProcessor';
import { useTasks } from './hooks/useTasks';

// ── Stability + Phase D services ──────────────────────────────────────────────
import { speak } from './services/speechService';
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
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [chatMode, setChatMode] = useState(false);   // E1/E2
  const [searchQuery, setSearchQuery] = useState('');      // D3

  const {
    tasks,
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
    // Turn-based: tell SR we are speaking, restart mic after TTS + 750ms
    srRef.current?.enterSpeaking();
    speak(text, {
      onEnd: () => { srRef.current?.startAfterDelay(750); },
    });
  }, []);

  // ── B5 — DELETE_ALL confirmation ──────────────────────────────────────────
  const pendingDeleteAll = useRef(null);

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
    setConfirmDeleteAll(false);
  }, [deleteAllTasks, aiReply]);

  const cancelDeleteAll = useCallback(() => {
    aiReply('Deletion cancelled.');
    pendingDeleteAll.current = null;
    setConfirmDeleteAll(false);
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
        // Undo create = delete the task that was just created
        if (action.snapshot && action.snapshot.length > 0) {
          const label = action.snapshot[0].label;
          deleteByQuery(label);
          aiReply(`Undone. Task "${label}" removed.`);
        } else {
          aiReply('Nothing to undo.');
        }
        break;

      case 'DELETE_TASK':
        // Undo delete = restore the deleted task(s)
        restoreTasks(action.snapshot);
        aiReply('Undone. Task restored.');
        break;

      case 'COMPLETE_TASK':
        // Undo complete = uncomplete the tasks
        uncompleteByIds(action.snapshot.map((t) => t.id));
        aiReply('Undone. Task moved back to pending.');
        break;

      case 'PIN_TASK':
        // Undo pin = unpin
        unpinByIds(action.snapshot.map((t) => t.id));
        aiReply('Undone. Task unpinned.');
        break;

      case 'UNPIN_TASK':
        // Undo unpin = re-pin
        pinByIds(action.snapshot.map((t) => t.id));
        aiReply('Undone. Task pinned again.');
        break;

      default:
        aiReply('Nothing to undo.');
    }
  }, [deleteByQuery, restoreTasks, uncompleteByIds, unpinByIds, pinByIds, aiReply]);

  // ── Speech Recognition ─────────────────────────────────────────────────────
  useEffect(() => {
    const sr = createSpeechRecognition({
      onStateChange: (nextState) => setMicStatus(nextState),

      onResult: async (text) => {
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

        // ── Dispatch ──────────────────────────────────────────────────────────
        let command;
        let source = 'ai';
        try {
          command = isAIAvailable()
            ? await processWithAI(text)
            : parseCommand(text);
          if (!isAIAvailable()) source = 'parser';
        } catch (err) {
          console.error('[EcoVoice] Command dispatch error:', err);
          command = { type: 'UNKNOWN' };
          source = 'error';
        }

        console.log('  Detected intent:', command.type, '| source:', source);

        // ── A3 — Gemini unavailability ────────────────────────────────────────
        if (command.type === 'GEMINI_UNAVAILABLE') {
          setGeminiWarn(command.response);
          setTimeout(() => setGeminiWarn(null), 8000);
          command = command.fallback ?? { type: 'UNKNOWN' };
          source = 'fallback';
          console.log('  → Gemini unavailable, fallback:', command.type);
        } else {
          setGeminiWarn(null);
        }

        // ── A6 — Help ─────────────────────────────────────────────────────────
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

        // ── Guard: destructive action with no target ──────────────────────────
        if (command.type === 'MISSING_TASK_TARGET') {
          const prompt = command.prompt ?? 'Which task did you mean?';
          aiReply(prompt);
          recordCommand({ transcript: text, intent: command.intent ?? 'MISSING_TASK_TARGET', task: '', result: 'missing_target', source });
          console.log('  → MISSING_TASK_TARGET'); console.groupEnd();
          return;
        }

        // ── B5 — DELETE_ALL: gate behind confirmation modal ───────────────────
        if (command.type === 'DELETE_ALL_TASKS') {
          pendingDeleteAll.current = text;
          setConfirmDeleteAll(true);
          srRef.current?.enterSpeaking();
          speak('Are you sure you want to delete all tasks? This cannot be undone.', {
            onEnd: () => { srRef.current?.startAfterDelay(750); },
          });
          recordCommand({ transcript: text, intent: 'DELETE_ALL_TASKS', result: 'pending_confirm', source });
          console.log('  → DELETE_ALL_TASKS — awaiting confirmation'); console.groupEnd();
          return;
        }

        // ── D1 — UNDO ─────────────────────────────────────────────────────────
        if (command.type === 'UNDO') {
          executeUndo();
          recordCommand({ transcript: text, intent: 'UNDO', result: 'ok', source });
          console.log('  → Handler: UNDO'); console.groupEnd();
          return;
        }

        // ── D3 — SEARCH_TASKS ─────────────────────────────────────────────────
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

        // ── Bug 2: CLEAR_SEARCH ─────────────────────────────────────────────────
        if (command.type === 'CLEAR_SEARCH') {
          setSearchQuery('');
          console.debug('[EcoVoice DEBUG] CLEAR_SEARCH — total tasks:', tasksRef.current.length);
          aiReply('Showing all tasks.');
          recordCommand({ transcript: text, intent: 'CLEAR_SEARCH', result: 'ok', source });
          console.log('  → Handler: CLEAR_SEARCH'); console.groupEnd();
          return;
        }

        // ── E1 — ENTER_CHAT_MODE ──────────────────────────────────────────────
        if (command.type === 'ENTER_CHAT_MODE') {
          setChatMode(true);
          aiReply('Chat mode activated. Ask me anything.');
          recordCommand({ transcript: text, intent: 'ENTER_CHAT_MODE', result: 'ok', source });
          console.log('  → Handler: ENTER_CHAT_MODE'); console.groupEnd();
          return;
        }

        // ── E2 — EXIT_CHAT_MODE ───────────────────────────────────────────────
        if (command.type === 'EXIT_CHAT_MODE') {
          setChatMode(false);
          aiReply('Task mode activated. Ready for your commands.');
          recordCommand({ transcript: text, intent: 'EXIT_CHAT_MODE', result: 'ok', source });
          console.log('  → Handler: EXIT_CHAT_MODE'); console.groupEnd();
          return;
        }

        // ── E3 — SELF_INTRO ───────────────────────────────────────────────────
        if (command.type === 'SELF_INTRO') {
          aiReply(SELF_INTRO_TEXT);
          recordCommand({ transcript: text, intent: 'SELF_INTRO', result: 'ok', source });
          console.log('  → Handler: SELF_INTRO'); console.groupEnd();
          return;
        }

        // ── Execute task actions ──────────────────────────────────────────────
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
            setSearchQuery(''); // Bug 2: clear filter after mutation
            if (!feedbackText) feedbackText = VOICE_FEEDBACK.CREATE_TASK.ok(command.task);
          }

        } else if (command.type === 'DELETE_TASK') {
          const liveTasks = tasksRef.current;
          const affected = liveTasks.filter((t) =>
            t.label.toLowerCase().includes((command.query ?? '').toLowerCase())
          );
          deleteByQuery(command.query);
          recordUndoAction('DELETE_TASK', command.query, affected);
          setSearchQuery(''); // Bug 2
          if (!feedbackText) feedbackText = VOICE_FEEDBACK.DELETE_TASK.ok();

        } else if (command.type === 'COMPLETE_TASK') {
          const liveTasks = tasksRef.current;
          const affected = liveTasks.filter((t) =>
            t.label.toLowerCase().includes((command.query ?? '').toLowerCase()) && !t.done
          );
          completeByQuery(command.query);
          recordUndoAction('COMPLETE_TASK', command.query, affected);
          setSearchQuery(''); // Bug 2
          if (!feedbackText) feedbackText = VOICE_FEEDBACK.COMPLETE_TASK.ok();

        } else if (command.type === 'UNCOMPLETE_TASK') {
          uncompleteByQuery(command.query);
          setSearchQuery(''); // Bug 2
          if (!feedbackText) feedbackText = VOICE_FEEDBACK.UNCOMPLETE_TASK.ok();

        } else if (command.type === 'PIN_TASK') {
          const liveTasks = tasksRef.current;
          const affected = liveTasks.filter((t) =>
            t.label.toLowerCase().includes((command.query ?? '').toLowerCase()) && !t.pinned
          );
          pinByQuery(command.query);
          recordUndoAction('PIN_TASK', command.query, affected);
          setSearchQuery(''); // Bug 2
          if (!feedbackText) feedbackText = VOICE_FEEDBACK.PIN_TASK.ok();

        } else if (command.type === 'UNPIN_TASK') {
          const liveTasks = tasksRef.current;
          const affected = liveTasks.filter((t) =>
            t.label.toLowerCase().includes((command.query ?? '').toLowerCase()) && t.pinned
          );
          unpinByQuery(command.query);
          recordUndoAction('UNPIN_TASK', command.query, affected);
          setSearchQuery(''); // Bug 2
          if (!feedbackText) feedbackText = VOICE_FEEDBACK.UNPIN_TASK.ok();

        } else if (command.type === 'SET_PRIORITY') {
          setPriorityByQuery(command.query, command.priority);
          setSearchQuery(''); // Bug 2
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

        // ── DEBUG log ─────────────────────────────────────────────────────────
        console.log('  Handler called  :', handlerCalled);
        console.log('  Execution result:', result);
        console.log('  Voice feedback  :', feedbackText ?? '(none)');
        console.groupEnd();

        // ── A4 — Record command history ───────────────────────────────────────
        recordCommand({
          transcript: text,
          intent: command.type,
          task: command.task ?? command.query ?? '',
          result,
          source,
        });

        // ── B6 — Speak + show response AFTER action ───────────────────────────
        if (feedbackText) {
          aiReply(feedbackText);
        }
      },

      onError: (errorCode) => {
        console.error('[EcoVoice] Recognition error:', errorCode);
      },
    });

    if (!sr.supported) setUnsupported(true);
    srRef.current = sr;
    return () => srRef.current?.stop();

    // tasks intentionally NOT in deps — accessed via tasksRef.current
  }, [addTask, deleteByQuery, completeByQuery, uncompleteByQuery, pinByQuery, unpinByQuery, setPriorityByQuery, deleteAllTasks, completeAllTasks, executeUndo, aiReply]);

  // chatMode ref so onResult closure can read it without re-creating the effect
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
      sr.stop(); // stop() handles LISTENING, PROCESSING, and SPEAKING states
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const isListening = micStatus === RecognitionState.LISTENING
    || micStatus === RecognitionState.PROCESSING
    || micStatus === RecognitionState.SPEAKING;
  const lastSpoken = transcript.length > 0 ? transcript[transcript.length - 1].text : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#1a1a2e] p-4">
      <div className="w-full max-w-6xl h-full max-h-[720px] rounded-3xl overflow-hidden shadow-2xl flex border border-white/10">

        <Sidebar activeNav={activeNav} onNav={setActiveNav} onNewTask={() => { }} />

        <div className="flex-1 flex flex-col bg-cream min-w-0 overflow-hidden">

          {/* Unsupported browser banner */}
          {unsupported && (
            <div className="bg-red-50 border-b border-red-200 text-red-600 text-xs text-center py-2 px-4 shrink-0">
              ⚠️ Speech Recognition is not supported in this browser. Please use Chrome or Edge.
            </div>
          )}

          {/* A3 — Gemini unavailability banner */}
          {geminiWarn && (
            <div className="bg-amber-50 border-b border-amber-200 text-amber-700 text-xs text-center py-2 px-4 shrink-0 flex items-center justify-center gap-2">
              <span>⚠️</span>
              <span>{geminiWarn}</span>
              <button onClick={() => setGeminiWarn(null)} className="ml-2 text-amber-500 hover:text-amber-700 font-bold" aria-label="Dismiss Gemini warning">✕</button>
            </div>
          )}

          {/* E1 — Chat Mode indicator badge */}
          {chatMode && (
            <div className="bg-violet-50 border-b border-violet-200 text-violet-700 text-xs text-center py-1.5 px-4 shrink-0 flex items-center justify-center gap-2 font-semibold tracking-wide uppercase">
              <span>💬</span>
              <span>Chat Mode Active</span>
              <button
                onClick={() => { setChatMode(false); aiReply('Task mode activated.'); }}
                className="ml-2 text-violet-400 hover:text-violet-700 font-bold normal-case tracking-normal text-xs"
                aria-label="Exit chat mode"
              >
                Exit
              </button>
            </div>
          )}

          <TopBar isListening={isListening} />

          <div className="flex flex-1 overflow-hidden gap-0">
            <div className="flex-1 flex flex-col overflow-y-auto px-8 pb-6 min-w-0">
              <VoiceHero status={micStatus} onClick={handleMicClick} lastSpoken={lastSpoken} />
              <TaskBoard
                tasks={tasks}
                onToggle={toggleTask}
                onTogglePin={togglePin}
                searchQuery={searchQuery}
              />
            </div>

            <aside className="w-64 shrink-0 flex flex-col gap-4 overflow-y-auto px-4 pt-2 pb-6 border-l border-stone-200/60 bg-parchment/40">
              <DailyProgress tasks={tasks} />
              <ActivityFeed entries={transcript} />
            </aside>
          </div>
        </div>
      </div>

      {/* A6 — Help Panel */}
      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* B5 — Delete All Confirmation Modal */}
      <ConfirmModal
        open={confirmDeleteAll}
        title="Delete All Tasks?"
        message="This action cannot be undone. All your tasks will be permanently removed."
        confirmLabel="Delete All"
        onConfirm={executeDeleteAll}
        onCancel={cancelDeleteAll}
      />
    </div>
  );
}
