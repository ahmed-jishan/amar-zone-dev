// ─── QuranPlayerService ─────────────────────────────────────────────────────
// Singleton audio service with MediaSession integration, audio focus handling,
// playback state recovery, and global event dispatch.

import { getAyahAudioUrl } from '../utils/quranApi'

export interface QuranPlaybackState {
  surahNumber: number | null
  ayahNumber: number | null
  isPlaying: boolean
  isLoaded: boolean
  error: string | null
}

export type PlaybackListener = (state: QuranPlaybackState) => void

type ReciterKey = 'alafasy' | 'husary' | 'sudais'

const STATE_KEY = 'quran-playback-state'

function safeStorage(): Storage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
    return null;
  } catch { return null }
}

class QuranPlayerService {
  private audio: HTMLAudioElement | null = null
  private listeners = new Set<PlaybackListener>()
  private state: QuranPlaybackState = {
    surahNumber: null,
    ayahNumber: null,
    isPlaying: false,
    isLoaded: false,
    error: null,
  }
  private reciter: ReciterKey = 'alafasy'
  private autoAdvanceEnabled = true
  private audioFocusResume = false
  private loadToken = 0
  private visibilityChangeHandler: (() => void) | null = null

  constructor() {
    this.recoverState()
    this.setupAudioFocus()
  }

  private recoverState() {
    const storage = safeStorage()
    if (!storage) return
    try {
      const saved = storage.getItem(STATE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as QuranPlaybackState
        this.state = { ...this.state, ...parsed, isPlaying: false, isLoaded: false }
      }
    } catch { /* ignore */ }
  }

  private persistState() {
    const storage = safeStorage()
    if (!storage) return
    try {
      storage.setItem(STATE_KEY, JSON.stringify({
        surahNumber: this.state.surahNumber,
        ayahNumber: this.state.ayahNumber,
        isPlaying: false,
        isLoaded: false,
        error: null,
      }))
    } catch { /* ignore */ }
  }

  subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener)
    listener({ ...this.state })
    return () => { this.listeners.delete(listener) }
  }

  private notify() {
    const snapshot = { ...this.state }
    this.listeners.forEach((fn) => fn(snapshot))
  }

  setReciter(reciter: ReciterKey) { this.reciter = reciter }

  async playPosition(surahNumber: number, ayahNumber: number) {
    const token = ++this.loadToken
    if (this.state.surahNumber === surahNumber && this.state.ayahNumber === ayahNumber && this.audio) {
      if (this.state.isPlaying) { this.pause(); return }
      try {
        await this.audio.play()
        this.state.isPlaying = true
        this.state.error = null
        this.updateMediaSession()
        this.notify()
      } catch { this.state.error = 'Playback failed'; this.notify() }
      return
    }

    try {
      const audio = this.audio ?? new Audio()
      this.audio = audio
      audio.pause()
      audio.oncanplaythrough = null
      audio.onerror = null
      audio.onended = null
      audio.preload = 'auto'
      audio.src = getAyahAudioUrl(surahNumber, ayahNumber, this.reciter)

      this.state = { ...this.state, surahNumber, ayahNumber, isPlaying: false, isLoaded: false, error: null }
      this.notify()

      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          cleanup()
          reject(new Error('Audio load timed out'))
        }, 15000)
        const cleanup = () => {
          window.clearTimeout(timeout)
          audio.oncanplaythrough = null
          audio.onerror = null
        }
        audio.oncanplaythrough = () => {
          cleanup()
          resolve()
        }
        audio.onerror = () => {
          cleanup()
          reject(new Error('Audio load failed'))
        }
        audio.load()
      })

      if (token !== this.loadToken) return

      this.state.isLoaded = true
      this.notify()

      await audio.play()
      if (token !== this.loadToken) {
        audio.pause()
        return
      }
      this.state.isPlaying = true
      this.updateMediaSession()
      this.setupMediaSessionHandlers()
      this.setupAudioEnded(surahNumber, ayahNumber)
      this.persistState()
      this.notify()
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Audio error'
      this.notify()
    }
  }

  pause() {
    if (!this.audio) return
    this.audio.pause()
    this.state.isPlaying = false
    this.updateMediaSession()
    this.notify()
  }

  resume() {
    if (!this.audio || !this.state.isLoaded) return
    this.audio.play().then(() => {
      this.state.isPlaying = true
      this.updateMediaSession()
      this.notify()
    }).catch(() => { this.state.error = 'Resume failed'; this.notify() })
  }

  togglePlayPause() {
    if (this.state.isPlaying) this.pause()
    else this.resume()
  }

  async next() {
    if (!this.state.surahNumber || !this.state.ayahNumber) return
    const { SURAHS } = await import('../data/surahs')
    const current = SURAHS.find((s) => s.number === this.state.surahNumber)
    if (!current) return
    const nextAyah = this.state.ayahNumber + 1
    if (nextAyah <= current.verses) {
      await this.playPosition(this.state.surahNumber, nextAyah)
      return
    }
    const nextSurah = SURAHS.find((s) => s.number === this.state.surahNumber! + 1)
    if (nextSurah) await this.playPosition(nextSurah.number, 1)
  }

  async prev() {
    if (!this.state.surahNumber || !this.state.ayahNumber) return
    const { SURAHS } = await import('../data/surahs')
    const prevAyah = this.state.ayahNumber - 1
    if (prevAyah >= 1) { await this.playPosition(this.state.surahNumber, prevAyah); return }
    const prevSurah = SURAHS.find((s) => s.number === this.state.surahNumber! - 1)
    if (prevSurah) await this.playPosition(prevSurah.number, prevSurah.verses)
  }

  stop() {
    this.loadToken += 1
    if (this.audio) {
      this.audio.pause()
      this.audio.oncanplaythrough = null
      this.audio.onerror = null
      this.audio.onended = null
      this.audio.src = ''
    }
    this.state = { surahNumber: null, ayahNumber: null, isPlaying: false, isLoaded: false, error: null }
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none'
    }
    const storage = safeStorage()
    if (storage) {
      try { storage.removeItem(STATE_KEY) } catch { /* ignore */ }
    }
    // Make sure native notification is hidden on stop
    this.updateMediaSession()
    this.notify()
  }

  setAutoAdvance(enabled: boolean) { this.autoAdvanceEnabled = enabled }
  getState(): QuranPlaybackState { return { ...this.state } }

  private updateMediaSession() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: this.state.surahNumber
        ? `Surah ${this.state.surahNumber} · Ayah ${this.state.ayahNumber}`
        : 'Quran Recitation',
      artist: `Quran · ${this.reciter}`,
      album: 'Quran Recitation',
      artwork: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    })
    navigator.mediaSession.playbackState = this.state.isPlaying ? 'playing' : 'paused'
  }

  private setupMediaSessionHandlers() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    navigator.mediaSession.setActionHandler('play', () => this.resume())
    navigator.mediaSession.setActionHandler('pause', () => this.pause())
    navigator.mediaSession.setActionHandler('nexttrack', () => { void this.next() })
    navigator.mediaSession.setActionHandler('previoustrack', () => { void this.prev() })
    navigator.mediaSession.setActionHandler('stop', () => this.stop())
  }

  private setupAudioEnded(surahNumber: number, ayahNumber: number) {
    if (!this.audio) return
    this.audio.onended = () => {
      this.state.isPlaying = false
      this.updateMediaSession()
      this.notify()
      if (this.autoAdvanceEnabled) void this.next()
    }
  }

  private setupAudioFocus() {
    if (typeof document === 'undefined') return
    if (this.visibilityChangeHandler) return
    this.visibilityChangeHandler = () => {
      if (document.visibilityState === 'visible' && this.audioFocusResume) {
        this.audioFocusResume = false
        if (!this.state.isPlaying && this.state.isLoaded) this.resume()
      }
    }
    document.addEventListener('visibilitychange', this.visibilityChangeHandler)
  }

  handleIncomingCall() {
    const wasPlaying = this.state.isPlaying
    this.pause()
    this.audioFocusResume = wasPlaying
    const handler = () => {
      if (document.visibilityState === 'visible') {
        document.removeEventListener('visibilitychange', handler)
        if (this.audioFocusResume) { this.audioFocusResume = false; this.resume() }
      }
    }
    document.addEventListener('visibilitychange', handler)
  }

  destroy() {
    this.loadToken += 1
    if (this.audio) {
      this.audio.pause()
      this.audio.oncanplaythrough = null
      this.audio.onerror = null
      this.audio.onended = null
      this.audio.src = ''
      this.audio = null
    }
    if (this.visibilityChangeHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler)
      this.visibilityChangeHandler = null
    }
    this.listeners.clear()
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none'
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
      navigator.mediaSession.setActionHandler('nexttrack', null)
      navigator.mediaSession.setActionHandler('previoustrack', null)
      navigator.mediaSession.setActionHandler('stop', null)
    }
  }
}

export const quranPlayer = new QuranPlayerService()
