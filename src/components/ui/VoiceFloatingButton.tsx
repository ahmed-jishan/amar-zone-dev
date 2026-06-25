'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, X, Sparkles, ChevronRight, CheckCircle2, AlertCircle, Loader2, Brain, Cpu, Zap, Waves, Volume2 } from 'lucide-react'
import { useVoice } from '@/lib/voice'
import { useHaptics } from '@/hooks/useHaptics'
import type { CommandResult } from '@/lib/voice'

// ─── Premium Real-Time Waveform ─────────────────────────────────────────
// Uses actual audioLevel from VAD for responsive bars.
// Falls back to animated bars when no mic data available.

function Waveform({ state, audioLevel }: { state: string; audioLevel: number }) {
  const isActive = state === 'listening'
  const isSpeechDetected = state === 'speech_detected'
  const isProcessing = state === 'processing'
  const isUnderstanding = state === 'understanding'
  const isExecuting = state === 'executing'
  const isResponding = state === 'responding'
  const isSpeaking = state === 'speaking'
  const isCompleted = state === 'completed'

  const barCount = 7
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Generate bar heights based on audio level for real responsiveness
  const getBarHeights = useCallback(() => {
    if (!isActive && !isSpeechDetected) return Array(barCount).fill(4)
    
    // When speech detected, use audioLevel to create realistic waveform
    const baseHeight = isSpeechDetected ? 12 + audioLevel * 30 : 8 + audioLevel * 20
    const heights = []
    for (let i = 0; i < barCount; i++) {
      const variation = Math.sin((i / barCount) * Math.PI * 2 + Date.now() * 0.003) * audioLevel * 20
      heights.push(Math.max(3, baseHeight + variation))
    }
    return heights
  }, [isActive, isSpeechDetected, audioLevel])

  const barVariants = {
    active: (i: number) => ({
      height: prefersReducedMotion ? 20 : getBarHeights()[i],
      opacity: 0.8 + audioLevel * 0.2,
      transition: prefersReducedMotion ? {} : {
        height: {
          duration: 0.15,
          ease: 'easeOut',
        },
        opacity: {
          duration: 0.1,
        },
      },
    }),
    speechDetected: (i: number) => ({
      height: prefersReducedMotion ? 28 : getBarHeights()[i],
      opacity: 0.9 + audioLevel * 0.1,
      transition: prefersReducedMotion ? {} : {
        height: {
          duration: 0.1,
          ease: 'easeOut',
        },
      },
    }),
    idle: {
      height: prefersReducedMotion ? 8 : [8, 10, 8, 12, 8, 10, 8],
      opacity: 0.25,
      transition: prefersReducedMotion ? {} : {
        height: {
          duration: 2,
          repeat: Infinity,
          repeatType: 'reverse' as const,
          ease: 'easeInOut',
        },
      },
    },
    processing: {
      height: prefersReducedMotion ? 12 : [12, 16, 12, 18, 12, 16, 12],
      opacity: 0.4,
      transition: prefersReducedMotion ? {} : {
        height: {
          duration: 0.6,
          repeat: Infinity,
          repeatType: 'reverse' as const,
        },
      },
    },
    understanding: {
      height: prefersReducedMotion ? 16 : [14, 20, 16, 22, 14, 18, 16],
      opacity: 0.5,
      transition: prefersReducedMotion ? {} : {
        height: {
          duration: 0.5,
          repeat: Infinity,
          repeatType: 'reverse' as const,
        },
      },
    },
    executing: {
      height: prefersReducedMotion ? 20 : [18, 24, 20, 26, 18, 22, 20],
      opacity: 0.7,
      transition: prefersReducedMotion ? {} : {
        height: {
          duration: 0.4,
          repeat: Infinity,
          repeatType: 'reverse' as const,
        },
      },
    },
    responding: {
      height: prefersReducedMotion ? 22 : [20, 28, 22, 30, 20, 26, 22],
      opacity: 0.8,
      transition: prefersReducedMotion ? {} : {
        height: {
          duration: 0.7,
          repeat: Infinity,
          repeatType: 'reverse' as const,
        },
      },
    },
    completed: {
      height: prefersReducedMotion ? 10 : [20, 8, 20, 8, 20, 8, 20],
      opacity: [0.8, 0.3, 0.8, 0.3, 0.8, 0.3, 0.8],
      transition: prefersReducedMotion ? {} : {
        height: { duration: 0.3, repeat: 2 },
        opacity: { duration: 0.3, repeat: 2 },
      },
    },
  }

  const getBarColor = (i: number) => {
    const colors = [
      'bg-gradient-to-t from-indigo-400 to-violet-400',
      'bg-gradient-to-t from-indigo-500 to-violet-500',
      'bg-gradient-to-t from-violet-400 to-purple-400',
      'bg-gradient-to-t from-indigo-500 to-violet-500',
      'bg-gradient-to-t from-indigo-400 to-violet-400',
      'bg-gradient-to-t from-violet-400 to-purple-400',
      'bg-gradient-to-t from-indigo-500 to-violet-500',
    ]
    return colors[i % colors.length]
  }

  const getWaveformContent = () => {
    return (
      <div className="flex items-center justify-center gap-[3px] h-16 relative">
        {Array.from({ length: barCount }).map((_, i) => {
          let animate: any
          if (isSpeechDetected) {
            animate = barVariants.speechDetected(i)
          } else if (isActive) {
            animate = barVariants.active(i)
          } else if (isUnderstanding) {
            animate = barVariants.understanding
          } else if (isExecuting) {
            animate = barVariants.executing
          } else if (isProcessing) {
            animate = barVariants.processing
          } else if (isResponding || isSpeaking) {
            animate = barVariants.responding
          } else if (isCompleted) {
            animate = barVariants.completed
          } else {
            animate = barVariants.idle
          }

          return (
            <motion.div
              key={i}
              className={`w-[3px] rounded-full ${getBarColor(i)}`}
              animate={animate}
              style={{ willChange: 'height, opacity' }}
            />
          )
        })}

        {/* Glow effect under waveform */}
        {(isActive || isSpeechDetected) && (
          <motion.div
            className="absolute bottom-0 w-28 h-8 rounded-full blur-xl pointer-events-none"
            style={{
              background: `radial-gradient(ellipse, rgba(99,102,241,${0.2 + audioLevel * 0.3}), transparent)`,
            }}
            animate={prefersReducedMotion ? {} : { 
              opacity: [0.3, 0.6, 0.3], 
              scale: [1, 1.1, 1] 
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>
    )
  }

  return getWaveformContent()
}

// ─── AI Thinking Animation (Orbital) ─────────────────────────────────────
// Three orbiting dots around a central glow (like ChatGPT Voice)

function ThinkingAnimation() {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  if (prefersReducedMotion) {
    return (
      <div className="flex items-center justify-center gap-2 h-16">
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-16">
      <div className="relative w-16 h-16">
        {/* Central glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.3), transparent)',
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Orbiting dots */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: i === 0 ? '#6366f1' : i === 1 ? '#8b5cf6' : '#a78bfa',
              top: '50%',
              left: '50%',
              marginLeft: -4,
              marginTop: -4,
            }}
            animate={{
              x: [0, 24 * Math.cos((i * 2 * Math.PI) / 3), 0],
              y: [0, 24 * Math.sin((i * 2 * Math.PI) / 3), 0],
              opacity: [0.7, 1, 0.7],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Breathing Animation for Idle ────────────────────────────────────────
// Subtle pulse on the waveform area when idle

function BreathingIdle() {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  if (prefersReducedMotion) return null

  return (
    <motion.div
      className="absolute inset-0 rounded-full pointer-events-none"
      style={{
        background: 'radial-gradient(circle at center, rgba(99,102,241,0.08), transparent 70%)',
      }}
      animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    />
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
      aria-label={`Try saying: ${text}`}
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
      role="status"
      aria-live="polite"
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
    case 'speech_detected':
      return <Waves size={18} className="text-violet-400" />
    case 'processing':
      return <Loader2 size={18} className="text-amber-400 animate-spin" />
    case 'understanding':
      return <Brain size={18} className="text-amber-400" />
    case 'executing':
      return <Cpu size={18} className="text-emerald-400" />
    case 'responding':
      return <Volume2 size={18} className="text-emerald-400" />
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
  const [mounted, setMounted] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [buttonOffset, setButtonOffset] = useState({ x: 0, y: 0 })

  // Hydration guard — prevents SSR/CSR mismatch by suppressing render until client mount.
  useEffect(() => {
    const getIsMobile = () => window.matchMedia('(max-width: 640px)').matches
    const syncViewport = () => {
      const nextIsMobile = getIsMobile()
      setIsMobileViewport(nextIsMobile)
      if (nextIsMobile) {
        setButtonOffset({ x: 0, y: 0 })
      }
    }

    setMounted(true)
    syncViewport()

    // Restore saved drag offset from localStorage on desktop only.
    try {
      const saved = window.localStorage.getItem('selfsync-voice-button-offset')
      if (saved && !getIsMobile()) {
        const parsed = JSON.parse(saved) as { x?: number; y?: number }
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setButtonOffset({
            x: Math.max(-260, Math.min(24, parsed.x)),
            y: Math.max(-80, Math.min(20, parsed.y)),
          })
        }
      }
    } catch { /* noop */ }

    window.addEventListener('resize', syncViewport)
    window.addEventListener('orientationchange', syncViewport)
    return () => {
      window.removeEventListener('resize', syncViewport)
      window.removeEventListener('orientationchange', syncViewport)
    }
  }, [])
  const prevStateRef = useRef(voice.state)
  const lastHapticTimeRef = useRef(0)

  // Haptic feedback on state transitions (throttled)
  useEffect(() => {
    const now = Date.now()
    const prevState = prevStateRef.current
    if (prevState === voice.state) return

    // Throttle haptics to avoid rapid-fire
    if (now - lastHapticTimeRef.current < 500) {
      prevStateRef.current = voice.state
      return
    }

    switch (voice.state) {
      case 'speech_detected':
        if (prevState === 'listening') {
          haptics.impact() // Medium: speech detected
          lastHapticTimeRef.current = now
        }
        break
      case 'responding':
      case 'completed':
        haptics.success() // Gentle: response ready
        lastHapticTimeRef.current = now
        break
      case 'error':
        haptics.warn() // Soft: error
        lastHapticTimeRef.current = now
        break
    }
    prevStateRef.current = voice.state
  }, [voice.state, haptics])

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
      case 'speech_detected': return '#8b5cf6'
      case 'processing': return '#f59e0b'
      case 'understanding': return '#f59e0b'
      case 'executing': return '#10b981'
      case 'responding': return '#10b981'
      case 'speaking': return '#10b981'
      case 'completed': return '#10b981'
      case 'error': return '#ef4444'
      default: return '#6366f1'
    }
  }

  const getStateText = () => {
    switch (voice.state) {
      case 'listening': return 'Listening...'
      case 'speech_detected': return 'Speaking...'
      case 'processing': return 'Processing...'
      case 'understanding': return 'AI is thinking...'
      case 'executing': return 'Applying changes...'
      case 'responding': return 'Speaking...'
      case 'speaking': return 'Speaking...'
      case 'completed': return 'Completed'
      case 'error': return 'Error'
      default: return 'Tap to speak'
    }
  }

  const getStatusText = () => {
    switch (voice.state) {
      case 'listening': return 'Speak now...'
      case 'speech_detected': return 'Listening...'
      case 'processing': return 'Just a moment...'
      case 'understanding': return 'Thinking...'
      case 'executing': return 'Working...'
      case 'responding': return 'Speaking...'
      case 'completed': return 'Done'
      case 'error': return 'Something went wrong'
      default: return 'Ask anything...'
    }
  }

  // ─── SSR HYDRATION GUARD ──────────────────────────────────────────────
  // Always render null during SSR to prevent hydration mismatch.
  // The button only renders after client mount + hydration is complete.
  // Once mounted, the voice floating icon is ALWAYS visible — no toggle needed.
  if (!mounted) return null
  if (!voice.isVoiceEnabled) return null

  return (
    <>
      {/* Floating Button — top-right, below notification icon */}
      <motion.button
        key="voice-floating-btn"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, x: buttonOffset.x, y: buttonOffset.y }}
        drag
        dragMomentum={false}
        dragElastic={0.08}
        onDragEnd={(_, info) => {
          if (isMobileViewport) {
            setButtonOffset({ x: 0, y: 0 })
            try {
              window.localStorage.removeItem('selfsync-voice-button-offset')
            } catch { /* noop */ }
            return
          }

          const next = {
            x: Math.max(-260, Math.min(24, buttonOffset.x + info.offset.x)),
            y: Math.max(-80, Math.min(20, buttonOffset.y + info.offset.y)),
          }
          setButtonOffset(next)
          try {
            window.localStorage.setItem('selfsync-voice-button-offset', JSON.stringify(next))
          } catch { /* noop */ }
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleOpen}
        className="fixed z-[10020] w-12 h-12 rounded-full
                   shadow-lg flex items-center justify-center
                   border border-white/20 backdrop-blur-xl
                   bg-gradient-to-br from-indigo-600/90 to-violet-600/90
                   hover:from-indigo-500 hover:to-violet-500
                   transition-all duration-300"
        style={{
          // TOP-RIGHT: Below notification bell icon (fixed right-4 top-4, 48px)
          // Notification is at top-4 (16px), 48px tall, so this goes at top-[72px] with 8px gap
          top: isMobileViewport
            ? 'auto'
            : 'max(8px, calc(env(safe-area-inset-top, 0px) + 16px + 48px + 8px))',
          bottom: isMobileViewport
            ? 'calc(env(safe-area-inset-bottom, 0px) + 104px)'
            : 'auto',
          right: 'max(8px, calc(env(safe-area-inset-right, 0px) + 16px))',
          boxShadow: '0 8px 28px rgba(99,102,241,0.32)',
          touchAction: 'none',
        }}
        aria-label="Open voice assistant"
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
              role="dialog"
              aria-label="Voice Assistant"
              aria-modal="true"
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full 
                           bg-white/10 hover:bg-white/20 flex items-center justify-center
                           transition-colors z-10"
                aria-label="Close voice assistant"
              >
                <X size={16} className="text-white/60" />
              </button>

              <div className="p-6 pt-8">
                {/* Header with state icon */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center relative"
                    style={{ background: `${getStateColor()}20` }}
                  >
                    <StateIcon state={voice.state} />
                    {/* Breathing animation when idle */}
                    {voice.state === 'idle' && <BreathingIdle />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">SelfSync Voice</h3>
                    <p className="text-[11px] text-white/50" aria-live="polite">
                      {getStateText()}
                    </p>
                  </div>
                  {voice.isAiEnabled && (
                    <div className="ml-auto px-2 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30">
                      <span className="text-[9px] font-medium text-indigo-300">AI</span>
                    </div>
                  )}
                </div>

                {/* Waveform — actively animates to audio levels */}
                <div className="flex justify-center mb-4">
                  <Waveform state={voice.state} audioLevel={voice.audioLevel} />
                </div>

                {/* AI Thinking Animation for understanding/processing */}
                {(voice.state === 'understanding' || voice.state === 'processing') && (
                  <div className="flex justify-center mb-4">
                    <ThinkingAnimation />
                  </div>
                )}

                {/* Speech detected indicator */}
                {voice.state === 'speech_detected' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center mb-4"
                  >
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20">
                      <Waves size={14} className="text-violet-400" />
                      <span className="text-[10px] text-violet-300/80 font-medium">Voice detected</span>
                    </div>
                  </motion.div>
                )}

                {/* Processing state */}
                {voice.state === 'processing' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center mb-4"
                  >
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                      <Loader2 size={14} className="text-amber-400 animate-spin" />
                      <span className="text-[10px] text-amber-300/80 font-medium">Processing your request...</span>
                    </div>
                  </motion.div>
                )}

                {/* Responding indicator */}
                {voice.state === 'responding' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center mb-4"
                  >
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <Volume2 size={14} className="text-emerald-400" />
                      <span className="text-[10px] text-emerald-300/80 font-medium">Speaking...</span>
                    </div>
                  </motion.div>
                )}

                {/* Processing spinner for executing */}
                {voice.state === 'executing' && (
                  <div className="flex justify-center mb-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5"
                    >
                      <Cpu size={14} className="text-emerald-400" />
                      <span className="text-[10px] text-emerald-300/80 font-medium">Applying changes...</span>
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
                    <p className="text-sm text-white/90 font-medium" aria-live="assertive">
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
                {(!voice.transcript && !voice.lastResult && voice.state === 'idle') && (
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
                    {getStatusText()}
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
