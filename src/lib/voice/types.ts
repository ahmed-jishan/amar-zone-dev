// ─── SelfSync Voice — Core Types ──────────────────────────────────────────

export type VoiceLanguage = 'en' | 'bn'

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

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

export interface VoiceUIState {
  state: VoiceState
  transcript: string
  partialTranscript: string
  lastResult: CommandResult | null
  suggestions: string[]
}