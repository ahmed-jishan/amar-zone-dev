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
  | 'open_quick_transfer'
  | 'open_notifications'
  | 'toggle_notifications'
  // System
  | 'greeting'
  | 'help'
  | 'stop_listening'
  | 'status'
  // Destructive (blocked)
  | 'destructive'

// ─── AI-Powered Intent Types (expanded) ──────────────────────────────────
export type AiActionType =
  // Tasks
  | 'create_task'
  | 'update_task'
  | 'delete_task'
  | 'complete_task'
  | 'show_tasks'
  // Notes
  | 'create_note'
  | 'update_note'
  | 'delete_note'
  | 'open_notes'
  // Focus
  | 'start_focus_mode'
  | 'stop_focus_mode'
  // Navigation
  | 'open_calculator'
  | 'open_tasks'
  | 'open_dashboard'
  | 'navigate_home'
  | 'navigate_money'
  | 'navigate_namaz'
  | 'navigate_settings'
  | 'navigate_products'
  | 'navigate_offers'
  | 'navigate_checkout'
  // Search
  | 'search_products'
  // Context
  | 'show_featured_collection'
  | 'conversation'
  // Fallback
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
  /** Natural language response for conversational queries */
  response?: string
  responseBn?: string
  /** Suggested follow-up actions */
  suggestions?: string[]
}

// ─── Enhanced Voice States ─────────────────────────────────────────────────
// Premium state machine: idle → listening → speech_detected → processing
// → understanding → executing → responding → idle
export type VoiceState = 
  | 'idle' 
  | 'listening' 
  | 'speech_detected'   // NEW: user is actively speaking, voice detected
  | 'processing'        // NEW: speech ended, processing audio
  | 'understanding'     // AI parsing transcript
  | 'executing'         // Executing command
  | 'responding'        // NEW: AI speaking back
  | 'speaking'          // Legacy: TTS active
  | 'completed'         
  | 'error'

// ─── VAD (Voice Activity Detection) Types ──────────────────────────────────

export interface VADConfig {
  /** Silence threshold in dB (lower = more sensitive). Default: -50 */
  silenceThreshold: number
  /** Duration of silence in ms before declaring speech ended. Default: 1200 */
  silenceTimeoutMs: number
  /** Minimum speech duration in ms to consider valid speech. Default: 300 */
  minSpeechDurationMs: number
  /** Check interval in ms. Default: 100 */
  checkIntervalMs: number
}

export const DEFAULT_VAD_CONFIG: VADConfig = {
  silenceThreshold: -50,
  silenceTimeoutMs: 1200,
  minSpeechDurationMs: 300,
  checkIntervalMs: 100,
}

export type VADState = 'silence' | 'speaking'

export interface VADCallbacks {
  onSpeechStart: () => void
  onSpeechEnd: () => void
  onVADStateChange: (state: VADState) => void
  onAudioLevel: (level: number) => void // 0–1 normalized
}

export interface VoiceUIState {
  state: VoiceState
  transcript: string
  partialTranscript: string
  lastResult: CommandResult | null
  suggestions: string[]
  audioLevel: number // 0–1 for waveform animation
  hasDetectedSpeech: boolean
}
