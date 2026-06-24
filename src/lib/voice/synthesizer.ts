// ─── SelfSync Voice — Speech Synthesis (TTS) ──────────────────────────────
// Premium TTS with Bangla support, voice detection, and graceful fallback.
// Works with both headphones and speaker output natively via Web Speech API.

import type { VoiceLanguage, VoiceState } from './types'

export type SpeakCallback = (state: VoiceState) => void

interface SynthesizerOptions {
  language: VoiceLanguage
  onStateChange: SpeakCallback
  rate?: number
  pitch?: number
}

const DEFAULT_RATE = 0.75 // Slower for clarity — calm, clear assistant voice
const DEFAULT_PITCH = 1.0

export class VoiceSynthesizer {
  private options: SynthesizerOptions
  private isSpeaking = false
  private queue: SpeechSynthesisUtterance[] = []
  private voices: SpeechSynthesisVoice[] = []
  private audioContext: AudioContext | null = null

  constructor(options: SynthesizerOptions) {
    this.options = {
      rate: DEFAULT_RATE,
      pitch: DEFAULT_PITCH,
      ...options,
    }
    this.loadVoices()
  }

  private loadVoices(): void {
    if (typeof window === 'undefined') return
    this.voices = window.speechSynthesis.getVoices()
    window.speechSynthesis.onvoiceschanged = () => {
      this.voices = window.speechSynthesis.getVoices()
    }
  }

  private getRate(): number {
    return this.options.rate ?? DEFAULT_RATE
  }

  private getPitch(): number {
    return this.options.pitch ?? DEFAULT_PITCH
  }

  /** Find the best voice for the given language */
  private findVoice(language: VoiceLanguage): SpeechSynthesisVoice | null {
    const langCode = language === 'bn' ? 'bn-BD' : 'en-US'

    // 1. Try exact language + native speaker
    const exact = this.voices.find(
      (v) => v.lang === langCode && v.localService
    )
    if (exact) return exact

    // 2. Try any voice with that language
    const anyLang = this.voices.find((v) => v.lang.startsWith(langCode))
    if (anyLang) return anyLang

    // 3. For Bangla, try Bengali voices from India
    if (language === 'bn') {
      const bnIndia = this.voices.find((v) => v.lang.startsWith('bn'))
      if (bnIndia) return bnIndia
    }

    // 4. Fallback: default voice
    return this.voices[0] || null
  }

  /** Speak a message — works with headphones/speakers natively (Web Speech API routes audio automatically) */
  speak(text: string, language?: VoiceLanguage): void {
    if (typeof window === 'undefined') return

    const lang = language || this.options.language

    // Cancel previous speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    const voice = this.findVoice(lang)

    if (voice) {
      utterance.voice = voice
    }
    utterance.lang = lang === 'bn' ? 'bn-BD' : 'en-US'
    utterance.rate = this.getRate()
    utterance.pitch = this.getPitch()
    utterance.volume = 1.0

    utterance.onstart = () => {
      this.isSpeaking = true
      this.options.onStateChange('responding')
    }

    utterance.onend = () => {
      this.isSpeaking = false
      this.options.onStateChange('completed')
      this.processQueue()
    }

    utterance.onerror = () => {
      this.isSpeaking = false
      this.options.onStateChange('idle')
    }

    // Speak immediately — works with or without headphones automatically
    window.speechSynthesis.speak(utterance)
  }

  /** Queue a message to speak after current one finishes */
  enqueue(text: string, language?: VoiceLanguage): void {
    if (this.isSpeaking) {
      const utterance = new SpeechSynthesisUtterance(text)
      const voice = this.findVoice(language || this.options.language)
      if (voice) utterance.voice = voice
      utterance.lang = (language || this.options.language) === 'bn' ? 'bn-BD' : 'en-US'
      utterance.rate = this.getRate()
      utterance.pitch = this.getPitch()
      this.queue.push(utterance)
    } else {
      this.speak(text, language)
    }
  }

  private processQueue(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!
      window.speechSynthesis.speak(next)
    }
  }

  /** Stop speaking immediately */
  stop(): void {
    if (typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    this.queue = []
    this.isSpeaking = false
    this.options.onStateChange('idle')
  }

  /** Update language for new voice selection */
  setLanguage(language: VoiceLanguage): void {
    this.options = { ...this.options, language }
  }

  /** Check if currently speaking */
  get active(): boolean {
    return this.isSpeaking
  }

  /** Clean up */
  destroy(): void {
    this.stop()
  }
}