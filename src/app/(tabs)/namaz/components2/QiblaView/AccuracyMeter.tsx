// app/(tabs)/namaz/components/QiblaView/AccuracyMeter.tsx
'use client';

import { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Smartphone, RotateCw, AlertTriangle } from 'lucide-react';

interface AccuracyMeterProps {
  onGrantPermission: () => void;
  isIOS: boolean;
  permissionGranted: boolean;
}

export default function AccuracyMeter({ onGrantPermission, isIOS, permissionGranted }: AccuracyMeterProps) {
  const [sensorData, setSensorData] = useState({ alpha: '—', beta: '—', gamma: '—', absolute: false });
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [manualModeDetected, setManualModeDetected] = useState(false);

  useEffect(() => {
    if (!permissionGranted) return;

    let dataReceived = false;
    const timeout = setTimeout(() => {
      if (!dataReceived) {
        setHasData(false);
        setSensorData({ alpha: '—', beta: '—', gamma: '—', absolute: false });
      } else {
        setHasData(true);
      }
    }, 2000);

    const handleOrientation = (event: DeviceOrientationEvent) => {
      dataReceived = true;
      setHasData(true);

      const alpha = event.alpha !== null && !isNaN(event.alpha) ? event.alpha.toFixed(1) : '—';
      const beta = event.beta !== null && !isNaN(event.beta) ? event.beta.toFixed(1) : '—';
      const gamma = event.gamma !== null && !isNaN(event.gamma) ? event.gamma.toFixed(1) : '—';
      const isAbsolute = !!(event as any).absolute || !!(event as any).webkitCompassHeading !== undefined;

      setSensorData({ alpha, beta, gamma, absolute: isAbsolute });
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      clearTimeout(timeout);
    };
  }, [permissionGranted]);

  // Listen for manual mode activation (custom event from compass)
  useEffect(() => {
    const handleManualMode = () => setManualModeDetected(true);
    window.addEventListener('qibla-manual-mode', handleManualMode);
    return () => window.removeEventListener('qibla-manual-mode', handleManualMode);
  }, []);

  if (!permissionGranted) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100 p-5 text-center">
        <ShieldAlert size={40} className="text-emerald-400 mx-auto mb-3" />
        <p className="text-emerald-800 font-medium mb-2">ওরিয়েন্টেশন পারমিশন প্রয়োজন</p>
        <p className="text-sm text-emerald-600 mb-4">
          {isIOS 
            ? 'iOS ডিভাইসে কম্পাস কাজ করতে বাটনে ক্লিক করুন' 
            : 'আপনার ডিভাইস কম্পাস সক্রিয় করুন'}
        </p>
        {isIOS && (
          <button
            onClick={onGrantPermission}
            className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition"
          >
            পারমিশন দিন
          </button>
        )}
      </div>
    );
  }

  if (manualModeDetected || hasData === false) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-amber-200 p-5 text-center">
        <AlertTriangle size={40} className="text-amber-500 mx-auto mb-3" />
        <p className="text-amber-800 font-medium mb-2">সেন্সর ডাটা উপলব্ধ নয়</p>
        <p className="text-sm text-amber-700">
          আপনার ডিভাইসে কম্পাস সেন্সর নেই।<br />
          <span className="text-xs">ম্যানুয়াল মোডে কিবলা নির্ধারণ করুন (স্লাইডার ব্যবহার করুন)</span>
        </p>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100 p-5 text-center">
        <Activity size={40} className="text-emerald-400 mx-auto mb-3 animate-pulse" />
        <p className="text-emerald-700">সেন্সর ডাটা অপেক্ষমান...</p>
        <p className="text-xs text-emerald-500 mt-2">ডিভাইস ঘোরান বা ম্যানুয়াল মোড স্বয়ংক্রিয়ভাবে সচল হবে</p>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100 p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
        <Activity size={18} className="text-emerald-600" />
        <h3 className="font-semibold text-emerald-800">লাইভ সেন্সর ডাটা</h3>
      </div>

      <div className="bg-emerald-50/50 rounded-lg p-3 space-y-2">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <span className="text-emerald-600">α (কম্পাস)</span>
            <p className="font-mono text-emerald-800 text-lg font-bold">{sensorData.alpha}°</p>
          </div>
          <div>
            <span className="text-emerald-600">β (টিল্ট)</span>
            <p className="font-mono text-emerald-800">{sensorData.beta}°</p>
          </div>
          <div>
            <span className="text-emerald-600">γ (রোল)</span>
            <p className="font-mono text-emerald-800">{sensorData.gamma}°</p>
          </div>
        </div>
        <p className="text-[11px] text-emerald-500 text-center">
          {sensorData.absolute ? 'পরম কম্পাস' : 'আপেক্ষিক কম্পাস (ক্যালিব্রেট দরকার)'}
        </p>
      </div>

      <div className="text-xs text-emerald-600 bg-white/40 rounded-lg p-3">
        <p className="flex items-center gap-1"><Smartphone size={12} /> নির্ভুলতার জন্য:</p>
        <ul className="list-disc list-inside mt-1 space-y-0.5">
          <li>ডিভাইস সমতল রাখুন</li>
          <li>চিত্র-৮ আকারে ঘুরিয়ে ক্যালিব্রেট করুন</li>
        </ul>
      </div>
    </div>
  );
}