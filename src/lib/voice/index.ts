// ─── SelfSync Voice — Public API ──────────────────────────────────────────

export { useVoice } from './useVoice'
export type { VoiceAPI } from './useVoice'
export { VoiceListener } from './listener'
export { VoiceSynthesizer } from './synthesizer'
export { VoiceActivityDetector } from './vad'
export { parseIntent } from './intent-parser'
export { executeCommand, executeAiCommand } from './command-registry'
export { processVoiceTranscript } from './ai-intent-processor'
export { processTranscript, isGroqConfigured, getModelName } from './groq-service'
export type {
  ParsedIntent,
  CommandResult,
  VoiceEntity,
  VoiceState,
  VoiceLanguage,
  IntentType,
  VoiceUIState,
  AiActionType,
  AiCommand,
  VADConfig,
  VADCallbacks,
  VADState,
} from './types'