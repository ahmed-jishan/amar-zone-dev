// ─── SelfSync Voice — Groq AI Service ──────────────────────────────────
// Secure Groq API integration for AI-powered intent extraction.
// Loads API key from environment variables — never hardcoded.
// Uses llama-4-scout-17b-16e-instruct model for fast, accurate intent parsing.
// ────────────────────────────────────────────────────────────────────────

import type { AiCommand, AiActionType, VoiceLanguage } from './types'

// ─── Configuration ─────────────────────────────────────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-4-scout-17b-16e-instruct'
const TIMEOUT_MS = 10_000 // 10 second timeout
const MAX_RETRIES = 2

// ─── System Prompt ─────────────────────────────────────────────────────

/**
 * The system prompt instructs Groq to convert user speech into structured JSON.
 * It supports both English and Bangla (Bengali) commands.
 * The AI must return ONLY valid JSON, no markdown, no extra text.
 */
const SYSTEM_PROMPT = `You are a smart voice assistant for the SelfSync app. Your job is to understand user speech and convert it into a structured JSON command.

You MUST return ONLY a JSON object. No markdown, no code fences, no explanation — just raw JSON.

The JSON must have an "action" field, and optionally "title", "description", "date", "time", "priority", "category", "noteId", "existingTitle", "updatedTitle", "updatedDescription", "language" fields.

Supported actions and their required fields:

1. "create_task" — Create a new task
   Required: title
   Optional: date, time, priority (low/medium/high), description, category

2. "update_task" — Update an existing task
   Required: existingTitle (the current task name)
   Optional: updatedTitle, updatedDescription, date, time, priority

3. "delete_task" — Delete a task
   Required: existingTitle (the task name to delete)

4. "complete_task" — Mark a task as completed
   Required: existingTitle (the task name to complete)

5. "show_tasks" — Show today's tasks or list tasks
   Optional: date (e.g., "today", "tomorrow")

6. "create_note" — Create a new note
   Required: title
   Optional: description

7. "update_note" — Update an existing note
   Required: existingTitle
   Optional: updatedTitle, updatedDescription

8. "delete_note" — Delete a note
   Required: existingTitle

9. "open_notes" — Open the notes section

10. "start_focus_mode" — Start focus/pomodoro mode
    Optional: title (task to focus on)

11. "stop_focus_mode" — Stop focus/pomodoro mode

12. "open_calculator" — Open the calculator

13. "open_tasks" — Go to tasks screen

14. "open_dashboard" — Go to dashboard/home screen

15. "unknown" — When you cannot understand the command

IMPORTANT RULES:
- Detect the user's language and set "language" to "en" (English) or "bn" (Bangla/Bengali)
- Parse dates naturally: "tomorrow", "today", "আগামীকাল" (tomorrow), "আজ" (today)
- Parse times naturally: "10 AM", "10:00", "সকাল ১০ টা" (10 AM), "রাত ৮ টা" (8 PM)
- For Bangla commands, understand the following patterns:
  - "আগামীকাল সকাল ১০ টায় [নাম] নামে একটা টাস্ক তৈরি করো" → create_task
  - "আমার আজকের টাস্কগুলো দেখাও" → show_tasks
  - "[নাম] টাস্কটা কমপ্লিট করো" → complete_task
  - "[নাম] টাস্কটা ডিলিট করো" → delete_task
  - "[নাম] টাস্কটা আপডেট করো" → update_task
  - "নোটস খুলে দাও" → open_notes
  - "নতুন নোট তৈরি করো [শিরোনাম]" → create_note
  - "ফোকাস মোড চালু করো" → start_focus_mode
  - "ফোকাস মোড বন্ধ করো" → stop_focus_mode
  - "ক্যালকুলেটর খুলে দাও" → open_calculator
  - "টাস্কস খুলে দাও" → open_tasks
  - "ড্যাশবোর্ডে যাও" → open_dashboard

BANGLA DAY/TIME KEYWORDS:
- "আগামীকাল" = tomorrow
- "আজ" = today
- "পরশু" = day after tomorrow
- "সকাল" = morning (AM)
- "রাত" = night (PM)
- "বিকাল" = afternoon (PM)
- "টা", "টায়" = o'clock

Example outputs:

User: "Create a task called Travelport report tomorrow at 10 AM"
{"action":"create_task","title":"Travelport report","date":"tomorrow","time":"10:00","priority":"medium","language":"en"}

User: "আগামীকাল সকাল ১০ টায় ট্রাভেলপোর্ট রিপোর্ট নামে একটা টাস্ক তৈরি করো"
{"action":"create_task","title":"ট্রাভেলপোর্ট রিপোর্ট","date":"tomorrow","time":"10:00","priority":"medium","language":"bn"}

User: "Show today's tasks"
{"action":"show_tasks","date":"today","language":"en"}

User: "Open notes"
{"action":"open_notes","language":"en"}

User: "Start focus mode"
{"action":"start_focus_mode","language":"en"}

User: "Complete meeting task"
{"action":"complete_task","existingTitle":"meeting","language":"en"}

User: "মিটিং টাস্কটা কমপ্লিট করো"
{"action":"complete_task","existingTitle":"মিটিং","language":"bn"}

User: "Hello"
{"action":"unknown","language":"en"}

Remember: ONLY return the JSON object. No other text.`

// ─── Groq API Client ───────────────────────────────────────────────────

function getApiKey(): string {
  const key =
    process.env.NEXT_PUBLIC_GROQ_API_KEY ||
    process.env.GROQ_API_KEY ||
    ''
  if (!key) {
    console.warn('[GroqService] No API key found. Set NEXT_PUBLIC_GROQ_API_KEY in .env.local')
  }
  return key
}

/**
 * Call Groq API with the user's transcript and return a structured AiCommand.
 * Implements timeout and retry logic for reliability.
 */
async function callGroq(transcript: string): Promise<AiCommand | null> {
  const apiKey = getApiKey()
  if (!apiKey) return null

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: transcript },
        ],
        temperature: 0.1, // Low temperature for consistent JSON
        max_tokens: 500,
        stream: false,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('[GroqService] API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    const content: string = data?.choices?.[0]?.message?.content || ''

    if (!content) {
      console.warn('[GroqService] Empty response from Groq')
      return null
    }

    // Parse the JSON response
    return parseGroqResponse(content)
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      console.warn('[GroqService] Request timed out after', TIMEOUT_MS, 'ms')
    } else {
      console.error('[GroqService] Fetch error:', error.message || error)
    }
    return null
  }
}

/**
 * Parse the raw Groq response into an AiCommand.
 * Handles both raw JSON and JSON wrapped in markdown code fences.
 */
function parseGroqResponse(content: string): AiCommand | null {
  try {
    // Try direct parse first
    return validateAndClean(JSON.parse(content))
  } catch {
    // Try to extract JSON from markdown code fences
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i)
    if (jsonMatch) {
      try {
        return validateAndClean(JSON.parse(jsonMatch[1]))
      } catch {
        console.warn('[GroqService] Failed to parse JSON from code fence')
        return null
      }
    }

    // Try to find any JSON object in the response
    const objectMatch = content.match(/\{[\s\S]*?\}/)
    if (objectMatch) {
      try {
        return validateAndClean(JSON.parse(objectMatch[0]))
      } catch {
        console.warn('[GroqService] Failed to parse JSON object from text')
        return null
      }
    }

    return null
  }
}

/**
 * Validate the parsed JSON and ensure action is one of the supported types.
 * Falls back to "unknown" if action is invalid.
 */
function validateAndClean(cmd: any): AiCommand | null {
  if (!cmd || typeof cmd !== 'object') return null

  const validActions: AiActionType[] = [
    'create_task', 'update_task', 'delete_task', 'complete_task', 'show_tasks',
    'create_note', 'update_note', 'delete_note', 'open_notes',
    'start_focus_mode', 'stop_focus_mode',
    'open_calculator', 'open_tasks', 'open_dashboard',
    'unknown',
  ]

  const action = validActions.includes(cmd.action as AiActionType)
    ? (cmd.action as AiActionType)
    : 'unknown'

  return {
    action,
    title: typeof cmd.title === 'string' ? cmd.title.trim() : undefined,
    description: typeof cmd.description === 'string' ? cmd.description.trim() : undefined,
    date: typeof cmd.date === 'string' ? cmd.date.trim() : undefined,
    time: typeof cmd.time === 'string' ? cmd.time.trim() : undefined,
    priority: ['low', 'medium', 'high'].includes(cmd.priority)
      ? (cmd.priority as 'low' | 'medium' | 'high')
      : undefined,
    category: typeof cmd.category === 'string' ? cmd.category.trim() : undefined,
    noteId: typeof cmd.noteId === 'string' ? cmd.noteId.trim() : undefined,
    existingTitle: typeof cmd.existingTitle === 'string' ? cmd.existingTitle.trim() : undefined,
    updatedTitle: typeof cmd.updatedTitle === 'string' ? cmd.updatedTitle.trim() : undefined,
    updatedDescription: typeof cmd.updatedDescription === 'string' ? cmd.updatedDescription.trim() : undefined,
    language: cmd.language === 'bn' ? 'bn' : 'en',
  }
}

// ─── Public API ────────────────────────────────────────────────────────

/**
 * Process a transcript through Groq AI and return a structured command.
 * Implements retry logic with exponential backoff.
 */
export async function processTranscript(transcript: string): Promise<AiCommand> {
  let lastError: string | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 500ms, 1000ms
      const delay = 500 * Math.pow(2, attempt - 1)
      console.log(`[GroqService] Retry attempt ${attempt + 1}/${MAX_RETRIES + 1} after ${delay}ms`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    const result = await callGroq(transcript)
    if (result) return result

    lastError = `Attempt ${attempt + 1} failed`
  }

  // If all retries fail, return unknown action
  console.warn('[GroqService] All attempts failed. Returning unknown action.')
  return {
    action: 'unknown',
    language: detectLanguageSimple(transcript),
  }
}

/**
 * Simple language detection fallback when Groq is unavailable.
 * Checks for Bengali Unicode range.
 */
function detectLanguageSimple(text: string): VoiceLanguage {
  const bengaliRegex = /[\u0980-\u09FF]/
  return bengaliRegex.test(text) ? 'bn' : 'en'
}

/**
 * Check if Groq API is configured (has an API key).
 */
export function isGroqConfigured(): boolean {
  const key = getApiKey()
  return key.length > 0
}

/**
 * Get the configured model name for debugging/info.
 */
export function getModelName(): string {
  return MODEL
}