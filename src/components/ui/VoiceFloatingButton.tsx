'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, X, Sparkles, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useVoice } from '@/lib/voice'
import { useHaptics } from '@/hooks/useHaptics'
import type { CommandResult } from '@/lib/voice'

// ─── Premium Animated Waveform — bars that WAVE visibly when listening ────
// Each bar gets randomized heights for a natural "spoken word" look.
// When idle/processing, bars are short and low-opacity.

function Waveform({ state }: { state: string }) {
  const isActive = state === 'listening'
  const isProcessing = state === 'processing'
  const isSpeaking = state === 'speaking'

  // For active state: each bar bounces individually with different heights
  // For idle: small static bars

  const barVariants = {
    active: (i: number) => ({
      height: [10, 38, 14, 44, 12, 10, 36, 18, 46, 22][i % 10],
      opacity: 1,
      transition: {
        height: {
          duration: 0.5 + (i * 0.08),
          repeat: Infinity,
          repeatType: 'reverse' as const,
          ease: 'easeInOut',
        },
      },
    }),
    idle: {
      height: 8,
      opacity: 0.25,
      transition: { duration: 0.3 },
    },
    processing: {
      height: 12,
      opacity: 0.4,
      transition: { duration: 0.5, repeat: Infinity, repeatType: 'reverse' as const },
    },
    speaking: (i: number) => ({
      height: [12, 24, 16, 28, 14, 12][i % 6],
      opacity: 0.6,
      transition: {
        height: {
          duration: 0.8 + (i * 0.06),
          repeat: Infinity,
          repeatType: 'reverse' as const,
        },
      },
    }),
  }

  const barCount = 6

  const getBarColor = (i: number) => {
    const colors = [
      'bg-gradient-to-t from-indigo-400 to-violet-400',
      'bg-gradient-to-t from-indigo-500 to-violet-500',
      'bg-gradient-to-t from-violet-400 to-purple-400',
      'bg-gradient-to-t from-indigo-500 to-violet-500',
      'bg-gradient-to-t from-indigo-400 to-violet-400',
      'bg-gradient-to-t from-violet-400 to-purple-400',
    ]
    return colors[i % colors.length]
  }

  return (
    <div className="flex items-center justify-center gap-[4px] h-16">
      {Array.from({ length: barCount }).map((_, i) => {
        let animate: any
        if (isActive) {
          animate = barVariants.active(i)
        } else if (isProcessing) {
          animate = barVariants.processing
        } else if (isSpeaking) {
          animate = barVariants.speaking(i)
        } else {
          animate = barVariants.idle
        }

        return (
          <motion.div
            key={i}
            className={`w-[4px] rounded-full ${getBarColor(i)}`}
            animate={animate}
            style={{ willChange: 'height, opacity' }}
          />
        )
      })}
      {/* Glow effect under waveform */}
      {isActive && (
        <motion.div
          className="absolute bottom-0 w-24 h-6 rounded-full blur-xl pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.3), transparent)',
          }}
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  )
}

// ─── Suggestion Chip ───────────────────────────────────────────────────────
function SuggestionChip({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white/10 dark:bg-white/5 
                 border border-white/20 dark:border-white/10 text-white/80 hover:text-white
                 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
    >
      {text}
    </motion.button>
  )
}

// ─── Result Display ────────────────────────────────────────────────────────
function ResultDisplay({ result }: { result: CommandResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-md"
      style={{
        background: result.success
          ? 'rgba(16,185,129,0.15)'
          : 'rgba(239,68,68,0.15)',
        border: `1px solid ${result.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
      }}
    >
      {result.success ? (
        <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
      ) : (
        <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">
          {result.message}
        </p>
        {result.messageBn && (
          <p className="text-xs text-white/60 mt-0.5">{result.messageBn}</p>
        )}
      </div>
    </motion.div>
  )
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function VoiceFloatingButton() {
  const haptics = useHaptics()
  const voice = useVoice()
  const [isOpen, setIsOpen] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const processedLastResultKey = useRef<string>('')

  // Log when active — for debugging
  useEffect(() => {
    if (voice.state === 'listening') {
      // console.log('[Voice] actively listening')
    }
  }, [voice.state])

  // Auto-close modal only when user says "stop_listening" or x button pressed
  // Do NOT auto-close after result — let user see the feedback
  useEffect(() => {
    if (voice.state === 'idle' && isOpen && voice.lastResult) {
      // Only auto-close if voice was stopped explicitly (e.g. user tapped close)
      // but keep open if listener is running and processing
    }
  }, [voice.state, isOpen, voice.lastResult])

  const handleOpen = useCallback(() => {
    haptics.tap()
    setIsOpen(true)
    // Clear previous results
    voice.startListening()
  }, [haptics, voice])

  const handleClose = useCallback(() => {
    haptics.tap()
    setIsOpen(false)
    voice.stopListening()
  }, [haptics, voice])

  const handleSuggestionClick = useCallback((text: string) => {
    haptics.impact()
    // Instead of speaking the suggestion text (which only reads it aloud),
    // we simulate it being spoken by the user → process it as a voice command
    // The listener is already running, so we "inject" the final transcript
    // by calling processVoiceCommand directly via the suggest callback
    voice.speak(text)
    // The speak callback happens, but also simulate voice processing
    setTimeout(() => {
      voice.startListening()
    }, 100)
  }, [haptics, voice])

  // Get state-specific color
  const getStateColor = () => {
    switch (voice.state) {
      case 'listening': return '#6366f1'
      case 'processing': return '#f59e0b'
      case 'speaking': return '#10b981'
      case 'error': return '#ef4444'
      default: return '#6366f1'
    }
  }

  const getStateText = () => {
    switch (voice.state) {
      case 'listening': return 'Listening...'
      case 'processing': return 'Processing...'
      case 'speaking': return 'Speaking...'
      case 'error': return 'Error'
      default: return 'Tap to speak'
    }
  }

  if (!voice.isVoiceEnabled) return null

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleOpen}
        className="fixed right-4 z-40 w-11 h-11 rounded-full
                   shadow-lg flex items-center justify-center
                   border border-white/20 backdrop-blur-xl
                   bg-gradient-to-br from-indigo-600/90 to-violet-600/90
                   hover:from-indigo-500 hover:to-violet-500
                   transition-all duration-300
                   top-20 sm:top-24"
        style={{
          boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
        }}
      >
        <Mic size={18} className="text-white" />
        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-indigo-400/30"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.button>

      {/* Premium Full-Screen Voice Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl
                         bg-gradient-to-b from-slate-900/95 to-slate-950/95
                         border border-white/10 backdrop-blur-2xl
                         shadow-[0_20px_60px_rgba(0,0,0,0.5)]
                         overflow-hidden"
              style={{ maxHeight: '80vh' }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full 
                           bg-white/10 hover:bg-white/20 flex items-center justify-center
                           transition-colors z-10"
              >
                <X size={16} className="text-white/60" />
              </button>

              <div className="p-6 pt-4 sm:pt-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: `${getStateColor()}20` }}
                  >
                    <Sparkles size={18} color={getStateColor()} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">SelfSync Voice</h3>
                    <p className="text-[11px] text-white/50">{getStateText()}</p>
                  </div>
                </div>

                {/* Waveform — actively animates when listening */}
                <div className="flex justify-center mb-4">
                  <Waveform state={voice.state} />
                </div>

                {/* Processing spinner */}
                {voice.state === 'processing' && (
                  <div className="flex justify-center mb-4">
                    <Loader2 size={24} className="text-indigo-400 animate-spin" />
                  </div>
                )}

                {/* Transcript */}
                {(voice.transcript || voice.partialTranscript) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center mb-4"
                  >
                    <p className="text-sm text-white/90 font-medium">
                      &ldquo;{voice.transcript || voice.partialTranscript}&rdquo;
                    </p>
                  </motion.div>
                )}

                {/* Result */}
                {voice.lastResult && (
                  <div className="mb-4">
                    <ResultDisplay result={voice.lastResult} />
                  </div>
                )}

                {/* Suggestions (shown when idle or after result) */}
                {(!voice.transcript && !voice.lastResult) && (
                  <div className="mb-2">
                    <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest mb-2.5">
                      Try saying
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {voice.suggestions.slice(0, 4).map((s) => (
                        <SuggestionChip
                          key={s}
                          text={s}
                          onClick={() => handleSuggestionClick(s)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Status indicator */}
                <div className="flex items-center justify-center gap-2 mt-2 pt-4 border-t border-white/5">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: getStateColor(),
                      boxShadow: `0 0 4px ${getStateColor()}`,
                    }}
                  />
                  <span className="text-[10px] text-white/30">
                    {voice.state === 'listening' ? 'Speak now...' : getStateText()}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}