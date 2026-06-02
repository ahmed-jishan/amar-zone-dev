'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, Copy, Loader2, Share2, Trash2, Volume2 } from 'lucide-react';
import { type DuaItem } from './index';

interface DuaCardProps {
  dua: DuaItem;
  isRead: boolean;
  onToggleRead: () => void;
  onDelete?: () => void;
}

export default function DuaCard({ dua, isRead, onToggleRead, onDelete }: DuaCardProps) {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const arabicVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const banglaVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const voices = synthRef.current?.getVoices() || [];
      arabicVoiceRef.current =
        voices.find((voice) => voice.lang === 'ar-SA') ??
        voices.find((voice) => voice.lang.startsWith('ar')) ??
        null;
      banglaVoiceRef.current =
        voices.find((voice) => voice.lang === 'bn-BD') ??
        voices.find((voice) => voice.lang.startsWith('bn')) ??
        null;
      setVoicesLoaded(true);
    };

    if (synthRef.current.getVoices().length) {
      loadVoices();
    } else {
      synthRef.current.addEventListener('voiceschanged', loadVoices);
    }

    return () => {
      synthRef.current?.removeEventListener('voiceschanged', loadVoices);
      synthRef.current?.cancel();
    };
  }, []);

  const speakDuaWithMeaning = useCallback(() => {
    const synth = synthRef.current;
    if (!synth) {
      setErrorMsg('আপনার ডিভাইসে টেক্সট-টু-স্পিচ সাপোর্ট পাওয়া যায়নি।');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    synth.cancel();
    setIsPlaying(false);

    setTimeout(() => {
      const arabicUtterance = new SpeechSynthesisUtterance(dua.arabic);
      arabicUtterance.lang = 'ar';
      arabicUtterance.rate = 0.86;
      arabicUtterance.pitch = 1;
      if (arabicVoiceRef.current) arabicUtterance.voice = arabicVoiceRef.current;

      const meaningUtterance = new SpeechSynthesisUtterance(dua.translation);
      meaningUtterance.lang = 'bn-BD';
      meaningUtterance.rate = 0.92;
      meaningUtterance.pitch = 1;
      if (banglaVoiceRef.current) meaningUtterance.voice = banglaVoiceRef.current;

      arabicUtterance.onstart = () => {
        setIsPlaying(true);
        setErrorMsg(null);
      };
      arabicUtterance.onend = () => {
        if (dua.translation.trim()) {
          synth.speak(meaningUtterance);
          return;
        }
        setIsPlaying(false);
      };
      arabicUtterance.onerror = (event) => {
        setIsPlaying(false);
        setErrorMsg(event.error === 'not-allowed' ? 'স্পিচ ব্লক হয়েছে। পৃষ্ঠা রিলোড করে আবার চেষ্টা করুন।' : 'অডিও চালু করা যায়নি।');
        setTimeout(() => setErrorMsg(null), 4000);
      };
      meaningUtterance.onend = () => setIsPlaying(false);
      meaningUtterance.onerror = () => setIsPlaying(false);

      try {
        if (synth.paused) synth.resume();
        synth.speak(arabicUtterance);
      } catch {
        setErrorMsg('স্পিচ শুরু করা যায়নি।');
        setIsPlaying(false);
      }
    }, 100);
  }, [dua.arabic, dua.translation]);

  const handleSpeak = () => {
    if (isPlaying) {
      synthRef.current?.cancel();
      setIsPlaying(false);
      return;
    }

    if (!voicesLoaded) {
      setErrorMsg('ভয়েস লোড হচ্ছে, একটু পরে চেষ্টা করুন।');
      setTimeout(() => setErrorMsg(null), 2000);
      return;
    }

    speakDuaWithMeaning();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${dua.arabic}\n${dua.transliteration}\n${dua.translation}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMsg('কপি করা যায়নি।');
      setTimeout(() => setErrorMsg(null), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'দোয়া',
          text: `${dua.arabic}\n${dua.transliteration}\n${dua.translation}`,
        });
      } catch {
        // User cancelled share sheet.
      }
      return;
    }

    await handleCopy();
  };

  return (
    <div
      className={`rounded-2xl border bg-white/75 backdrop-blur-sm transition dark:bg-emerald-950/20 ${
        isRead ? 'border-emerald-200 bg-emerald-50/50' : 'border-emerald-100 dark:border-emerald-900/40'
      }`}
    >
      <div className="p-5">
        <p className="text-right text-2xl leading-loose text-emerald-950 dark:text-emerald-50" dir="rtl">
          {dua.arabic}
        </p>

        <p className="mt-3 border-l-2 border-emerald-300 pl-3 text-sm italic text-emerald-700 dark:text-emerald-200">
          {dua.transliteration}
        </p>

        <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-emerald-50/80">{dua.translation}</p>

        {dua.reference && <p className="mt-2 text-xs text-emerald-500">রেফারেন্স: {dua.reference}</p>}

        {errorMsg && (
          <div className="mt-3 flex items-center gap-1 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
            <AlertCircle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2 border-t border-emerald-100 pt-3 dark:border-emerald-900/40">
          <button
            type="button"
            onClick={onToggleRead}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              isRead
                ? 'bg-emerald-100 text-emerald-700'
                : 'border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle size={14} />
            {isRead ? 'পড়া হয়েছে' : 'পড়া শেষ'}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs text-emerald-600 transition hover:bg-emerald-50"
          >
            <Copy size={14} />
            {copied ? 'কপি হয়েছে' : 'কপি'}
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs text-emerald-600 transition hover:bg-emerald-50"
          >
            <Share2 size={14} />
            শেয়ার
          </button>

          <button
            type="button"
            onClick={handleSpeak}
            disabled={!voicesLoaded && !isPlaying}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs transition ${
              isPlaying
                ? 'bg-emerald-600 text-white'
                : 'border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {isPlaying ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
            {isPlaying ? 'শোনা যাচ্ছে...' : 'শুনুন'}
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('এই দোয়া মুছে ফেলবেন?')) onDelete();
              }}
              className="flex items-center gap-1 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs text-rose-600 transition hover:bg-rose-50"
            >
              <Trash2 size={14} />
              মুছুন
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
