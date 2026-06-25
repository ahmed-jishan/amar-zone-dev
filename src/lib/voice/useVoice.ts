'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { VoiceListener } from './listener'
import { VoiceSynthesizer } from './synthesizer'
import { parseIntent } from './intent-parser'
import { executeCommand } from './command-registry'
import { processVoiceTranscript } from './ai-intent-processor'
import type { VoiceState, CommandResult, VoiceLanguage } from './types'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { useRouter } from 'next/navigation'

export interface VoiceAPI {
  state: VoiceState
  transcript: string
  partialTranscript: string
  lastResult: CommandResult | null
  isListening: boolean
  isSpeaking: boolean
  isVoiceEnabled: boolean
  isAiEnabled: boolean
  suggestions: string[]
  audioLevel: number
  hasDetectedSpeech: boolean
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
  speak: (text: string, language?: VoiceLanguage) => void
  speakBn: (text: string) => void
}

// ─── Route Map (defined outside hook for stability) ──────────────────────
const ROUTE_MAP: Record<string, string> = {
  'navigate_tasks': '/tasks',
  'navigate_dashboard': '/',
  'navigate_notes': '/notes',
  'navigate_calculator': '/calculator',
  'navigate_home': '/home',
  'navigate_money': '/money',
  'navigate_namaz': '/namaz',
  'navigate_settings': '/settings',
  'open_quick_transfer': '/settings',
  'navigate_products': '/products',
  'navigate_offers': '/offers',
  'navigate_checkout': '/checkout',
  'navigate': '/home',
  'open_calculator': '/calculator',
  'open_tasks': '/tasks',
  'open_dashboard': '/home',
  'open_notes': '/notes',
  'search_products': '/products',
}

export function useVoice(): VoiceAPI {
  const [state, setState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [partialTranscript, setPartialTranscript] = useState('')
  const [lastResult, setLastResult] = useState<CommandResult | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [hasDetectedSpeech, setHasDetectedSpeech] = useState(false)
  const [suggestions] = useState<string[]>([
    "Create a task called Grocery shopping tomorrow at 10 AM",
    "Show today's tasks",
    "Open notes",
    "Start focus mode",
    "Complete meeting task",
    "Open calculator",
    "আগামীকাল সকাল ১০ টায় একটা টাস্ক তৈরি করো",
    "আজকের টাস্কগুলো দেখাও",
  ])

  // Refs for stable cross-callback access
  const listenerRef = useRef<VoiceListener | null>(null)
  const synthRef = useRef<VoiceSynthesizer | null>(null)
  const mountedRef = useRef(true)
  const isProcessingRef = useRef(false)
  const routerRef = useRef(useRouter())
  
  // Transcript tracking - MUST update ref immediately for VAD/transcript callbacks
  const latestTranscriptRef = useRef('')
  const currentAudioStreamRef = useRef<MediaStream | null>(null)

  const isVoiceEnabled = useSettingsStore((s) => s.voiceEnabled)
  const language = useSettingsStore((s) => s.language) as VoiceLanguage

  // Check if Groq is configured
  const [isAiEnabled] = useState(() => {
    const key = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY || ''
    return key.length > 0
  })

  // ─── Navigation Helper ──────────────────────────────────────────────────
  const navigateTo = useCallback((action: string) => {
    const router = routerRef.current
    if (action === 'open_quick_transfer') {
      router.push('/settings')
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('selfsync-open-quick-transfer'))
      }, 250)
      return
    }
    if (action === 'open_notifications') {
      window.dispatchEvent(new CustomEvent('selfsync-open-notifications'))
      return
    }
    const route = ROUTE_MAP[action] || '/'
    try {
      router.push(route)
    } catch {
      // Route may not exist
    }
  }, [])

  // ─── Process Command (stable, defined before use) ──────────────────────
  const processCommand = useCallback(async (text: string) => {
    if (!mountedRef.current || isProcessingRef.current) return
    isProcessingRef.current = true
    
    console.log('[Voice] Processing:', text)

    // 1. Show understanding state
    setState('understanding')
    setTranscript(text)
    setPartialTranscript('')

    try {
      // 2. Process with AI (falls back to keyword parser if Groq fails)
      const { result, language: detectedLang } = await processVoiceTranscript(text)

      if (!mountedRef.current) {
        isProcessingRef.current = false
        return
      }

      // 3. Execute / Navigate
      setState('executing')
      setLastResult(result)

      if (result.action) {
        navigateTo(result.action)
      }

      // 4. Speak the response
      const msg = detectedLang === 'bn' ? (result.messageBn || result.message) : result.message
      if (synthRef.current && msg) {
        synthRef.current.speak(msg, detectedLang)
      }

      // 5. Show responding state
      setState('responding')

      // 6. After delay, return to idle
      setTimeout(() => {
        if (!mountedRef.current) return
        isProcessingRef.current = false
        setState('idle')
        latestTranscriptRef.current = ''
      }, 3000)

    } catch (error) {
      console.error('[Voice] Error:', error)
      if (!mountedRef.current) {
        isProcessingRef.current = false
        return
      }

      // Fallback to legacy parser
      const parsed = parseIntent(text)
      const result = executeCommand(parsed)

      setLastResult(result)
      setState('executing')

      if (result.action) {
        navigateTo(result.action)
      }

      const msg = parsed.language === 'bn' ? (result.messageBn || result.message) : result.message
      if (synthRef.current && msg) {
        synthRef.current.speak(msg, parsed.language)
      }

      setState('responding')

      setTimeout(() => {
        if (!mountedRef.current) return
        isProcessingRef.current = false
        setState('idle')
        latestTranscriptRef.current = ''
      }, 3000)
    }
  }, [navigateTo])

  // ─── Start Listening ────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    if (!isVoiceEnabled || isProcessingRef.current || !listenerRef.current) return
    
    console.log('[Voice] Start listening')
    
    // Reset state
    setLastResult(null)
    setTranscript('')
    setPartialTranscript('')
    setHasDetectedSpeech(false)
    setAudioLevel(0)
    latestTranscriptRef.current = ''
    isProcessingRef.current = false

    // Request mic permission (also gets stream for potential audio level display)
    const hasPermission = await listenerRef.current.requestPermission()
    if (!hasPermission) {
      setState('error')
      return
    }

    // Optionally get audio stream for waveform (VAD bypassed for reliability)
    try {
      if (!currentAudioStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        currentAudioStreamRef.current = stream
      }
    } catch {
      // Audio level visualization not available - still works without it
    }

    // Start speech recognition
    listenerRef.current.start()
  }, [isVoiceEnabled])

  // ─── Stop Listening ─────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    console.log('[Voice] Stop listening')
    
    // Stop recognition
    listenerRef.current?.stop()
    
    // Release microphone
    if (currentAudioStreamRef.current) {
      currentAudioStreamRef.current.getTracks().forEach(t => t.stop())
      currentAudioStreamRef.current = null
    }
    
    isProcessingRef.current = false
    setState('idle')
    setHasDetectedSpeech(false)
    setAudioLevel(0)
  }, [])

  // ─── Toggle ─────────────────────────────────────────────────────────────
  const toggleListening = useCallback(() => {
    // Use ref to avoid stale state in callbacks
    const currentState = listenerRef.current?.isActive ? 'listening' : 'idle'
    if (currentState === 'listening') {
      stopListening()
    } else {
      startListening()
    }
  }, [startListening, stopListening])

  // ─── Speak ──────────────────────────────────────────────────────────────
  const speak = useCallback((text: string, lang?: VoiceLanguage) => {
    synthRef.current?.speak(text, lang)
  }, [])

  const speakBn = useCallback((text: string) => {
    synthRef.current?.speak(text, 'bn')
  }, [])

  // ─── Initialize Services ───────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true

    // Create synthesizer
    synthRef.current = new VoiceSynthesizer({
      language,
      onStateChange: (s) => {
        if (!mountedRef.current) return
        // Don't override if we're in a more important state
        if (s === 'responding' || s === 'completed') {
          setState(s)
        }
      },
      rate: 0.9,
    })

    // Create listener with direct callback to processCommand
    listenerRef.current = new VoiceListener({
      language,
      onTranscript: (text: string, isFinal: boolean) => {
        if (!mountedRef.current) return

        if (isFinal) {
          // Immediately store in ref so VAD/other callbacks can read it
          latestTranscriptRef.current = text
          
          // Update React state
          setTranscript(text)
          setPartialTranscript('')
          setHasDetectedSpeech(true)
          
          // Process the command immediately
          processCommand(text)

        } else {
          // Interim transcript - use for live display
          setPartialTranscript(text)
          
          // If we just started getting words, show speech_detected
          if (text.length > 0) {
            setHasDetectedSpeech(true)
            setState('speech_detected')
          }
        }
      },
      onStateChange: (s: VoiceState) => {
        if (!mountedRef.current) return
        
        // Only apply certain states from listener
        if (s === 'listening') {
          // Don't override if we're already in speech_detected or processing
          if (!hasDetectedSpeech && !isProcessingRef.current) {
            setState('listening')
          }
        } else if (s === 'error') {
          setState('error')
        }
        // Ignore 'idle' from listener - we manage idle ourselves
      },
      onError: (error: string) => {
        console.warn('[Voice]', error)
      },
    })

    return () => {
      mountedRef.current = false
      isProcessingRef.current = true
      listenerRef.current?.destroy()
      synthRef.current?.destroy()
      if (currentAudioStreamRef.current) {
        currentAudioStreamRef.current.getTracks().forEach(t => t.stop())
        currentAudioStreamRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount - services don't need to be recreated

  // Sync language changes without recreating the listener
  useEffect(() => {
    listenerRef.current?.setLanguage(language)
    synthRef.current?.setLanguage(language)
  }, [language])

  return {
    state,
    transcript,
    partialTranscript,
    lastResult,
    isListening: state === 'listening' || state === 'speech_detected',
    isSpeaking: state === 'speaking' || state === 'responding',
    isVoiceEnabled,
    isAiEnabled,
    suggestions,
    audioLevel,
    hasDetectedSpeech,
    startListening,
    stopListening,
    toggleListening,
    speak,
    speakBn,
  }
}
