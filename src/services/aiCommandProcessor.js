/**
 * aiCommandProcessor.js — EcoVoice AI Command Layer
 * ---------------------------------------------------
 * Uses Gemini 2.5 Flash to extract intents from natural language.
 *
 * CONTRACT — every result now includes a `response` field:
 *   { type: 'CREATE_TASK',    task: string,  priority: 'normal'|'high', response: string }
 *   { type: 'DELETE_TASK',    query: string, response: string }
 *   { type: 'COMPLETE_TASK',  query: string, response: string }
 *   { type: 'UNCOMPLETE_TASK',query: string, response: string }
 *   { type: 'PIN_TASK',       query: string, response: string }
 *   { type: 'UNPIN_TASK',     query: string, response: string }
 *   { type: 'SET_PRIORITY',   query: string, priority: 'normal'|'high', response: string }
 *   { type: 'CHAT',           response: string }
 *   { type: 'UNKNOWN' }
 *
 * processWithAI(rawText) uses an internal session history (last 10 turns)
 * for multi-turn conversation memory via Gemini's chat API.
 *
 * parseCommand() from commandParser.js is the fallback when Gemini is
 * unavailable or returns malformed JSON.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseCommand } from './commandParser';

// ─── Gemini client ─────────────────────────────────────────────────────────────

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL   = 'gemini-2.5-flash';

let _genAI = null;
function getGenAI() {
  if (!_genAI && API_KEY && API_KEY !== 'your_gemini_api_key_here') {
    _genAI = new GoogleGenerativeAI(API_KEY);
  }
  return _genAI;
}

// ─── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are EcoVoice — a warm, intelligent, voice-first productivity assistant.

You understand English, Hindi, and Hinglish naturally.

Your job is to understand what the user wants and return a single JSON object.
Every response must include a short, warm, conversational "response" field — always in English.

════════════════════════════════════════════
INTENT TYPES
════════════════════════════════════════════

CREATE_TASK     → user wants to add, remember, schedule, or do something
DELETE_TASK     → user wants to delete, remove, or erase a task
COMPLETE_TASK   → user wants to mark a task done / finished / complete
UNCOMPLETE_TASK → user wants to revert a task to pending / incomplete
PIN_TASK        → user wants to pin, star, or mark a task as important
UNPIN_TASK      → user wants to unpin, unstar, or deprioritise a task
SET_PRIORITY    → user explicitly sets high or normal priority for a task
CHAT            → everything else: questions, greetings, conversations

════════════════════════════════════════════
JSON SCHEMAS — return EXACTLY ONE
No markdown. No backticks. Pure JSON only.
════════════════════════════════════════════

CREATE_TASK:
{ "intent": "CREATE_TASK", "task": "<clean English task label>", "priority": "normal" | "high", "response": "<warm confirmation, max 2 sentences>" }

DELETE_TASK:
{ "intent": "DELETE_TASK", "task": "<task keyword>", "response": "<warm confirmation>" }

COMPLETE_TASK:
{ "intent": "COMPLETE_TASK", "task": "<task keyword>", "response": "<warm confirmation>" }

UNCOMPLETE_TASK:
{ "intent": "UNCOMPLETE_TASK", "task": "<task keyword>", "response": "<warm confirmation>" }

PIN_TASK:
{ "intent": "PIN_TASK", "task": "<task keyword>", "response": "<warm confirmation>" }

UNPIN_TASK:
{ "intent": "UNPIN_TASK", "task": "<task keyword>", "response": "<warm confirmation>" }

SET_PRIORITY:
{ "intent": "SET_PRIORITY", "task": "<task keyword>", "priority": "normal" | "high", "response": "<warm confirmation>" }

CHAT:
{ "intent": "CHAT", "response": "<helpful, conversational reply — max 2 sentences>" }

════════════════════════════════════════════
PERSONALITY RULES (for "response" field)
════════════════════════════════════════════
- Always respond in English, even if user spoke Hindi or Hinglish.
- Maximum 2 sentences. Be concise.
- Sound warm, human, and encouraging — like a calm personal assistant.
- Never sound like documentation or a chatbot FAQ.
- Never say "I am an AI" or mention language models.
- Use contractions naturally: "I've", "you're", "let's".

════════════════════════════════════════════
HINDI / HINGLISH TRANSLATION EXAMPLES
════════════════════════════════════════════
"Kal subah DSA padhni hai"      → CREATE_TASK, task: "study DSA tomorrow morning"
"Mujhe DSA padhni hai"          → CREATE_TASK, task: "study DSA"
"Kal gym jana hai"              → CREATE_TASK, task: "go to gym tomorrow"
"Grocery leni hai"              → CREATE_TASK, task: "buy groceries"
"Ye task important hai"         → PIN_TASK, task from context
"DSA wala task delete kar do"   → DELETE_TASK, task: "DSA"
"Namaste"                       → CHAT, response: "Namaste! What would you like to work on today?"

════════════════════════════════════════════
TASK LABEL EXTRACTION RULES
════════════════════════════════════════════
Strip all filler words. Keep only the action + subject in English.
- "I need to study DSA"         → task: "study DSA"
- "remind me to call mom"       → task: "call mom"
- "Mujhe DSA padhni hai"        → task: "study DSA"
- "Kal gym jana hai"            → task: "go to gym tomorrow"

════════════════════════════════════════════
RESPONSE EXAMPLES (model your tone on these)
════════════════════════════════════════════
CREATE_TASK → "Got it, I've added that to your list."
DELETE_TASK → "Sure, I've removed that task for you."
COMPLETE_TASK → "Great work! I've marked that as done."
UNCOMPLETE_TASK → "No problem, I've moved it back to pending."
PIN_TASK → "Done. That's now pinned at the top of your list."
UNPIN_TASK → "Got it, I've unpinned that task."
SET_PRIORITY (high) → "Noted. I've marked that as high priority."
SET_PRIORITY (normal) → "Done, priority has been set back to normal."
CHAT (hello) → "Hey! Just speak naturally and I'll take care of your tasks."
CHAT (what can you do) → "I can create, complete, delete, pin, and prioritise your tasks using natural voice commands."`;

// ─── Session memory store ──────────────────────────────────────────────────────

/**
 * In-memory conversation history — last MAX_HISTORY turn pairs.
 * Each pair = { role: 'user', ... } + { role: 'model', ... }
 */
const MAX_HISTORY = 10;
const _sessionHistory = [];

export function getSessionHistory() {
  return [..._sessionHistory];
}

export function clearSessionHistory() {
  _sessionHistory.length = 0;
}

function pushHistory(userText, modelJSON) {
  _sessionHistory.push(
    { role: 'user',  parts: [{ text: userText }] },
    { role: 'model', parts: [{ text: JSON.stringify(modelJSON) }] },
  );
  // Trim to window: MAX_HISTORY pairs = MAX_HISTORY * 2 messages
  while (_sessionHistory.length > MAX_HISTORY * 2) {
    _sessionHistory.splice(0, 2);
  }
}

// ─── JSON extractor ────────────────────────────────────────────────────────────

function extractJSON(raw) {
  if (!raw) return null;
  const stripped = raw.replace(/```(?:json)?/gi, '').trim();
  const start = stripped.indexOf('{');
  const end   = stripped.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(stripped.slice(start, end + 1));
  } catch {
    return null;
  }
}

// ─── Missing target helper ────────────────────────────────────────────────────

/**
 * The prompts spoken when a destructive command is issued without a target.
 * Keyed by intent name.
 */
const MISSING_TARGET_PROMPTS = {
  DELETE_TASK:     'Which task would you like me to delete?',
  COMPLETE_TASK:   'Which task should I mark as complete?',
  UNCOMPLETE_TASK: 'Which task would you like to move back to pending?',
  PIN_TASK:        'Which task would you like to pin?',
  UNPIN_TASK:      'Which task should I unpin?',
  SET_PRIORITY:    'Which task should I update the priority for?',
};

/**
 * Return a MISSING_TASK_TARGET command for a given intent.
 * @param {string} intent
 * @returns {object}
 */
function missingTarget(intent) {
  return {
    type:   'MISSING_TASK_TARGET',
    intent, // original intent, for logging
    prompt: MISSING_TARGET_PROMPTS[intent] ?? 'Which task did you mean?',
  };
}

// ─── Gemini JSON → internal command object ─────────────────────────────────────

function mapToCommand(json) {
  if (!json || !json.intent) return { type: 'UNKNOWN' };

  const response = (typeof json.response === 'string' && json.response.trim())
    ? json.response.trim()
    : '';

  switch (json.intent) {
    case 'CREATE_TASK':
      return {
        type: 'CREATE_TASK',
        task: json.task ?? '',
        priority: json.priority === 'high' ? 'high' : 'normal',
        response,
      };

    case 'DELETE_TASK': {
      const query = (json.task ?? '').trim();
      if (!query) return missingTarget('DELETE_TASK');
      return { type: 'DELETE_TASK', query, response };
    }

    case 'COMPLETE_TASK': {
      const query = (json.task ?? '').trim();
      if (!query) return missingTarget('COMPLETE_TASK');
      return { type: 'COMPLETE_TASK', query, response };
    }

    case 'UNCOMPLETE_TASK': {
      const query = (json.task ?? '').trim();
      if (!query) return missingTarget('UNCOMPLETE_TASK');
      return { type: 'UNCOMPLETE_TASK', query, response };
    }

    case 'PIN_TASK': {
      const query = (json.task ?? '').trim();
      if (!query) return missingTarget('PIN_TASK');
      return { type: 'PIN_TASK', query, response };
    }

    case 'UNPIN_TASK': {
      const query = (json.task ?? '').trim();
      if (!query) return missingTarget('UNPIN_TASK');
      return { type: 'UNPIN_TASK', query, response };
    }

    case 'SET_PRIORITY': {
      const query = (json.task ?? '').trim();
      if (!query) return missingTarget('SET_PRIORITY');
      return {
        type: 'SET_PRIORITY',
        query,
        priority: json.priority === 'high' ? 'high' : 'normal',
        response,
      };
    }

    case 'CHAT':
      return { type: 'CHAT', response };

    default:
      return { type: 'UNKNOWN' };
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

// A3 — Failure tracking
let _consecutiveFailures = 0;
const MAX_FAILURES_BEFORE_WARN = 2;

/**
 * Returns a user-visible status object for the Gemini connection.
 * @returns {{ available: boolean, failing: boolean }}
 */
export function geminiStatus() {
  return {
    available: isAIAvailable(),
    failing:   _consecutiveFailures >= MAX_FAILURES_BEFORE_WARN,
  };
}

/**
 * Process a natural-language string through Gemini 2.5 Flash.
 *
 * A3 — On repeated Gemini failures the function returns a GEMINI_UNAVAILABLE
 * command so App.jsx can display a user-friendly message without freezing.
 *
 * Falls back to parseCommand() (no response field) when Gemini is unavailable.
 *
 * @param {string} rawText
 * @returns {Promise<object>}
 */
export async function processWithAI(rawText) {
  if (!rawText || typeof rawText !== 'string' || rawText.trim() === '') {
    return { type: 'UNKNOWN' };
  }

  const genAI = getGenAI();

  if (!genAI) {
    console.warn('[EcoVoice/AI] No Gemini API key — using rule-based parser as fallback.');
    return parseCommand(rawText);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: SYSTEM_PROMPT,
    });

    // Use Gemini chat API with rolling session history
    const chat = model.startChat({
      history: getSessionHistory(),
    });

    const result = await chat.sendMessage(rawText.trim());
    const raw    = result.response.text();

    console.debug('[EcoVoice/AI] Raw Gemini response:', raw);

    const json    = extractJSON(raw);
    const command = mapToCommand(json);

    // A3 — success: reset failure counter
    _consecutiveFailures = 0;

    if (command.type === 'UNKNOWN') return command;

    // Validate that task-based intents have a non-empty payload
    if (command.type !== 'CHAT') {
      const payload = command.task ?? command.query ?? '';
      if (payload.trim() === '') {
        console.warn('[EcoVoice/AI] Empty task payload — falling back to rule parser.');
        return parseCommand(rawText);
      }
    }

    // Persist this exchange to session memory
    if (json) pushHistory(rawText.trim(), json);

    return command;

  } catch (error) {
    _consecutiveFailures += 1;
    console.error(
      `[EcoVoice/AI] Gemini error (failure #${_consecutiveFailures}) — falling back to rule parser:`,
      error
    );

    // A3 — after repeated failures, surface a friendly notice to the user
    if (_consecutiveFailures >= MAX_FAILURES_BEFORE_WARN) {
      const isRateLimit = error?.status === 429 || String(error?.message).includes('429');
      const message = isRateLimit
        ? 'Gemini rate limit reached. Task Manager mode is still fully active.'
        : 'Gemini is currently unavailable. Task Manager mode remains active — all voice commands still work.';

      return {
        type:     'GEMINI_UNAVAILABLE',
        response: message,
        fallback: parseCommand(rawText),
      };
    }

    return parseCommand(rawText);
  }
}

/**
 * Check whether Gemini is configured and available.
 * Useful for UI to show "AI mode" indicator.
 *
 * @returns {boolean}
 */
export function isAIAvailable() {
  return !!(API_KEY && API_KEY !== 'your_gemini_api_key_here');
}
