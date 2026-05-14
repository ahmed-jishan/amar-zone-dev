// app/(tabs)/namaz/components/DuaView/DuaCard.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, Copy, Share2, Volume2, Loader2, AlertCircle } from 'lucide-react';
import { DuaItem } from './index';

interface DuaCardProps {
  dua: DuaItem;
  isRead: boolean;
  onToggleRead: () => void;
}

export default function DuaCard({ dua, isRead, onToggleRead }: DuaCardProps) {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const arabicVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Load voices and find Arabic voice
  useEffect(() => {
    if (typeof window === 'undefined') return;
    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const voices = synthRef.current?.getVoices() || [];
      const arabicVoice = voices.find(voice => 
        voice.lang.startsWith('ar') || 
        voice.lang === 'ar' || 
        voice.lang === 'ar-SA' ||
        voice.lang === 'ar-EG'
      );
      if (arabicVoice) {
        arabicVoiceRef.current = arabicVoice;
        console.log('✅ Arabic voice found:', arabicVoice.name);
      } else {
        console.warn('⚠️ No Arabic voice found. Will use default (might not sound Arabic).');
        setErrorMsg('আরবি ভয়েস পাওয়া যায়নি, ডিফল্ট ভয়েস ব্যবহার হবে।');
        setTimeout(() => setErrorMsg(null), 3000);
      }
      setVoicesLoaded(true);
    };

    if (synthRef.current?.getVoices().length) {
      loadVoices();
    } else {
      synthRef.current?.addEventListener('voiceschanged', loadVoices);
      return () => synthRef.current?.removeEventListener('voiceschanged', loadVoices);
    }
  }, []);

  const speakArabic = useCallback(() => {
    if (!synthRef.current) {
      setErrorMsg('আপনার ব্রাউজার টেক্সট-টু-স্পিচ সাপোর্ট করে না।');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    // Cancel any ongoing speech
    synthRef.current.cancel();
    setIsPlaying(false);

    // Slight delay to ensure cancel takes effect
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(dua.arabic);
      utterance.lang = 'ar';
      utterance.rate = 0.9;
      utterance.pitch = 1;

      if (arabicVoiceRef.current) {
        utterance.voice = arabicVoiceRef.current;
      } else {
        // Final attempt to find Arabic voice
        const voices = synthRef.current?.getVoices() || [];
        const freshArabic = voices.find(v => v.lang.startsWith('ar'));
        if (freshArabic) {
          utterance.voice = freshArabic;
          arabicVoiceRef.current = freshArabic;
        }
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setErrorMsg(null);
      };
      utterance.onend = () => {
        setIsPlaying(false);
      };
      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        setIsPlaying(false);
        // Do not show generic block message; give specific advice
        if (event.error === 'not-allowed') {
          setErrorMsg('ব্রাউজার স্পিচ ব্লক করেছে। অনুগ্রহ করে পৃষ্ঠা রিলোড করে আবার ক্লিক করুন।');
        } else {
          setErrorMsg('অডিও প্লে করা যায়নি। পরে চেষ্টা করুন।');
        }
        setTimeout(() => setErrorMsg(null), 4000);
      };

      utteranceRef.current = utterance;

      try {
        // Some browsers require resume after cancel
        if (synthRef.current?.paused) {
          synthRef.current.resume();
        }
        synthRef.current?.speak(utterance);
      } catch (err) {
        console.error(err);
        setErrorMsg('স্পিচ শুরু করা যায়নি।');
        setIsPlaying(false);
      }
    }, 100);
  }, [dua.arabic]);

  const handleSpeak = () => {
    if (isPlaying) {
      synthRef.current?.cancel();
      setIsPlaying(false);
    } else {
      if (!voicesLoaded) {
        setErrorMsg('ভয়েস লোড হচ্ছে, একটু পরে চেষ্টা করুন');
        setTimeout(() => setErrorMsg(null), 2000);
        return;
      }
      speakArabic();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${dua.arabic}\n${dua.transliteration}\n${dua.translation}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'দু‘আ',
          text: `${dua.arabic}\n${dua.transliteration}\n${dua.translation}`,
        });
      } catch (err) {
        console.error('Share failed');
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className={`
      bg-white/70 backdrop-blur-sm rounded-2xl border transition-all duration-300 
      hover:shadow-lg hover:-translate-y-1
      ${isRead ? 'border-emerald-200 bg-emerald-50/40' : 'border-emerald-100'}
    `}>
      <div className="p-5">
        {/* Arabic Text */}
        <div className="text-right">
          <p className="text-2xl font-arabic leading-loose text-emerald-900">{dua.arabic}</p>
        </div>

        <p className="text-emerald-700 italic mt-3 text-sm border-l-2 border-emerald-300 pl-3">
          {dua.transliteration}
        </p>

        <p className="text-gray-700 mt-2 text-sm leading-relaxed">
          {dua.translation}
        </p>

        {dua.reference && (
          <p className="text-xs text-emerald-500 mt-2">📖 {dua.reference}</p>
        )}

        {errorMsg && (
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-700 bg-amber-50 p-1.5 rounded-lg">
            <AlertCircle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-emerald-100">
          <button
            onClick={onToggleRead}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              isRead ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle size={14} />
            {isRead ? 'পড়া হয়েছে' : 'পড়া শেষ'}
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition"
          >
            <Copy size={14} />
            {copied ? 'কপি হয়েছে' : 'কপি'}
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition"
          >
            <Share2 size={14} />
            শেয়ার
          </button>

          <button
            onClick={handleSpeak}
            disabled={!voicesLoaded && !isPlaying}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition ${
              isPlaying
                ? 'bg-emerald-600 text-white animate-pulse'
                : 'bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isPlaying ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
            {isPlaying ? 'শোনা যাচ্ছে...' : 'শুনুন'}
          </button>
        </div>
      </div>
    </div>
  );
}