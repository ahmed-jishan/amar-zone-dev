'use client'

import { useEffect, useState, useCallback } from 'react'
import { quranPlayer, type QuranPlaybackState } from '../services/quranPlayerService'
import { addQuranMediaActionListener, hideQuranMediaNotification, updateQuranMediaNotification } from '@/lib/native/quranMedia'
import { SURAHS } from '../data/surahs'

export function useQuranPlayer() {
  const [state, setState] = useState<QuranPlaybackState>(quranPlayer.getState())

  useEffect(() => {
    const unsub = quranPlayer.subscribe((newState) => {
      setState(newState)
      // Update native notification
      const surah = newState.surahNumber ? SURAHS.find((s) => s.number === newState.surahNumber) : null
      if (surah && newState.ayahNumber) {
        void updateQuranMediaNotification({
          title: `Surah ${surah.transliteration}`,
          subtitle: `Ayah ${newState.ayahNumber}`,
          playing: newState.isPlaying,
        }).catch(() => undefined)
      } else if (!newState.isPlaying) {
        void hideQuranMediaNotification().catch(() => undefined)
      }
    })
    return unsub
  }, [])

  // Listen for native media actions from Android
  useEffect(() => {
    let disposed = false
    let nativeHandle: { remove: () => Promise<void> } | undefined
    const handleMediaAction = ({ action, playing }: { action: string; playing?: boolean }) => {
      switch (action) {
        case 'playPause':
          if (playing) {
            quranPlayer.resume()
          } else {
            quranPlayer.pause()
          }
          break
        case 'stop':
          quranPlayer.stop()
          break
        case 'next':
          void quranPlayer.next()
          break
        case 'previous':
          void quranPlayer.prev()
          break
      }
    }

    void addQuranMediaActionListener(handleMediaAction).then((handle) => {
      if (disposed) void handle?.remove()
      else nativeHandle = handle
    })
    return () => {
      disposed = true
      void nativeHandle?.remove()
    }
  }, [])

  const playPosition = useCallback((surahNumber: number, ayahNumber: number) => {
    void quranPlayer.playPosition(surahNumber, ayahNumber)
  }, [])

  const playPause = useCallback(() => {
    quranPlayer.togglePlayPause()
  }, [])

  const pause = useCallback(() => {
    quranPlayer.pause()
  }, [])

  const next = useCallback(() => {
    void quranPlayer.next()
  }, [])

  const prev = useCallback(() => {
    void quranPlayer.prev()
  }, [])

  const stop = useCallback(() => {
    quranPlayer.stop()
  }, [])

  const setAutoAdvance = useCallback((enabled: boolean) => {
    quranPlayer.setAutoAdvance(enabled)
  }, [])

  return {
    state,
    playPosition,
    playPause,
    pause,
    next,
    prev,
    stop,
    setAutoAdvance,
  }
}
