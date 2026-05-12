// app/(tabs)/namaz/components/TasbihView/DigitalTasbih.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Minus, RotateCcw, Target, Sparkles } from 'lucide-react';
import { ZikrItem } from './index';

interface DigitalTasbihProps {
  zikr: ZikrItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onReset: () => void;
}

export default function DigitalTasbih({ zikr, onIncrement, onDecrement, onReset }: DigitalTasbihProps) {
  const [animate, setAnimate] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const progress = (zikr.count / zikr.target) * 100;

  const handleTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipple({ x, y });
    setTimeout(() => setRipple(null), 500);

    // Animation
    setAnimate(true);
    setTimeout(() => setAnimate(false), 200);
    onIncrement();
  };

  useEffect(() => {
    if (zikr.count === zikr.target && zikr.target > 0) {
      // Celebration effect when target reached
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  }, [zikr.count, zikr.target]);

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100 p-6 shadow-sm transition-all">
      {/* Zikr Info */}
      <div className="text-center mb-6">
        <h3 className="text-3xl font-arabic font-bold text-emerald-900 mb-2">{zikr.arabic}</h3>
        <p className="text-emerald-700 font-medium">{zikr.transliteration}</p>
        <p className="text-sm text-emerald-500">{zikr.bangla}</p>
      </div>

      {/* Circular Progress + Counter */}
      <div className="relative flex justify-center items-center mb-8">
        <div className="relative w-40 h-40">
          {/* Background circle */}
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="72"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="80"
              cy="80"
              r="72"
              fill="none"
              stroke="#10b981"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 72}`}
              strokeDashoffset={`${2 * Math.PI * 72 * (1 - progress / 100)}`}
              className="transition-all duration-500 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-emerald-800">{zikr.count}</span>
            <span className="text-sm text-emerald-500">/ {zikr.target}</span>
          </div>
        </div>
      </div>

      {/* Main Tap Button */}
      <div className="relative flex justify-center mb-6">
        <button
          ref={buttonRef}
          onClick={handleTap}
          className={`
            relative w-48 h-48 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 
            shadow-2xl hover:shadow-xl transition-all duration-100 active:scale-95
            flex flex-col items-center justify-center text-white
            ${animate ? 'scale-95' : 'scale-100'}
          `}
        >
          <Sparkles size={40} className="mb-2 opacity-80" />
          <span className="text-2xl font-bold">ট্যাপ করুন</span>
          <span className="text-sm opacity-80">+১</span>
          {ripple && (
            <span
              className="absolute rounded-full bg-white/30 animate-ripple"
              style={{
                left: ripple.x - 20,
                top: ripple.y - 20,
                width: 40,
                height: 40,
              }}
            />
          )}
        </button>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onDecrement}
          disabled={zikr.count === 0}
          className="px-5 py-2 rounded-xl bg-white border border-emerald-200 text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-50 transition flex items-center gap-1"
        >
          <Minus size={18} /> কমান
        </button>
        <button
          onClick={onReset}
          className="px-5 py-2 rounded-xl bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 transition flex items-center gap-1"
        >
          <RotateCcw size={16} /> রিসেট
        </button>
      </div>

      {/* Target Hint */}
      {zikr.count >= zikr.target && zikr.target > 0 && (
        <div className="mt-4 text-center text-emerald-600 text-sm animate-pulse">
          ✓ টার্গেট পূর্ণ হয়েছে! 🌟
        </div>
      )}
    </div>
  );
}