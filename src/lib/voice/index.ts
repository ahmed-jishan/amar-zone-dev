// ─── SelfSync Voice — Public API ──────────────────────────────────────────

export { useVoice } from './useVoice'
export type { VoiceAPI } from './useVoice'
export { VoiceListener } from './listener'
export { VoiceSynthesizer } from './synthesizer'
export { parseIntent } from './intent-parser'
export { executeCommand } from './command-registry'
export type {
  ParsedIntent,
  CommandResult,
  VoiceEntity,
  VoiceState,
  VoiceLanguage,
  IntentType,
  VoiceUIState,
} from './types'