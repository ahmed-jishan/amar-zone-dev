// ─── SelfSync Voice — Web Speech API Listener ────────────────────────────
// Reliable v3:
//   - Fresh SpeechRecognition instance per start() to avoid stale state
//   - No singleton pattern — creates new instance each time for reliability
//   - Explicit abort on stop to clean up properly
//   - Handles permission errors gracefully
//   - Works on both desktop and mobile browsers
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

export class VoiceListener {
  private options: ListenerOptions
  private recognition: SpeechRecognition | null = null
  private isListening = false
  private isStoppingExplicitly = false
  private restartTimeout: ReturnType<typeof setTimeout> | null = null
  private restartAttempts = 0
  private maxRestartDelay = 3000
  private currentStream: MediaStream | null = null

  constructor(options: ListenerOptions) {
    this.options = options
  }

  /** Create a fresh SpeechRecognition instance */
  private createRecognition(): SpeechRecognition | null {
    if (typeof window === 'undefined') return null

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      this.options.onError('Speech recognition is not supported in this browser.')
      return null
    }

    try {
      return new (SpeechRecognitionAPI as new () => SpeechRecognition)()
    } catch {
      this.options.onError('Failed to create speech recognition instance.')
      return null
    }
  }

  /** Request microphone permission without starting full recognition */
  async requestPermission(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.options.onError('Microphone access is not supported.')
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop all tracks immediately — we just needed permission
      stream.getTracks().forEach((track) => track.stop())
      return true
    } catch (err: any) {
      const message = err.name === 'NotAllowedError'
        ? 'Microphone permission denied. Please allow microphone access in your browser settings.'
        : `Microphone error: ${err.message || 'Unknown error'}`
      this.options.onError(message)
      return false
    }
  }

  /** Start listening — creates fresh recognition instance */
  async start(): Promise<void> {
    if (this.isListening) return
    if (typeof window === 'undefined') return

    // Clear any pending restart
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout)
      this.restartTimeout = null
    }

    // Destroy any previous instance
    this.destroyRecognition()

    // Create fresh instance
    const recognition = this.createRecognition()
    if (!recognition) return

    this.recognition = recognition
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

    // Optional Webkit-specific events for debug logging
    ;(recognition as any).onaudiostart = () => {
      console.log('[VoiceListener] Audio started')
    }
    ;(recognition as any).onspeechstart = () => {
      console.log('[VoiceListener] Speech detected')
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
        console.log('[VoiceListener] Final transcript:', finalTranscript.trim())
        this.options.onTranscript(finalTranscript.trim(), true)
        
        // Stop listening after final result to break the continuous loop
        // This prevents the "listening uthe thakce" issue
        // The UI will restart via useVoice's startListening if needed
        setTimeout(() => {
          if (this.isListening && !this.isStoppingExplicitly) {
            console.log('[VoiceListener] Auto-stopping after final transcript')
            this.isStoppingExplicitly = true
            this.isListening = false
            this.destroyRecognition()
            this.options.onStateChange('idle')
          }
        }, 100)
      }

      if (interimTranscript) {
        console.log('[VoiceListener] Interim:', interimTranscript.trim())
        this.options.onTranscript(interimTranscript.trim(), false)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('[VoiceListener] Error:', event.error, event.message)

      if (event.error === 'no-speech') {
        // Silent — no speech detected, will restart via onend
        return
      }
      if (event.error === 'aborted') {
        // Explicit abort — do nothing
        return
      }
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this.isStoppingExplicitly = true
        this.isListening = false
        this.options.onError('Microphone access was denied. Please allow microphone access in your browser settings.')
        this.options.onStateChange('error')
        return
      }
      if (event.error === 'network') {
        this.options.onError('Network error occurred. Please check your connection.')
        return
      }

      this.options.onError(`Recognition error: ${event.error}`)
    }

    recognition.onend = () => {
      this.isListening = false

      if (this.isStoppingExplicitly) {
        this.options.onStateChange('idle')
        return
      }

      // Don't change state — we'll restart silently
      // But if we've restarted too many times, surface the error
      if (this.restartAttempts > 5) {
        this.options.onError('Speech recognition keeps stopping. Try reloading the page.')
        this.options.onStateChange('idle')
        return
      }

      this.scheduleRestart()
    }

    try {
      recognition.start()
    } catch (error: any) {
      this.isListening = false
      this.options.onError(`Failed to start: ${error.message || 'Unknown error'}`)
      this.scheduleRestart()
    }
  }

  /** Schedule a restart with exponential backoff */
  private scheduleRestart(): void {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout)
    }

    const delay = Math.min(
      500 * Math.pow(1.5, this.restartAttempts),
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

  /** Stop listening permanently — destroys the recognition instance */
  stop(): void {
    this.isStoppingExplicitly = true
    this.isListening = false

    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout)
      this.restartTimeout = null
    }

    this.destroyRecognition()
    this.options.onStateChange('idle')
  }

  /** Destroy the current recognition instance */
  private destroyRecognition(): void {
    if (this.recognition) {
      try {
        this.recognition.onstart = null
        this.recognition.onresult = null
        this.recognition.onerror = null
        this.recognition.onend = null
        this.recognition.abort()
      } catch {
        // Ignore errors during cleanup
      }
      this.recognition = null
    }
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
  }

  private getLangCode(language: VoiceLanguage): string {
    return language === 'bn' ? 'bn-BD' : 'en-US'
  }

  get isActive(): boolean {
    return this.isListening
  }
}
