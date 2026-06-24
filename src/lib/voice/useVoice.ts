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
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
  speak: (text: string, language?: VoiceLanguage) => void
  speakBn: (text: string) => void
}

export function useVoice(): VoiceAPI {
  const [state, setState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [partialTranscript, setPartialTranscript] = useState('')
  const [lastResult, setLastResult] = useState<CommandResult | null>(null)
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

  // Use refs to avoid stale closures in callbacks
  const listenerRef = useRef<VoiceListener | null>(null)
  const synthRef = useRef<VoiceSynthesizer | null>(null)
  const mountedRef = useRef(true)
  const stateRef = useRef(state)
  const transcriptRef = useRef(transcript)
  const lastResultRef = useRef(lastResult)
  const routerRef = useRef(useRouter())

  // Keep refs synced
  stateRef.current = state
  transcriptRef.current = transcript
  lastResultRef.current = lastResult

  const isVoiceEnabled = useSettingsStore((s) => s.voiceEnabled)
  const language = useSettingsStore((s) => s.language) as VoiceLanguage

  // Check if Groq is configured
  const [isAiEnabled] = useState(() => {
    const key = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY || ''
    return key.length > 0
  })

  // Stable processVoiceCommand that doesn't change — uses refs
  const processVoiceCommandRef = useRef(async (text: string) => {
    const router = routerRef.current

    // Set processing state
    if (mountedRef.current) {
      setState('understanding')
    }

    try {
      // Process with AI (falls back to keyword parser if Groq unavailable/fails)
      const { result, language: detectedLang } = await processVoiceTranscript(text)

      if (!mountedRef.current) return

      // Set executing state
      setState('executing')

      // Handle navigation actions
      if (result.action === 'navigate' || 
          result.action === 'navigate_tasks' || 
          result.action === 'navigate_dashboard' ||
          result.action === 'navigate_notes' ||
          result.action === 'navigate_calculator') {
        const routeMap: Record<string, string> = {
          'navigate_tasks': '/tasks',
          'navigate_dashboard': '/',
          'navigate_notes': '/notes',
          'navigate_calculator': '/calculator',
          'navigate': '/',
        }
        const route = routeMap[result.action] || '/'
        setTimeout(() => {
          try {
            router.push(route)
          } catch {
            // Silently fail if route doesn't exist
          }
        }, 1000)
      }

      // Store the result
      setLastResult(result)

      // Speak the response
      const msg = detectedLang === 'bn' ? (result.messageBn || result.message) : result.message
      if (synthRef.current) {
        synthRef.current.speak(msg, detectedLang)
      }

      // Set completed state briefly
      setState('completed')
      
      // After 2s, go back to listening
      setTimeout(() => {
        if (mountedRef.current) {
          setState('listening')
          setTranscript('')
          setPartialTranscript('')
        }
      }, 2000)
    } catch (error) {
      console.error('[Voice] Error processing command:', error)
      if (!mountedRef.current) return

      // Fallback to legacy parser
      const parsed = parseIntent(text)
      const result = executeCommand(parsed)

      setLastResult(result)
      setState('executing')

      const msg = parsed.language === 'bn' ? (result.messageBn || result.message) : result.message
      if (synthRef.current) {
        synthRef.current.speak(msg, parsed.language)
      }

      setState('completed')
      
      setTimeout(() => {
        if (mountedRef.current) {
          setState('listening')
          setTranscript('')
          setPartialTranscript('')
        }
      }, 2000)
    }
  })

  // Initialize voice services once on mount
  useEffect(() => {
    mountedRef.current = true

    // Create synthesizer
    synthRef.current = new VoiceSynthesizer({
      language,
      onStateChange: (s) => {
        if (mountedRef.current) setState(s)
      },
      rate: 0.9,
    })

    // Create listener
    listenerRef.current = new VoiceListener({
      language,
      onTranscript: (text, isFinal) => {
        if (!mountedRef.current) return
        if (isFinal) {
          setTranscript(text)
          setPartialTranscript('')
          // Use the ref to call the processor — avoids stale closure issues
          processVoiceCommandRef.current(text)
        } else {
          setPartialTranscript(text)
        }
      },
      onStateChange: (s) => {
        if (mountedRef.current) setState(s)
      },
      onError: (error) => {
        console.warn('[Voice]', error)
      },
    })

    return () => {
      mountedRef.current = false
      listenerRef.current?.destroy()
      synthRef.current?.destroy()
    }
    // Only run on mount — language changes handled by setLanguage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync language changes without recreating the listener
  useEffect(() => {
    listenerRef.current?.setLanguage(language)
    synthRef.current?.setLanguage(language)
  }, [language])

  const startListening = useCallback(async () => {
    if (!isVoiceEnabled) return
    setLastResult(null)
    setTranscript('')
    setPartialTranscript('')
    
    // Request permission first, then start
    if (listenerRef.current) {
      const hasPermission = await listenerRef.current.requestPermission()
      if (hasPermission) {
        listenerRef.current.start()
      } else {
        setState('error')
      }
    }
  }, [isVoiceEnabled])

  const stopListening = useCallback(() => {
    listenerRef.current?.stop()
    setState('idle')
  }, [])

  const toggleListening = useCallback(() => {
    if (stateRef.current === 'listening') {
      stopListening()
    } else {
      startListening()
    }
  }, [startListening, stopListening])

  const speak = useCallback((text: string, lang?: VoiceLanguage) => {
    synthRef.current?.speak(text, lang)
  }, [])

  const speakBn = useCallback((text: string) => {
    synthRef.current?.speak(text, 'bn')
  }, [])

  return {
    state,
    transcript,
    partialTranscript,
    lastResult,
    isListening: state === 'listening',
    isSpeaking: state === 'speaking',
    isVoiceEnabled,
    isAiEnabled,
    suggestions,
    startListening,
    stopListening,
    toggleListening,
    speak,
    speakBn,
  }
}