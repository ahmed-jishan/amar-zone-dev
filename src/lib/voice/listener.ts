// ─── SelfSync Voice — Web Speech API Listener ────────────────────────────
// Bullet-proof rewrite v2:
//   - Continuously listens after start() until explicitly stop()'d
//   - Auto-restarts on end/error with exponential backoff
//   - No more 2s silence killer — commands are processed while listening continues
//   - Pre-warmed singleton to avoid re-prompting permissions
// ──────────────────────────────────────────────────────────────────────────

import type { VoiceLanguage, VoiceState } from './types'

export type TranscriptCallback = (text: string, isFinal: boolean) => void
export type StateCallback = (state: VoiceState) => void
export type ErrorCallback = (error: string) => void

interface ListenerOptions {
  language: VoiceLanguage
  onTranscript: TranscriptCallback
  onStateChange: StateCallback
  onError: ErrorCallback
}

// Singleton SpeechRecognition instance to avoid repeated permission prompts
let sharedRecognition: SpeechRecognition | null = null

export class VoiceListener {
  private options: ListenerOptions
  private isListening = false
  private isStoppingExplicitly = false
  private restartTimeout: ReturnType<typeof setTimeout> | null = null
  private restartAttempts = 0
  private maxRestartDelay = 1600
  private preWarmed = false

  constructor(options: ListenerOptions) {
    this.options = options
  }

  /** Get or create a SpeechRecognition instance (shared singleton) */
  private getRecognition(): SpeechRecognition | null {
    if (sharedRecognition) return sharedRecognition

    if (typeof window === 'undefined') return null
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return null

    try {
      sharedRecognition = new (SpeechRecognitionAPI as new () => SpeechRecognition)()
      return sharedRecognition
    } catch {
      return null
    }
  }

  /** Pre-warm the Speech API (call on app mount) */
  preWarm(): void {
    if (this.preWarmed || typeof window === 'undefined') return
    try {
      const recognition = this.getRecognition()
      if (!recognition) {
        this.options.onError('Speech recognition not supported')
        return
      }
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = this.getLangCode(this.options.language)
      recognition.maxAlternatives = 3

      // Bind noop handlers once
      recognition.onresult = () => {}
      recognition.onerror = () => {}
      recognition.onend = () => {}

      // Quick start/stop to prompt microphone permission
      recognition.start()
      setTimeout(() => {
        try { recognition.abort() } catch { /* ignore */ }
      }, 100)

      this.preWarmed = true
    } catch {
      // Silently fail
    }
  }

  /** Start listening (continuous mode) */
  start(): void {
    if (this.isListening) return
    if (typeof window === 'undefined') return

    const recognition = this.getRecognition()
    if (!recognition) {
      this.options.onError('Speech recognition is not supported in this browser.')
      return
    }

    this.isStoppingExplicitly = false
    this.isListening = true
    this.restartAttempts = 0

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = this.getLangCode(this.options.language)
    recognition.maxAlternatives = 3

    recognition.onstart = () => {
      this.isListening = true
      this.restartAttempts = 0
      this.options.onStateChange('listening')
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }

      if (finalTranscript) {
        this.options.onTranscript(finalTranscript.trim(), true)
      }

      if (interimTranscript) {
        this.options.onTranscript(interimTranscript.trim(), false)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return // onend will fire, restart there
      }
      this.options.onError(`Recognition error: ${event.error}`)
    }

    recognition.onend = () => {
      if (this.isStoppingExplicitly) {
        this.isListening = false
        this.options.onStateChange('idle')
        return
      }

      this.isListening = false
      this.options.onStateChange('idle')
      this.scheduleRestart()
    }

    try {
      recognition.start()
    } catch (error) {
      try { recognition.abort() } catch { /* ignore */ }
      this.scheduleRestart()
    }
  }

  /** Schedule a restart with exponential backoff */
  private scheduleRestart(): void {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout)
    }

    const delay = Math.min(
      300 * Math.pow(2, this.restartAttempts),
      this.maxRestartDelay
    )
    this.restartAttempts++

    this.restartTimeout = setTimeout(() => {
      this.restartTimeout = null
      if (!this.isListening && !this.isStoppingExplicitly) {
        this.start()
      }
    }, delay)
  }

  /** Stop listening permanently (no auto-restart) */
  stop(): void {
    this.isStoppingExplicitly = true
    this.isListening = false

    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout)
      this.restartTimeout = null
    }

    if (sharedRecognition) {
      try {
        sharedRecognition.stop()
      } catch {
        try { sharedRecognition.abort() } catch { /* ignore */ }
      }
    }

    this.options.onStateChange('idle')
  }

  /** Update language mid-session */
  setLanguage(language: VoiceLanguage): void {
    const wasListening = this.isListening
    if (wasListening) {
      this.isStoppingExplicitly = false
      this.stop()
    }
    this.options = { ...this.options, language }
    if (wasListening) {
      setTimeout(() => this.start(), 150)
    }
  }

  /** Clean up */
  destroy(): void {
    this.stop()
    sharedRecognition = null
    this.preWarmed = false
  }

  private getLangCode(language: VoiceLanguage): string {
    return language === 'bn' ? 'bn-BD' : 'en-US'
  }

  get isActive(): boolean {
    return this.isListening
  }
}