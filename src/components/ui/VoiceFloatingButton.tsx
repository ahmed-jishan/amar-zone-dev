'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, X, Sparkles, ChevronRight, CheckCircle2, AlertCircle, Loader2, Brain, Cpu, Zap } from 'lucide-react'
import { useVoice } from '@/lib/voice'
import { useHaptics } from '@/hooks/useHaptics'
import type { CommandResult } from '@/lib/voice'

// ─── Premium Animated Waveform — bars that WAVE visibly when listening ────
// Each bar gets randomized heights for a natural "spoken word" look.
// When idle/processing, bars are short and low-opacity.

function Waveform({ state }: { state: string }) {
  const isActive = state === 'listening'
  const isProcessing = state === 'processing'
  const isUnderstanding = state === 'understanding'
  const isExecuting = state === 'executing'
  const isSpeaking = state === 'speaking'
  const isCompleted = state === 'completed'

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
    understanding: {
      height: [14, 20, 16, 22, 14, 18],
      opacity: 0.5,
      transition: {
        height: {
          duration: 0.6,
          repeat: Infinity,
          repeatType: 'reverse' as const,
        },
      },
    },
    executing: {
      height: [18, 24, 20, 26, 18, 22],
      opacity: 0.7,
      transition: {
        height: {
          duration: 0.4,
          repeat: Infinity,
          repeatType: 'reverse' as const,
        },
      },
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
    completed: {
      height: [20, 8, 20, 8, 20, 8],
      opacity: [0.8, 0.3, 0.8, 0.3, 0.8, 0.3],
      transition: {
        height: { duration: 0.3, repeat: 2 },
        opacity: { duration: 0.3, repeat: 2 },
      },
    },
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
        } else if (isUnderstanding) {
          animate = barVariants.understanding
        } else if (isExecuting) {
          animate = barVariants.executing
        } else if (isProcessing) {
          animate = barVariants.processing
        } else if (isSpeaking) {
          animate = barVariants.speaking(i)
        } else if (isCompleted) {
          animate = barVariants.completed
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

// ─── State Icon ────────────────────────────────────────────────────────────
function StateIcon({ state }: { state: string }) {
  switch (state) {
    case 'listening':
      return <Mic size={18} className="text-indigo-400" />
    case 'understanding':
      return <Brain size={18} className="text-amber-400" />
    case 'executing':
      return <Cpu size={18} className="text-emerald-400" />
    case 'processing':
      return <Loader2 size={18} className="text-amber-400 animate-spin" />
    case 'speaking':
      return <Zap size={18} className="text-emerald-400" />
    case 'completed':
      return <CheckCircle2 size={18} className="text-emerald-400" />
    case 'error':
      return <AlertCircle size={18} className="text-red-400" />
    default:
      return <Sparkles size={18} className="text-indigo-400" />
  }
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function VoiceFloatingButton() {
  const haptics = useHaptics()
  const voice = useVoice()
  const [isOpen, setIsOpen] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleOpen = useCallback(() => {
    haptics.tap()
    setIsOpen(true)
    voice.startListening()
  }, [haptics, voice])

  const handleClose = useCallback(() => {
    haptics.tap()
    setIsOpen(false)
    voice.stopListening()
  }, [haptics, voice])

  const handleSuggestionClick = useCallback((text: string) => {
    haptics.impact()
    voice.speak(text)
    setTimeout(() => {
      voice.startListening()
    }, 100)
  }, [haptics, voice])

  // Get state-specific color
  const getStateColor = () => {
    switch (voice.state) {
      case 'listening': return '#6366f1'
      case 'understanding': return '#f59e0b'
      case 'executing': return '#10b981'
      case 'processing': return '#f59e0b'
      case 'speaking': return '#10b981'
      case 'completed': return '#10b981'
      case 'error': return '#ef4444'
      default: return '#6366f1'
    }
  }

  const getStateText = () => {
    switch (voice.state) {
      case 'listening': return 'Listening...'
      case 'understanding': return 'Understanding command...'
      case 'executing': return 'Executing...'
      case 'processing': return 'Processing...'
      case 'speaking': return 'Speaking...'
      case 'completed': return 'Completed'
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

      {/* Premium Centered Floating Voice Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ overflow: 'hidden' }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Modal — centered floating popup */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm mx-auto rounded-3xl
                         bg-gradient-to-b from-slate-900/95 to-slate-950/95
                         border border-white/10 backdrop-blur-2xl
                         shadow-[0_20px_60px_rgba(0,0,0,0.5)]
                         overflow-hidden"
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full 
                           bg-white/10 hover:bg-white/20 flex items-center justify-center
                           transition-colors z-10"
              >
                <X size={16} className="text-white/60" />
              </button>

              <div className="p-6 pt-8">
                {/* Header with state icon */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: `${getStateColor()}20` }}
                  >
                    <StateIcon state={voice.state} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">SelfSync Voice</h3>
                    <p className="text-[11px] text-white/50">{getStateText()}</p>
                  </div>
                  {voice.isAiEnabled && (
                    <div className="ml-auto px-2 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30">
                      <span className="text-[9px] font-medium text-indigo-300">AI</span>
                    </div>
                  )}
                </div>

                {/* Waveform — actively animates when listening */}
                <div className="flex justify-center mb-4">
                  <Waveform state={voice.state} />
                </div>

                {/* Processing spinner for understanding/executing */}
                {(voice.state === 'understanding' || voice.state === 'executing') && (
                  <div className="flex justify-center mb-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5"
                    >
                      {voice.state === 'understanding' ? (
                        <>
                          <Brain size={14} className="text-amber-400" />
                          <span className="text-[10px] text-amber-300/80 font-medium">AI is thinking...</span>
                        </>
                      ) : (
                        <>
                          <Cpu size={14} className="text-emerald-400" />
                          <span className="text-[10px] text-emerald-300/80 font-medium">Applying changes...</span>
                        </>
                      )}
                    </motion.div>
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