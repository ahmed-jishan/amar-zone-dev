// ─── SelfSync Voice — Core Types ──────────────────────────────────────────

export type VoiceLanguage = 'en' | 'bn'

// ─── Legacy Intent Types (keep for backward compatibility) ─────────────────
export type IntentType =
  // Namaz
  | 'log_prayer'
  | 'set_jamat'
  | 'set_azan'
  | 'next_prayer'
  | 'prayer_streak'
  | 'play_adhan'
  // Tasks
  | 'add_task'
  | 'complete_task'
  | 'list_tasks'
  | 'filter_tasks'
  // Money
  | 'add_expense'
  | 'add_income'
  | 'check_balance'
  | 'month_summary'
  // Health
  | 'log_weight'
  | 'check_bmi'
  // Navigation
  | 'navigate'
  // System
  | 'greeting'
  | 'help'
  | 'stop_listening'
  | 'status'
  // Destructive (blocked)
  | 'destructive'

// ─── AI-Powered Intent Types (15 actions) ─────────────────────────────────
export type AiActionType =
  | 'create_task'
  | 'update_task'
  | 'delete_task'
  | 'complete_task'
  | 'show_tasks'
  | 'create_note'
  | 'update_note'
  | 'delete_note'
  | 'open_notes'
  | 'start_focus_mode'
  | 'stop_focus_mode'
  | 'open_calculator'
  | 'open_tasks'
  | 'open_dashboard'
  | 'unknown'

export interface VoiceEntity {
  prayer?: string
  time?: string
  amount?: number
  category?: string
  taskTitle?: string
  priority?: string
  status?: string
  target?: string
  weight?: number
  note?: string
}

export interface ParsedIntent {
  intent: IntentType
  entities: VoiceEntity
  confidence: number // 0–1
  raw: string
  language: VoiceLanguage
  isDestructive: boolean
}

export interface CommandResult {
  success: boolean
  message: string
  messageBn?: string
  action?: string
  error?: string
}

// ─── AI Command Types ──────────────────────────────────────────────────────

/** Structured JSON returned by Groq AI */
export interface AiCommand {
  action: AiActionType
  title?: string
  description?: string
  date?: string
  time?: string
  priority?: 'low' | 'medium' | 'high'
  category?: string
  noteId?: string
  existingTitle?: string
  updatedTitle?: string
  updatedDescription?: string
  /** Raw language detected by Groq */
  language?: VoiceLanguage
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'understanding' | 'executing' | 'speaking' | 'error' | 'completed'

export interface VoiceUIState {
  state: VoiceState
  transcript: string
  partialTranscript: string
  lastResult: CommandResult | null
  suggestions: string[]
}