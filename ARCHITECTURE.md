# EcoVoice Architecture

## High Level Flow

User Voice Input
↓
Speech Recognition
↓
Command Parser
↓
Intent Detection
↓
Payload Extraction
↓
Action Router
↓
Task Management Engine
↓
Voice Feedback

---

## Command Processing Flow

Voice Command

Example:

Create task study DSA tomorrow

↓

Speech Recognition converts voice into text.

↓

Command Parser normalizes the text.

↓

Intent Detection identifies the command type.

Example:

CREATE_TASK

↓

Payload Extraction identifies task details.

Example:

study DSA tomorrow

↓

Action Router sends the command to the appropriate task operation.

↓

Task Engine performs the requested action.

↓

Voice Feedback confirms the action.

---

## AI Fallback Flow

Voice Input
↓
Speech Recognition
↓
Command Parser

If no matching command is found:

↓
Gemini AI Service
↓
AI Response
↓
Voice Feedback

---

## Core Modules

### Speech Layer

Responsible for speech recognition and voice input.

### Parser Layer

Responsible for intent detection and payload extraction.

### Task Engine

Handles CRUD operations and task management.

### AI Layer

Provides chat mode and AI fallback responses.

### Voice Feedback Layer

Converts system responses into speech output.
