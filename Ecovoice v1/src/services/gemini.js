/**
 * EcoVoice — Gemini 2.5 Flash Service Layer
 *
 * Provides a clean, reusable interface to Google Gemini 2.5 Flash.
 * Only used for chat assistant functionality.
 * Does NOT touch task logic, parser, or any existing feature.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Client Initialisation ────────────────────────────────────────────────────

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
  console.warn(
    '[EcoVoice/Gemini] VITE_GEMINI_API_KEY is not set. ' +
    'Add your key to the .env file to enable AI chat.'
  );
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

const MODEL_NAME = 'gemini-2.5-flash';

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are EcoVoice Assistant — a helpful, concise productivity AI 
built into the EcoVoice task manager app. 
Help users with task planning, productivity tips, and brief questions. 
Keep responses short and practical. 
Do not offer to create, delete, or modify tasks — that is handled by voice commands.`;

// ─── Core sendMessage Function ────────────────────────────────────────────────

/**
 * Send a single message to Gemini 2.5 Flash and receive a plain-text reply.
 *
 * @param {string} message - The user's message.
 * @returns {Promise<string>} - Plain text response from Gemini.
 */
export async function sendMessage(message) {
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return 'Please enter a valid message.';
  }

  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    return 'Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.';
  }

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(message.trim());
    const response = result.response;
    const text = response.text();

    return text || 'No response received from Gemini.';
  } catch (error) {
    console.error('[EcoVoice/Gemini] API error:', error);

    // Friendly error messages based on error type
    if (error?.status === 401 || error?.message?.includes('API_KEY')) {
      return 'Invalid Gemini API key. Please check your VITE_GEMINI_API_KEY in .env.';
    }
    if (error?.status === 429) {
      return 'Gemini rate limit reached. Please wait a moment and try again.';
    }
    if (error?.status === 503 || error?.message?.includes('network')) {
      return 'Unable to reach Gemini. Please check your internet connection.';
    }

    return `Gemini error: ${error?.message || 'Unknown error occurred.'}`;
  }
}

// ─── Chat Session (multi-turn conversation) ───────────────────────────────────

/**
 * Creates a stateful multi-turn chat session with Gemini 2.5 Flash.
 * Use this when you need conversation history to be preserved across messages.
 *
 * @returns {{ sendMessage: (msg: string) => Promise<string>, reset: () => void }}
 */
export function createChatSession() {
  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    return {
      sendMessage: async () =>
        'Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.',
      reset: () => {},
    };
  }

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SYSTEM_PROMPT,
  });

  let chat = model.startChat({ history: [] });

  return {
    /**
     * Send a message and receive a reply within the conversation context.
     * @param {string} message
     * @returns {Promise<string>}
     */
    sendMessage: async (message) => {
      if (!message || message.trim() === '') return 'Please enter a valid message.';
      try {
        const result = await chat.sendMessage(message.trim());
        return result.response.text() || 'No response received.';
      } catch (error) {
        console.error('[EcoVoice/Gemini] Chat error:', error);
        if (error?.status === 429) return 'Rate limit reached. Please wait and try again.';
        return `Gemini error: ${error?.message || 'Unknown error.'}`;
      }
    },

    /** Reset conversation history — starts a fresh chat. */
    reset: () => {
      chat = model.startChat({ history: [] });
    },
  };
}

// ─── Quick Test Utility ───────────────────────────────────────────────────────

/**
 * Quick connectivity test. Sends "Hello Gemini" and logs the response.
 * Run from browser console: import('/src/services/gemini.js').then(m => m.testGemini())
 *
 * @returns {Promise<string>}
 */
export async function testGemini() {
  console.log('[EcoVoice/Gemini] Sending test message: "Hello Gemini"');
  const response = await sendMessage('Hello Gemini');
  console.log('[EcoVoice/Gemini] Test response:', response);
  return response;
}
