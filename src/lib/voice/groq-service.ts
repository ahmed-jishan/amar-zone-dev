// ─── SelfSync Voice — Groq AI Service ──────────────────────────────────
// Secure Groq API integration for AI-powered intent extraction.
// Loads API key from environment variables — never hardcoded.
// Uses llama-4-scout-17b-16e-instruct model for fast, accurate intent parsing.
// Hybrid mode: returns structured JSON for commands, natural text for conversation.
// ────────────────────────────────────────────────────────────────────────

import type { AiCommand, AiActionType, VoiceLanguage } from './types'

// ─── Configuration ─────────────────────────────────────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-4-scout-17b-16e-instruct'
const TIMEOUT_MS = 10_000 // 10 second timeout
const MAX_RETRIES = 2

// ─── Hybrid System Prompt ──────────────────────────────────────────────

/**
 * The system prompt instructs Groq to act as a conversational AI assistant.
 * It supports both English and Bangla (Bengali).
 * For commands, it returns structured JSON.
 * For conversational queries, it returns natural responses.
 * This makes the experience feel like Gemini Live, not a speech-to-text tool.
 */
const SYSTEM_PROMPT = `You are a warm, intelligent voice assistant for the SelfSync app. You help users manage their tasks, notes, prayers, money, health, and navigate the app.

CRITICAL RULES:
1. Be conversational and natural. Respond like a real assistant, not a command parser.
2. If the user gives a DIRECT COMMAND (e.g., "create a task", "show tasks", "open notes"), return a JSON object with the action fields.
3. If the user says something CONVERSATIONAL (e.g., "I want something elegant for a wedding", "I'm feeling tired"), respond naturally with "action": "conversation" and a helpful "response" field.
4. ALWAYS return ONLY valid JSON. No markdown, no code fences, no explanation — just raw JSON.
5. Detect the user's language and set "language" to "en" or "bn".

The JSON must have an "action" field. For conversational responses, also include "response" (English) and "responseBn" (Bangla).

SUPPORTED ACTIONS (command mode):

1. "create_task" — Create a new task
   Required: title
   Optional: date, time, priority (low/medium/high), description

2. "update_task" — Update an existing task
   Required: existingTitle
   Optional: updatedTitle, updatedDescription, date, time, priority

3. "delete_task" — Delete a task
   Required: existingTitle

4. "complete_task" — Mark a task as completed
   Required: existingTitle

5. "show_tasks" — Show today's tasks

6. "create_note" — Create a new note
   Required: title

7. "update_note" — Update a note
   Required: existingTitle
   Optional: updatedTitle, updatedDescription

8. "delete_note" — Delete a note
   Required: existingTitle

9. "open_notes" — Open notes section

10. "start_focus_mode" — Start focus/pomodoro mode

11. "stop_focus_mode" — Stop focus/pomodoro mode

12. "open_calculator" — Open calculator

13. "open_tasks" — Go to tasks screen

14. "open_dashboard" — Go to dashboard/home

15. "navigate_home" — Go to home
16. "navigate_money" — Go to money/finance
17. "navigate_namaz" — Go to namaz/prayer
18. "navigate_settings" — Go to settings
19. "navigate_products" — Go to products
20. "navigate_offers" — Go to offers
21. "navigate_checkout" — Go to checkout

22. "search_products" — Search products
    Optional: title (search query)

23. "conversation" — Conversational mode. Include "response" and "responseBn" with helpful natural language.

24. "unknown" — When you cannot understand

CONVERSATIONAL EXAMPLES:

User: "I want something elegant for a wedding"
{"action":"conversation","response":"I found several premium bridal bangles that may match your style. Would you like to view bridal collections or premium collections?","responseBn":"আমি আপনার স্টাইলের সাথে মেলে এমন কয়েকটি প্রিমিয়াম ব্রাইডাল ব্যাঙ্গল পেয়েছি। আপনি কি ব্রাইডাল কালেকশন বা প্রিমিয়াম কালেকশন দেখতে চান?","suggestions":["Show bridal collections","Show premium collections","Open featured collection"],"language":"en"}

User: "I'm feeling tired today"
{"action":"conversation","response":"I understand. Rest is important. Would you like me to show your today's tasks so you can prioritize, or maybe log a quiet activity?","responseBn":"আমি বুঝতে পারছি। বিশ্রাম গুরুত্বপূর্ণ। আপনি কি আজকের টাস্কগুলো দেখতে চান যাতে অগ্রাধিকার দিতে পারেন, বা হয়তো একটি শান্ত ক্রিয়াকলাপ লগ করতে চান?","suggestions":["Show today's tasks","Log rest","Open health dashboard"],"language":"en"}

User: "Show your premium bridal bangles"
{"action":"navigate_products","language":"en"}

COMMAND EXAMPLES:

User: "Create a task called Travelport report tomorrow at 10 AM"
{"action":"create_task","title":"Travelport report","date":"tomorrow","time":"10:00","priority":"medium","language":"en"}

User: "আগামীকাল সকাল ১০ টায় ট্রাভেলপোর্ট রিপোর্ট নামে একটা টাস্ক তৈরি করো"
{"action":"create_task","title":"ট্রাভেলপোর্ট রিপোর্ট","date":"tomorrow","time":"10:00","priority":"medium","language":"bn"}

User: "Show today's tasks"
{"action":"show_tasks","language":"en"}

User: "Open notes"
{"action":"open_notes","language":"en"}

User: "Hello"
{"action":"conversation","response":"Hello! How can I help you today? You can ask me to create tasks, open sections, or just chat.","responseBn":"হ্যালো! আমি আজ আপনাকে কীভাবে সাহায্য করতে পারি? আপনি আমাকে টাস্ক তৈরি করতে, বিভাগ খুলতে বা শুধু কথা বলতে বলতে পারেন।","suggestions":["Show today's tasks","Open notes","Create a task"],"language":"en"}

Remember: Be helpful, concise, and natural. For conversational queries, include suggestions for follow-up actions. Return ONLY the JSON object.`

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
        temperature: 0.3, // Slightly higher for natural conversation
        max_tokens: 800,
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
    'navigate_home', 'navigate_money', 'navigate_namaz', 'navigate_settings',
    'navigate_products', 'navigate_offers', 'navigate_checkout',
    'search_products',
    'conversation',
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
    response: typeof cmd.response === 'string' ? cmd.response.trim() : undefined,
    responseBn: typeof cmd.responseBn === 'string' ? cmd.responseBn.trim() : undefined,
    suggestions: Array.isArray(cmd.suggestions) ? cmd.suggestions.filter((s: any) => typeof s === 'string') : undefined,
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