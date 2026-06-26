'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  Waves,
  X,
} from 'lucide-react'
import { useVoice } from '@/lib/voice'
import { useHaptics } from '@/hooks/useHaptics'
import type { CommandResult } from '@/lib/voice'

const ACTIVE_STATES = new Set(['listening', 'speech_detected', 'processing', 'understanding', 'executing'])

function stateTone(state: string) {
  switch (state) {
    case 'speech_detected':
      return { label: 'Hearing you', short: 'Listening live', color: '#8b5cf6' }
    case 'processing':
    case 'understanding':
      return { label: 'Thinking', short: 'AI parsing command', color: '#f59e0b' }
    case 'executing':
      return { label: 'Working', short: 'Applying command', color: '#10b981' }
    case 'responding':
    case 'speaking':
      return { label: 'Replying', short: 'Speaking back', color: '#06b6d4' }
    case 'completed':
      return { label: 'Done', short: 'Command completed', color: '#10b981' }
    case 'error':
      return { label: 'Needs attention', short: 'Tap and try again', color: '#ef4444' }
    case 'listening':
      return { label: 'Listening', short: 'Say a command', color: '#3b82f6' }
    default:
      return { label: 'Voice', short: 'Tap to command', color: '#111827' }
  }
}

function VoiceWave({ level, state }: { level: number; state: string }) {
  const bars = useMemo(() => Array.from({ length: 18 }), [])
  const active = ACTIVE_STATES.has(state) || state === 'responding' || state === 'speaking'

  return (
    <div className="flex h-16 items-center justify-center gap-[3px]" aria-hidden="true">
      {bars.map((_, index) => {
        const distance = Math.abs(index - (bars.length - 1) / 2)
        const base = Math.max(10, 42 - distance * 3.4)
        const live = active ? Math.max(level, 0.12) : 0.08
        const height = Math.max(8, Math.min(58, base * live + 9 + ((index % 3) * 3)))

        return (
          <motion.span
            key={index}
            className="w-[3px] rounded-full"
            style={{
              background:
                index % 4 === 0
                  ? 'linear-gradient(180deg,#38bdf8,#2563eb)'
                  : index % 3 === 0
                    ? 'linear-gradient(180deg,#a78bfa,#6366f1)'
                    : 'linear-gradient(180deg,#ffffff,#94a3b8)',
              opacity: active ? 0.92 : 0.32,
            }}
            animate={{
              height,
              scaleY: active ? [0.86, 1.08, 0.94] : 1,
            }}
            transition={{
              height: { duration: 0.09, ease: 'easeOut' },
              scaleY: { duration: 0.7 + (index % 4) * 0.08, repeat: active ? Infinity : 0, repeatType: 'mirror' },
            }}
          />
        )
      })}
    </div>
  )
}

function ResultDisplay({ result }: { result: CommandResult }) {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl border px-4 py-3"
      style={{
        background: result.success ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
        borderColor: result.success ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.22)',
      }}
      role="status"
      aria-live="polite"
    >
      {result.success ? (
        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-300" />
      ) : (
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-300" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-5 text-white">{result.message}</p>
        {result.messageBn && <p className="mt-1 text-xs leading-4 text-white/60">{result.messageBn}</p>}
      </div>
    </div>
  )
}

export default function VoiceFloatingButton() {
  const haptics = useHaptics()
  const voice = useVoice()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const previousStateRef = useRef(voice.state)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const previous = previousStateRef.current
    if (previous === voice.state) return

    if (voice.state === 'speech_detected') haptics.impact()
    if (voice.state === 'completed' || voice.state === 'responding') haptics.success()
    if (voice.state === 'error') haptics.warn()

    previousStateRef.current = voice.state
  }, [haptics, voice.state])

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const tone = stateTone(voice.state)
  const visibleTranscript = voice.partialTranscript || voice.transcript
  const isBusy = ACTIVE_STATES.has(voice.state)

  const openAssistant = useCallback(() => {
    haptics.tap()
    setIsOpen(true)
    voice.startListening()
  }, [haptics, voice])

  const closeAssistant = useCallback(() => {
    haptics.tap()
    setIsOpen(false)
    voice.stopListening()
  }, [haptics, voice])

  const toggleListening = useCallback(() => {
    haptics.tap()
    if (isBusy) {
      voice.stopListening()
      return
    }
    voice.startListening()
  }, [haptics, isBusy, voice])

  const runSuggestion = useCallback((text: string) => {
    haptics.impact()
    voice.speak(text)
    window.setTimeout(() => voice.startListening(), 120)
  }, [haptics, voice])

  if (!mounted || !voice.isVoiceEnabled) return null

  return (
    <>
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.72, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileTap={{ scale: 0.94 }}
        onClick={openAssistant}
        className="fixed z-[10020] grid h-[58px] w-[58px] place-items-center overflow-visible rounded-[22px] border border-white/[0.55] bg-white/80 text-slate-950 shadow-[0_18px_50px_rgba(15,23,42,0.20)] backdrop-blur-2xl transition hover:bg-white"
        style={{
          right: 'max(14px, calc(env(safe-area-inset-right, 0px) + 16px))',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 104px)',
          touchAction: 'manipulation',
        }}
        aria-label="Open AI voice command"
      >
        <span className="absolute inset-[3px] rounded-[19px] bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(226,232,240,0.76))]" />
        <span
          className="absolute inset-0 rounded-[22px] opacity-80"
          style={{
            boxShadow: `0 0 0 1px rgba(255,255,255,0.55), 0 0 28px ${tone.color}44`,
          }}
        />
        {(isBusy || voice.state === 'responding') && (
          <motion.span
            className="absolute -inset-1 rounded-[24px] border"
            style={{ borderColor: `${tone.color}55` }}
            animate={{ scale: [1, 1.13, 1], opacity: [0.72, 0, 0.72] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <span className="relative grid h-11 w-11 place-items-center rounded-[17px] bg-slate-950 text-white shadow-inner">
          <Sparkles size={16} className="absolute right-1.5 top-1.5 text-sky-300" />
          <Mic size={21} strokeWidth={2.2} />
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[10030] flex items-end justify-center px-3 pb-3 pt-8 sm:items-center sm:p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/56 backdrop-blur-md"
              onClick={closeAssistant}
              aria-label="Close voice assistant"
            />

            <motion.section
              initial={{ y: 26, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 18, scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 330 }}
              className="relative w-full max-w-[420px] overflow-hidden rounded-[32px] border border-white/[0.12] bg-[#080a10]/[0.92] text-white shadow-[0_28px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="AI voice command"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

              <div className="flex items-center gap-3 px-5 pb-3 pt-5">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] bg-white text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                  {voice.state === 'error' ? <MicOff size={20} /> : <Mic size={21} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-base font-semibold tracking-normal">SelfSync Voice</h2>
                    {voice.isAiEnabled && (
                      <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-2 py-0.5 text-[10px] font-semibold text-sky-200">
                        AI
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-white/[0.52]" aria-live="polite">{tone.short}</p>
                </div>
                <button
                  type="button"
                  onClick={closeAssistant}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white/70 transition hover:bg-white/[0.12] hover:text-white"
                  aria-label="Close voice assistant"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-5 pb-5">
                <div
                  className="rounded-[24px] border border-white/10 bg-white/[0.045] px-4 py-4"
                  style={{ boxShadow: `inset 0 0 0 1px ${tone.color}10` }}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: tone.color, boxShadow: `0 0 16px ${tone.color}` }} />
                      <span className="text-xs font-semibold text-white/72">{tone.label}</span>
                    </div>
                    {(voice.state === 'processing' || voice.state === 'understanding') && (
                      <Loader2 size={15} className="animate-spin text-amber-300" />
                    )}
                    {(voice.state === 'responding' || voice.state === 'speaking') && (
                      <Volume2 size={15} className="text-cyan-200" />
                    )}
                    {voice.state === 'speech_detected' && <Waves size={15} className="text-violet-200" />}
                  </div>

                  <VoiceWave level={voice.audioLevel} state={voice.state} />

                  <div className="min-h-[54px] rounded-2xl bg-black/[0.18] px-4 py-3 text-center">
                    {visibleTranscript ? (
                      <p className="text-sm font-medium leading-5 text-white" aria-live="assertive">
                        &ldquo;{visibleTranscript}&rdquo;
                      </p>
                    ) : (
                      <p className="text-sm leading-5 text-white/45">Tap the mic and speak naturally.</p>
                    )}
                  </div>
                </div>

                {voice.lastResult && (
                  <div className="mt-3">
                    <ResultDisplay result={voice.lastResult} />
                  </div>
                )}

                {!visibleTranscript && !voice.lastResult && voice.state === 'idle' && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {voice.suggestions.slice(0, 3).map((suggestion) => (
                      <button
                        type="button"
                        key={suggestion}
                        onClick={() => runSuggestion(suggestion)}
                        className="shrink-0 rounded-full border border-white/10 bg-white/[0.055] px-3.5 py-2 text-xs font-medium text-white/72 transition hover:bg-white/10 hover:text-white"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={toggleListening}
                    className="grid h-[64px] w-[64px] place-items-center rounded-[24px] border border-white/35 bg-white text-slate-950 shadow-[0_16px_42px_rgba(255,255,255,0.12)] transition active:scale-95"
                    aria-label={isBusy ? 'Stop listening' : 'Start listening'}
                  >
                    {isBusy ? <MicOff size={24} /> : <Mic size={25} />}
                  </button>
                </div>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
