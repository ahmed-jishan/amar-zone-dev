// ─── SelfSync Voice — Voice Activity Detection ──────────────────────────
// Lightweight AudioContext-based silence detection for natural endpointing.
// Detects when user stops speaking and triggers auto-transition.
// Works like Gemini Live — no manual stop needed.
// ────────────────────────────────────────────────────────────────────────

import type { VADConfig, VADState, VADCallbacks } from './types'
import { DEFAULT_VAD_CONFIG } from './types'

/**
 * VoiceActivityDetector analyzes microphone audio levels to determine
 * when the user is speaking vs. silent. When silence exceeds the timeout,
 * it fires onSpeechEnd to auto-advance the voice state machine.
 */
export class VoiceActivityDetector {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private mediaStream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private animationId: number | null = null
  private config: VADConfig
  private callbacks: VADCallbacks
  private isActive = false

  // Speech state tracking
  private isSpeaking = false
  private lastSpeechTimestamp = 0
  private speechStartTimestamp = 0
  private silenceCheckInterval: ReturnType<typeof setInterval> | null = null

  // Audio level data for waveform
  private audioLevels: Float32Array | null = null
  private latestLevel = 0

  constructor(
    callbacks: VADCallbacks,
    config: Partial<VADConfig> = {}
  ) {
    this.config = { ...DEFAULT_VAD_CONFIG, ...config }
    this.callbacks = callbacks
  }

  /**
   * Start monitoring microphone audio for voice activity.
   * Requires an already-obtained MediaStream.
   */
  async start(stream: MediaStream): Promise<boolean> {
    if (this.isActive) return true

    try {
      // Create AudioContext (must be created after user gesture on iOS)
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create analyser node for real-time frequency analysis
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.8

      // Connect microphone to analyser
      this.source = this.audioContext.createMediaStreamSource(stream)
      this.source.connect(this.analyser)

      // Buffer for frequency data (used for waveform display)
      this.audioLevels = new Float32Array(this.analyser.frequencyBinCount)
      this.mediaStream = stream

      this.isActive = true
      this.isSpeaking = false
      this.lastSpeechTimestamp = Date.now()
      this.latestLevel = 0

      // Start the audio level monitoring loop
      this.startMonitoringLoop()

      // Start silence detection interval
      this.startSilenceDetection()

      return true
    } catch (error) {
      console.warn('[VAD] Failed to start:', error)
      this.destroy()
      return false
    }
  }

  /**
   * Stop monitoring and clean up audio resources.
   */
  stop(): void {
    this.isActive = false
    this.isSpeaking = false

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    if (this.silenceCheckInterval !== null) {
      clearInterval(this.silenceCheckInterval)
      this.silenceCheckInterval = null
    }

    // Disconnect and close
    if (this.source) {
      try { this.source.disconnect() } catch {}
      this.source = null
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {})
      this.audioContext = null
    }

    this.analyser = null
    this.audioLevels = null
    this.latestLevel = 0
  }

  /**
   * Pause monitoring without full cleanup (e.g., during processing).
   */
  pause(): void {
    this.isActive = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    if (this.silenceCheckInterval !== null) {
      clearInterval(this.silenceCheckInterval)
      this.silenceCheckInterval = null
    }
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend().catch(() => {})
    }
  }

  /**
   * Resume monitoring after pause.
   */
  resume(): void {
    if (!this.audioContext) return
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {})
    }
    this.isActive = true
    this.isSpeaking = false
    this.lastSpeechTimestamp = Date.now()
    this.startMonitoringLoop()
    this.startSilenceDetection()
  }

  /**
   * Get the latest normalized audio level (0–1) for waveform animation.
   */
  getAudioLevel(): number {
    return this.latestLevel
  }

  /**
   * Check if VAD is currently active.
   */
  get active(): boolean {
    return this.isActive
  }

  /**
   * Clean up all resources.
   */
  destroy(): void {
    this.stop()
  }

  // ─── Private Methods ──────────────────────────────────────────────────

  /**
   * Continuously monitor audio levels using requestAnimationFrame.
   * Computes RMS (root mean square) of frequency data for smooth levels.
   */
  private startMonitoringLoop(): void {
    if (!this.analyser || !this.audioLevels) return

    const analyze = () => {
      if (!this.isActive || !this.analyser || !this.audioLevels) {
        this.animationId = null
        return
      }

      // Get time-domain data (cast through unknown to handle TS 5.9+ typed array variance)
      this.analyser.getFloatTimeDomainData(this.audioLevels as unknown as Float32Array<ArrayBuffer>)

      // Compute RMS (root mean square) for smooth level detection
      let sum = 0
      for (let i = 0; i < this.audioLevels.length; i++) {
        sum += this.audioLevels[i] * this.audioLevels[i]
      }
      const rms = Math.sqrt(sum / this.audioLevels.length)

      // Normalize to 0–1 range (typical RMS for speech is 0.01–0.3)
      const normalized = Math.min(1, rms * 10)

      // Smooth the level with exponential moving average
      this.latestLevel = this.latestLevel * 0.7 + normalized * 0.3

      // Fire audio level callback for waveform
      this.callbacks.onAudioLevel(this.latestLevel)

      // Detect speech vs. silence based on threshold
      // Convert dB threshold to linear: threshold_linear = 10^(threshold_dB / 20)
      const thresholdLinear = Math.pow(10, this.config.silenceThreshold / 20)

      if (this.latestLevel > thresholdLinear) {
        // Speech detected
        if (!this.isSpeaking) {
          // Transition from silence → speaking
          this.isSpeaking = true
          this.speechStartTimestamp = Date.now()
          this.callbacks.onSpeechStart()
          this.callbacks.onVADStateChange('speaking')
        }
        this.lastSpeechTimestamp = Date.now()
      }

      this.animationId = requestAnimationFrame(analyze)
    }

    this.animationId = requestAnimationFrame(analyze)
  }

  /**
   * Periodic check for silence duration.
   * If silence exceeds timeout, fires onSpeechEnd.
   */
  private startSilenceDetection(): void {
    this.silenceCheckInterval = setInterval(() => {
      if (!this.isActive) return

      const now = Date.now()
      const silenceDuration = now - this.lastSpeechTimestamp

      // Check if we were speaking and now silence exceeds timeout
      if (this.isSpeaking && silenceDuration > this.config.silenceTimeoutMs) {
        // Ensure minimum speech duration was met
        const speechDuration = now - this.speechStartTimestamp
        if (speechDuration >= this.config.minSpeechDurationMs) {
          this.isSpeaking = false
          this.callbacks.onSpeechEnd()
          this.callbacks.onVADStateChange('silence')
        }
      }
    }, this.config.checkIntervalMs)
  }
}