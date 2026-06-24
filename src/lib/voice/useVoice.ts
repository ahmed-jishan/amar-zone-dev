'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { VoiceListener } from './listener'
import { VoiceSynthesizer } from './synthesizer'
import { parseIntent } from './intent-parser'
import { executeCommand } from './command-registry'
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
    "Log Fajr as prayed",
    "Add 500 taka expense for lunch",
    "Add task called buy groceries",
    "Set Dhuhr jamat at 4:00 PM",
    "What's my prayer streak?",
    "Go to money",
  ])

  const listenerRef = useRef<VoiceListener | null>(null)
  const synthRef = useRef<VoiceSynthesizer | null>(null)
  const mountedRef = useRef(true)
  const router = useRouter()

  const isVoiceEnabled = useSettingsStore((s) => s.voiceEnabled)
  const language = useSettingsStore((s) => s.language) as VoiceLanguage

  // Process a final voice command
  // IMPORTANT: Does NOT stop the listener — the listener keeps running in the background.
  // The UI state briefly shows "processing" then goes back to "listening" (not "idle").
  const processVoiceCommand = useCallback((text: string) => {
    setState('processing')

    const parsed = parseIntent(text)

    if (parsed.confidence < 0.5 && parsed.intent !== 'help') {
      const result: CommandResult = {
        success: false,
        message: "I didn't quite catch that. Could you try again?",
        messageBn: 'আমি ঠিক বুঝতে পারিনি। আবার বলবেন?',
        error: 'low_confidence',
      }
      setLastResult(result)
      const msg = parsed.language === 'bn' ? result.messageBn! : result.message
      synthRef.current?.speak(msg, parsed.language)
      // Return to listening state — user can speak again immediately
      setTimeout(() => { if (mountedRef.current) setState('listening') }, 1500)
      return
    }

    const result = executeCommand(parsed)

    if (result.action === 'navigate' && parsed.entities.target) {
      const route = `/${parsed.entities.target}`
      setTimeout(() => router.push(route), 500)
    }

    setLastResult(result)

    const msg = parsed.language === 'bn' ? (result.messageBn || result.message) : result.message
    synthRef.current?.speak(msg, parsed.language)

    // Return to listening after speaking — listener is still alive
    setTimeout(() => {
      if (mountedRef.current) {
        setState('listening')
        setTranscript('')
      }
    }, 2000)
  }, [router])

  // Initialize on mount
  useEffect(() => {
    mountedRef.current = true

    synthRef.current = new VoiceSynthesizer({
      language,
      onStateChange: (s) => {
        if (mountedRef.current) setState(s)
      },
      rate: 0.9,
    })

    listenerRef.current = new VoiceListener({
      language,
      onTranscript: (text, isFinal) => {
        if (!mountedRef.current) return
        if (isFinal) {
          setTranscript(text)
          setPartialTranscript('')
          processVoiceCommand(text)
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

    if (isVoiceEnabled) {
      listenerRef.current.preWarm()
    }

    return () => {
      mountedRef.current = false
      listenerRef.current?.destroy()
      synthRef.current?.destroy()
    }
  }, [language, isVoiceEnabled, processVoiceCommand])

  const startListening = useCallback(() => {
    if (!isVoiceEnabled) return
    setLastResult(null)
    setTranscript('')
    setPartialTranscript('')
    listenerRef.current?.start()
  }, [isVoiceEnabled])

  const stopListening = useCallback(() => {
    listenerRef.current?.stop()
    setState('idle')
  }, [])

  const toggleListening = useCallback(() => {
    if (state === 'listening') {
      stopListening()
    } else {
      startListening()
    }
  }, [state, startListening, stopListening])

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
    suggestions,
    startListening,
    stopListening,
    toggleListening,
    speak,
    speakBn,
  }
}