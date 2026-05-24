// // app/(tabs)/namaz/components/QiblaView/AccuracyMeter.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { Activity, ShieldAlert, Smartphone, RotateCw, AlertTriangle } from 'lucide-react';

// interface AccuracyMeterProps {
//   onGrantPermission: () => void;
//   isIOS: boolean;
//   permissionGranted: boolean;
// }

// export default function AccuracyMeter({ onGrantPermission, isIOS, permissionGranted }: AccuracyMeterProps) {
//   const [sensorData, setSensorData] = useState({ alpha: '—', beta: '—', gamma: '—', absolute: false });
//   const [hasData, setHasData] = useState<boolean | null>(null);
//   const [manualModeDetected, setManualModeDetected] = useState(false);

//   useEffect(() => {
//     if (!permissionGranted) return;

//     let dataReceived = false;
//     const timeout = setTimeout(() => {
//       if (!dataReceived) {
//         setHasData(false);
//         setSensorData({ alpha: '—', beta: '—', gamma: '—', absolute: false });
//       } else {
//         setHasData(true);
//       }
//     }, 2000);

//     const handleOrientation = (event: DeviceOrientationEvent) => {
//       dataReceived = true;
//       setHasData(true);

//       const alpha = event.alpha !== null && !isNaN(event.alpha) ? event.alpha.toFixed(1) : '—';
//       const beta = event.beta !== null && !isNaN(event.beta) ? event.beta.toFixed(1) : '—';
//       const gamma = event.gamma !== null && !isNaN(event.gamma) ? event.gamma.toFixed(1) : '—';
//       const isAbsolute = !!(event as any).absolute || !!(event as any).webkitCompassHeading !== undefined;

//       setSensorData({ alpha, beta, gamma, absolute: isAbsolute });
//     };

//     window.addEventListener('deviceorientation', handleOrientation);
//     return () => {
//       window.removeEventListener('deviceorientation', handleOrientation);
//       clearTimeout(timeout);
//     };
//   }, [permissionGranted]);

//   // Listen for manual mode activation (custom event from compass)
//   useEffect(() => {
//     const handleManualMode = () => setManualModeDetected(true);
//     window.addEventListener('qibla-manual-mode', handleManualMode);
//     return () => window.removeEventListener('qibla-manual-mode', handleManualMode);
//   }, []);

//   if (!permissionGranted) {
//     return (
//       <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100 p-5 text-center">
//         <ShieldAlert size={40} className="text-emerald-400 mx-auto mb-3" />
//         <p className="text-emerald-800 font-medium mb-2">ওরিয়েন্টেশন পারমিশন প্রয়োজন</p>
//         <p className="text-sm text-emerald-600 mb-4">
//           {isIOS 
//             ? 'iOS ডিভাইসে কম্পাস কাজ করতে বাটনে ক্লিক করুন' 
//             : 'আপনার ডিভাইস কম্পাস সক্রিয় করুন'}
//         </p>
//         {isIOS && (
//           <button
//             onClick={onGrantPermission}
//             className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition"
//           >
//             পারমিশন দিন
//           </button>
//         )}
//       </div>
//     );
//   }

//   if (manualModeDetected || hasData === false) {
//     return (
//       <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-amber-200 p-5 text-center">
//         <AlertTriangle size={40} className="text-amber-500 mx-auto mb-3" />
//         <p className="text-amber-800 font-medium mb-2">সেন্সর ডাটা উপলব্ধ নয়</p>
//         <p className="text-sm text-amber-700">
//           আপনার ডিভাইসে কম্পাস সেন্সর নেই।<br />
//           <span className="text-xs">ম্যানুয়াল মোডে কিবলা নির্ধারণ করুন (স্লাইডার ব্যবহার করুন)</span>
//         </p>
//       </div>
//     );
//   }

//   if (!hasData) {
//     return (
//       <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100 p-5 text-center">
//         <Activity size={40} className="text-emerald-400 mx-auto mb-3 animate-pulse" />
//         <p className="text-emerald-700">সেন্সর ডাটা অপেক্ষমান...</p>
//         <p className="text-xs text-emerald-500 mt-2">ডিভাইস ঘোরান বা ম্যানুয়াল মোড স্বয়ংক্রিয়ভাবে সচল হবে</p>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100 p-5 space-y-4">
//       <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
//         <Activity size={18} className="text-emerald-600" />
//         <h3 className="font-semibold text-emerald-800">লাইভ সেন্সর ডাটা</h3>
//       </div>

//       <div className="bg-emerald-50/50 rounded-lg p-3 space-y-2">
//         <div className="grid grid-cols-3 gap-2 text-center text-sm">
//           <div>
//             <span className="text-emerald-600">α (কম্পাস)</span>
//             <p className="font-mono text-emerald-800 text-lg font-bold">{sensorData.alpha}°</p>
//           </div>
//           <div>
//             <span className="text-emerald-600">β (টিল্ট)</span>
//             <p className="font-mono text-emerald-800">{sensorData.beta}°</p>
//           </div>
//           <div>
//             <span className="text-emerald-600">γ (রোল)</span>
//             <p className="font-mono text-emerald-800">{sensorData.gamma}°</p>
//           </div>
//         </div>
//         <p className="text-[11px] text-emerald-500 text-center">
//           {sensorData.absolute ? 'পরম কম্পাস' : 'আপেক্ষিক কম্পাস (ক্যালিব্রেট দরকার)'}
//         </p>
//       </div>

//       <div className="text-xs text-emerald-600 bg-white/40 rounded-lg p-3">
//         <p className="flex items-center gap-1"><Smartphone size={12} /> নির্ভুলতার জন্য:</p>
//         <ul className="list-disc list-inside mt-1 space-y-0.5">
//           <li>ডিভাইস সমতল রাখুন</li>
//           <li>চিত্র-৮ আকারে ঘুরিয়ে ক্যালিব্রেট করুন</li>
//         </ul>
//       </div>
//     </div>
//   );
// }

'use client';

import { useState, useEffect } from 'react';

interface AccuracyMeterProps {
  onGrantPermission: () => void;
  isIOS: boolean;
  permissionGranted: boolean;
}

type SensorState = 'pending-permission' | 'waiting' | 'live' | 'no-sensor' | 'manual';

export default function AccuracyMeter({ onGrantPermission, isIOS, permissionGranted }: AccuracyMeterProps) {
  const [sensorState, setSensorState] = useState<SensorState>('pending-permission');
  const [sensorData, setSensorData] = useState({ alpha: '—', beta: '—', gamma: '—', absolute: false });
  const [signalStrength, setSignalStrength] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!permissionGranted) { setSensorState('pending-permission'); return; }
    setSensorState('waiting');
    let dataReceived = false;

    const timeout = setTimeout(() => {
      if (!dataReceived) setSensorState('no-sensor');
    }, 2000);

    const handle = (e: DeviceOrientationEvent) => {
      if (!dataReceived) { dataReceived = true; setSensorState('live'); }
      const alpha = e.alpha !== null && !isNaN(e.alpha) ? e.alpha.toFixed(1) : '—';
      const beta  = e.beta  !== null && !isNaN(e.beta)  ? e.beta.toFixed(1)  : '—';
      const gamma = e.gamma !== null && !isNaN(e.gamma) ? e.gamma.toFixed(1) : '—';
      const absolute = !!(e as any).absolute || (e as any).webkitCompassHeading !== undefined;
      setSensorData({ alpha, beta, gamma, absolute });

      if (beta !== '—' && gamma !== '—') {
        const tilt = Math.abs(parseFloat(beta)) + Math.abs(parseFloat(gamma));
        setSignalStrength(Math.max(0, Math.min(100, Math.round(100 - tilt * 0.8))));
      }
    };

    window.addEventListener('deviceorientation', handle);
    return () => { window.removeEventListener('deviceorientation', handle); clearTimeout(timeout); };
  }, [permissionGranted]);

  useEffect(() => {
    const h = () => setSensorState('manual');
    window.addEventListener('qibla-manual-mode', h);
    return () => window.removeEventListener('qibla-manual-mode', h);
  }, []);

  // ── Signal bars ──────────────────────────────────────────────────────────
  const SignalBars = ({ value }: { value: number }) => (
    <div className="flex items-end gap-0.5">
      {[1,2,3,4,5].map(i => {
        const active = value >= (i / 5) * 100 - 10;
        return (
          <div key={i}
            style={{ height: `${6 + i * 3}px`, width: '4px' }}
            className={`rounded-sm transition-all duration-300 ${active ? 'bg-emerald-500' : 'bg-emerald-200'}`}
          />
        );
      })}
    </div>
  );

  // ── Axis gauge ───────────────────────────────────────────────────────────
  const AxisGauge = ({ label, value, bangla }: { label: string; value: string; bangla: string }) => {
    const num = value !== '—' ? parseFloat(value) : 0;
    const pct = ((num + 180) / 360) * 100;
    const quality = signalStrength > 70 ? 'bg-emerald-500' : signalStrength > 40 ? 'bg-amber-400' : 'bg-rose-400';
    return (
      <div className="space-y-0.5">
        <div className="flex justify-between text-[11px]">
          <span className="font-mono font-semibold nz-text">{label} <span className="font-normal nz-muted">{bangla}</span></span>
          <span className="font-mono nz-text">{value}°</span>
        </div>
        <div className="relative h-1.5 overflow-hidden rounded-full nz-soft">
          <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-150 ${quality}`}
            style={{ width: `${pct}%` }} />
          <div className="absolute top-0 left-1/2 w-px h-full bg-emerald-300 opacity-60" />
        </div>
      </div>
    );
  };

  // ── Card shell ───────────────────────────────────────────────────────────
  const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-2xl p-5 nz-elevated-panel ${className}`}>
      {children}
    </div>
  );

  // ── Pending permission ───────────────────────────────────────────────────
  if (sensorState === 'pending-permission') {
    return (
      <Card className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto nz-chip">
          <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold nz-text">পারমিশন প্রয়োজন</p>
          <p className="text-xs mt-1 leading-relaxed nz-muted">
            {isIOS ? 'iOS এ কম্পাস চালু করতে নিচের বাটনে ক্লিক করুন' : 'ডিভাইস কম্পাস সক্রিয় করুন'}
          </p>
        </div>
        {isIOS && (
          <button onClick={onGrantPermission}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition active:scale-95 nz-primary">
            পারমিশন দিন
          </button>
        )}
      </Card>
    );
  }

  // ── Waiting ──────────────────────────────────────────────────────────────
  if (sensorState === 'waiting') {
    return (
      <Card className="text-center space-y-3">
        <div className="flex justify-center gap-1.5 items-end h-6">
          {[0,1,2,3,4].map(i => (
            <div key={i}
              className="w-1.5 rounded-full bg-emerald-400 transition-all duration-200"
              style={{ height: `${12 + (tick % 5 === i ? 12 : 0)}px`, opacity: tick % 5 === i ? 1 : 0.4 }}
            />
          ))}
        </div>
        <p className="text-sm nz-text">সেন্সর ডাটা লোড হচ্ছে...</p>
        <p className="text-xs nz-muted">ডিভাইস একটু নাড়াচাড়া করুন</p>
      </Card>
    );
  }

  // ── No sensor / manual ───────────────────────────────────────────────────
  if (sensorState === 'no-sensor' || sensorState === 'manual') {
    return (
      <Card className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto nz-soft">
          <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold nz-text">ম্যানুয়াল মোড</p>
          <p className="text-xs mt-1 leading-relaxed nz-muted">
            কম্পাস সেন্সর পাওয়া যায়নি।<br/>স্লাইডার দিয়ে কিবলা নির্ধারণ করুন।
          </p>
        </div>
        <div className="text-xs rounded-xl px-3 py-2 nz-soft nz-gold">
          💡 কিবলার দিক জানা থাকলে সেই ডিগ্রিতে সেট করুন
        </div>
      </Card>
    );
  }

  // ── Live ─────────────────────────────────────────────────────────────────
  const qualityLabel = signalStrength > 75 ? 'উত্তম' : signalStrength > 40 ? 'মাঝারি' : 'দুর্বল';
  const qualityColor = signalStrength > 75 ? 'nz-chip'
    : signalStrength > 40 ? 'nz-soft nz-gold'
    : 'text-rose-600 bg-rose-50 border-rose-200';

  return (
    <Card className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3 nz-divider">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-semibold nz-text">লাইভ সেন্সর</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${qualityColor}`}>
          {qualityLabel}
        </span>
      </div>

      {/* Signal */}
      <div className="flex items-center justify-between">
        <span className="text-xs nz-muted">সিগনাল শক্তি</span>
        <div className="flex items-center gap-2">
          <SignalBars value={signalStrength} />
          <span className="text-xs font-mono nz-text">{signalStrength}%</span>
        </div>
      </div>

      {/* Axis gauges */}
      <div className="rounded-xl p-3 space-y-2.5 nz-soft">
        <AxisGauge label="α" value={sensorData.alpha} bangla="কম্পাস" />
        <AxisGauge label="β" value={sensorData.beta}  bangla="টিল্ট" />
        <AxisGauge label="γ" value={sensorData.gamma} bangla="রোল" />
      </div>

      {/* Compass type */}
      <div className="flex items-center justify-between text-xs">
        <span className="nz-muted">কম্পাস ধরন</span>
        <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${
          sensorData.absolute
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          {sensorData.absolute ? 'পরম (Absolute)' : 'আপেক্ষিক'}
        </span>
      </div>

      {/* Tips */}
      <div className="rounded-xl p-3 space-y-1.5 nz-soft">
        <p className="text-xs font-semibold nz-text">নির্ভুলতার জন্য:</p>
        {['ডিভাইস সমতল রাখুন', '∞ আকারে ঘুরিয়ে ক্যালিব্রেট করুন', 'ধাতব বস্তু থেকে দূরে রাখুন'].map((t, i) => (
          <div key={i} className="flex items-start gap-1.5 text-xs nz-muted">
            <span className="nz-accent mt-px">›</span>
            <span>{t}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
