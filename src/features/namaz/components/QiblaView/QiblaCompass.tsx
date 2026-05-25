// // app/(tabs)/namaz/components/QiblaView/QiblaCompass.tsx
// 'use client';

// import { useEffect, useRef, useState } from 'react';
// import { Compass, RotateCw, RotateCcw, Smartphone } from 'lucide-react';

// interface QiblaCompassProps {
//   qiblaAngle: number;
/*
    if (!orientationGranted) {
    return (
      <div className="rounded-2xl p-6 text-center nz-card">
        <Compass size={48} className="text-emerald-400 mx-auto mb-3" />
        <p className="nz-muted">কম্পাস সক্রিয় করতে ওরিয়েন্টেশন পারমিশন দিন</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 nz-card">
      <div className="flex justify-center">
        <canvas ref={canvasRef} width={400} height={400} className="w-full max-w-[400px] h-auto" />
      </div>
      
      {error && (
        <div className="mt-3 text-center text-sm text-amber-700 bg-amber-50 p-2 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {manualMode && (
        <div className="mt-3 flex flex-col items-center gap-3">
          <div className="flex items-center gap-4">
            <button onClick={decreaseHeading} className="p-2 rounded-full nz-soft hover:opacity-95 transition">
              <RotateCcw size={20} className="nz-accent" />
            </button>
            <div className="text-center">
              <p className="text-xs nz-muted">ম্যানুয়াল হেডিং</p>
              <p className="text-xl font-bold nz-text">{Math.round(manualHeading)}°</p>
            </div>
            <button onClick={increaseHeading} className="p-2 rounded-full nz-soft hover:opacity-95 transition">
              <RotateCw size={20} className="nz-accent" />
            </button>
          </div>
          <div className="mt-2 text-sm nz-muted">স্ক্রিনে টাচ করে স্লাইড করে কিবলা নির্ধারণ করুন</div>
        </div>
      )}
    </div>
  );
}
//       ctx.beginPath();
//       ctx.moveTo(x1, y1);
//       ctx.lineTo(x2, y2);
//       ctx.strokeStyle = '#a7f3d0';
//       ctx.lineWidth = 1;
//       ctx.stroke();
//     }

//     // Use current heading (manual or real)
//     const heading = manualMode ? manualHeading : (deviceHeading ?? 0);
//     const rotate = -heading * Math.PI / 180;

//     const directions = [
//       { label: 'N', angle: 0 },
//       { label: 'E', angle: 90 },
//       { label: 'S', angle: 180 },
//       { label: 'W', angle: 270 }
//     ];
//     ctx.font = `bold ${size * 0.05}px "Segoe UI", system-ui`;
//     ctx.fillStyle = '#065f46';
//     ctx.textAlign = 'center';
//     ctx.textBaseline = 'middle';
//     for (const dir of directions) {
//       const rad = (dir.angle * Math.PI) / 180 + rotate;
//       const x = centerX + (radius + 15) * Math.cos(rad);
//       const y = centerY + (radius + 15) * Math.sin(rad);
//       ctx.fillText(dir.label, x, y);
//     }

//     // Qibla line (static)
//     const qiblaRad = (qiblaAngle * Math.PI) / 180;
//     const qiblaX = centerX + radius * Math.cos(qiblaRad);
//     const qiblaY = centerY + radius * Math.sin(qiblaRad);
//     ctx.beginPath();
//     ctx.moveTo(centerX, centerY);
//     ctx.lineTo(qiblaX, qiblaY);
//     ctx.strokeStyle = '#10b981';
//     ctx.lineWidth = 3;
//     ctx.setLineDash([5, 5]);
//     ctx.stroke();
//     ctx.setLineDash([]);

//     // Needle
//     const needleRad = heading * Math.PI / 180;
//     const needleLen = radius + 5;
//     const needleX = centerX + needleLen * Math.cos(needleRad);
//     const needleY = centerY + needleLen * Math.sin(needleRad);
//     ctx.beginPath();
//     ctx.moveTo(centerX, centerY);
//     ctx.lineTo(needleX, needleY);
//     ctx.strokeStyle = '#ef4444';
//     ctx.lineWidth = 3;
//     ctx.stroke();

//     ctx.beginPath();
//     ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
//     ctx.fillStyle = '#065f46';
//     ctx.fill();
//     ctx.fillStyle = '#ffffff';
//     ctx.beginPath();
//     ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
//     ctx.fill();

//     // Relative angle text
//     const diff = (qiblaAngle - heading + 360) % 360;
//     const deviation = Math.min(diff, 360 - diff);
//     ctx.font = `${size * 0.06}px "Segoe UI", system-ui`;
//     ctx.fillStyle = '#047857';
//     let msg = deviation <= 5 ? '✓ কিবলার দিকে মুখ করুন' : `${Math.round(deviation)}° বাম/ডানে ঘুরুন`;
//     ctx.fillText(msg, centerX, centerY + radius + 25);
//   };

//   // Resize and draw
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const resizeObserver = new ResizeObserver(() => {
//       const container = canvas.parentElement;
//       if (container) {
//         const size = Math.min(container.clientWidth, 400);
//         canvas.width = size;
//         canvas.height = size;
//         drawCompass();
//       }
//     });
//     if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
//     return () => resizeObserver.disconnect();
//   }, []);

//   useEffect(() => {
//     drawCompass();
//   }, [deviceHeading, manualHeading, manualMode, qiblaAngle]);

//   // Listen to real orientation and fallback to manual mode if no data
//   useEffect(() => {
//     if (!orientationGranted) return;

//     let dataReceived = false;

//     const handleOrientation = (event: DeviceOrientationEvent) => {
//       dataReceived = true;
//       if (noDataTimeout) clearTimeout(noDataTimeout);

//       let heading: number | null = null;
//       if ((event as any).webkitCompassHeading !== undefined) {
//         heading = (event as any).webkitCompassHeading;
//       } else if (event.alpha !== null && !isNaN(event.alpha)) {
//         heading = event.alpha;
//       }
//       if (heading !== null) {
//         setDeviceHeading((heading + 360) % 360);
//         setError(null);
//         setManualMode(false); // Real data available, switch to normal mode
//       }
//     };

//     window.addEventListener('deviceorientation', handleOrientation);

//     // Timeout: if no data within 2 seconds, switch to manual mode
//     const timeout = setTimeout(() => {
//       if (!dataReceived) {
//         setManualMode(true);
//         setError('আপনার ডিভাইস কম্পাস সাপোর্ট করে না। ম্যানুয়াল মোড চালু হয়েছে। আপনি স্লাইডার ব্যবহার করে কিবলা খুঁজে নিন।');
//         if (typeof window !== 'undefined') {
//         window.dispatchEvent(new Event('qibla-manual-mode'));
//         }
//       }
//     }, 2000);
//     setNoDataTimeout(timeout);

//     return () => {
//       window.removeEventListener('deviceorientation', handleOrientation);
//       if (timeout) clearTimeout(timeout);
//     };
//   }, [orientationGranted]);

//   const increaseHeading = () => setManualHeading(h => (h + 15) % 360);
//   const decreaseHeading = () => setManualHeading(h => (h - 15 + 360) % 360);

//   if (!orientationGranted) {
//     return (
//       <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100 p-6 text-center">
//         <Compass size={48} className="text-emerald-400 mx-auto mb-3" />
//         <p className="text-emerald-700">কম্পাস সক্রিয় করতে ওরিয়েন্টেশন পারমিশন দিন</p>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100 p-4">
//       <div className="flex justify-center">
//         <canvas ref={canvasRef} width={400} height={400} className="w-full max-w-[400px] h-auto" />
//       </div>
      
//       {error && (
//         <div className="mt-3 text-center text-sm text-amber-700 bg-amber-50 p-2 rounded-lg">
//           ⚠️ {error}
//         </div>
//       )}

//       {manualMode && (
//         <div className="mt-3 flex flex-col items-center gap-3">
//           <div className="flex items-center gap-4">
//             <button onClick={decreaseHeading} className="p-2 bg-emerald-100 rounded-full hover:bg-emerald-200 transition">
//               <RotateCcw size={20} className="text-emerald-700" />
//             </button>
//             <div className="text-center">
//               <p className="text-xs text-emerald-600">ম্যানুয়াল হেডিং</p>
//               <p className="text-xl font-bold text-emerald-800">{Math.round(manualHeading)}°</p>
//             </div>
//             <button onClick={increaseHeading} className="p-2 bg-emerald-100 rounded-full hover:bg-emerald-200 transition">
//               <RotateCw size={20} className="text-emerald-700" />
//             </button>
//           </div>
//           <input
//             type="range"
//             min="0"
//             max="359"
//             value={manualHeading}
//             onChange={(e) => setManualHeading(parseInt(e.target.value))}
//             className="w-full max-w-xs accent-emerald-600"
//           />
//           <p className="text-xs text-emerald-600 flex items-center gap-1">
//             <Smartphone size={12} /> ম্যানুয়াল মোড: আপনার ডিভাইসের হেডিং সিমুলেট করুন
//           </p>
//         </div>
//       )}

//       {!manualMode && !error && (
//         <div className="mt-3 text-center text-xs text-emerald-600">
//           🧭 কম্পাস সক্রিয় – ডিভাইস ঘুরিয়ে কিবলা খুঁজুন
//         </div>
//       )}
//     </div>
//   );
// }
*/

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface QiblaCompassProps {
  qiblaAngle: number;
  orientationGranted: boolean;
}

export default function QiblaCompass({ qiblaAngle, orientationGranted }: QiblaCompassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const currentHeadingRef = useRef(0);
  const targetHeadingRef = useRef(0);

  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualHeading, setManualHeading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deviation, setDeviation] = useState<number | null>(null);
  const [isAligned, setIsAligned] = useState(false);
  const [pulse, setPulse] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) * 0.38;

    ctx.clearRect(0, 0, W, H);

    const heading = manualMode ? manualHeading : currentHeadingRef.current;

    // ── Soft ambient glow ────────────────────────────────────────────────
    const ambientGrad = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.4);
    ambientGrad.addColorStop(0,   'rgba(16,185,129,0.10)');
    ambientGrad.addColorStop(0.6, 'rgba(20,184,166,0.05)');
    ambientGrad.addColorStop(1,   'rgba(16,185,129,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.4, 0, Math.PI * 2);
    ctx.fillStyle = ambientGrad;
    ctx.fill();

    // ── Outer drop shadow ────────────────────────────────────────────────
    ctx.save();
    ctx.shadowColor = 'rgba(6,87,66,0.16)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, R + 14, 0, Math.PI * 2);
    ctx.fillStyle = '#e8f5ee';
    ctx.fill();
    ctx.restore();

    // ── Gold bezel ───────────────────────────────────────────────────────
    const bezelGrad = ctx.createLinearGradient(cx - R - 14, cy - R - 14, cx + R + 14, cy + R + 14);
    bezelGrad.addColorStop(0,    '#f0d060');
    bezelGrad.addColorStop(0.25, '#d4af37');
    bezelGrad.addColorStop(0.5,  '#f5e070');
    bezelGrad.addColorStop(0.75, '#b8960c');
    bezelGrad.addColorStop(1,    '#c9a820');
    ctx.beginPath();
    ctx.arc(cx, cy, R + 14, 0, Math.PI * 2);
    ctx.fillStyle = bezelGrad;
    ctx.fill();

    // Thin separator ring
    ctx.beginPath();
    ctx.arc(cx, cy, R + 8, 0, Math.PI * 2);
    ctx.fillStyle = '#f7fdf9';
    ctx.fill();

    // ── Compass face ─────────────────────────────────────────────────────
    const faceGrad = ctx.createRadialGradient(cx - R * 0.18, cy - R * 0.18, R * 0.05, cx, cy, R);
    faceGrad.addColorStop(0,   '#fafffe');
    faceGrad.addColorStop(0.45,'#f2fcf7');
    faceGrad.addColorStop(1,   '#e8f7ef');
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = faceGrad;
    ctx.fill();

    // Subtle depth rings
    [0.75, 0.50].forEach((ratio, i) => {
      ctx.beginPath();
      ctx.arc(cx, cy, R * ratio, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(6,95,70,${0.06 - i * 0.02})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

    // ── Degree ticks + cardinals (rotate with heading) ───────────────────
    const rotate = (-heading * Math.PI) / 180;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotate);

    for (let deg = 0; deg < 360; deg += 5) {
      const rad = (deg * Math.PI) / 180;
      const isMajor = deg % 90 === 0;
      const isMed   = deg % 45 === 0;
      const isSmall = deg % 15 === 0;
      const inner = isMajor ? R * 0.81 : isMed ? R * 0.86 : isSmall ? R * 0.89 : R * 0.92;
      const outer = R * 0.97;

      ctx.beginPath();
      ctx.moveTo(Math.cos(rad) * inner, Math.sin(rad) * inner);
      ctx.lineTo(Math.cos(rad) * outer, Math.sin(rad) * outer);
      ctx.strokeStyle = isMajor ? '#b8960c' : isSmall ? 'rgba(6,95,70,0.30)' : 'rgba(6,95,70,0.12)';
      ctx.lineWidth = isMajor ? 2 : 0.8;
      ctx.stroke();
    }

    // Degree numbers (every 30°)
    ctx.font = `500 ${R * 0.075}px 'Georgia', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let deg = 0; deg < 360; deg += 30) {
      if (deg % 90 === 0) continue; // cardinals handle these
      const rad = (deg * Math.PI) / 180;
      const tx = Math.cos(rad) * R * 0.62;
      const ty = Math.sin(rad) * R * 0.62;
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(-rotate);
      ctx.fillStyle = 'rgba(6,95,70,0.35)';
      ctx.fillText(String(deg), 0, 0);
      ctx.restore();
    }

    // Cardinal letters
    const cardinals = [
      { label: 'N', angle: 0,   color: '#dc2626', size: R * 0.135 },
      { label: 'S', angle: 180, color: '#065f46', size: R * 0.105 },
      { label: 'E', angle: 90,  color: '#92670a', size: R * 0.105 },
      { label: 'W', angle: 270, color: '#92670a', size: R * 0.105 },
    ];
    cardinals.forEach(({ label, angle, color, size }) => {
      const rad = (angle * Math.PI) / 180;
      const tx = Math.cos(rad) * R * 0.695;
      const ty = Math.sin(rad) * R * 0.695;
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(-rotate);
      ctx.font = `700 ${size}px 'Georgia', serif`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });

    ctx.restore();

    // ── Qibla ray ────────────────────────────────────────────────────────
    const alignDiff = ((qiblaAngle - heading) + 360) % 360;
    const dev = Math.min(alignDiff, 360 - alignDiff);
    setDeviation(Math.round(dev));
    const aligned = dev <= 5;
    setIsAligned(aligned);

    const qRad  = ((qiblaAngle - heading) * Math.PI) / 180 - Math.PI / 2;
    const qEndX = cx + Math.cos(qRad) * R * 0.83;
    const qEndY = cy + Math.sin(qRad) * R * 0.83;

    const qGrad = ctx.createLinearGradient(cx, cy, qEndX, qEndY);
    qGrad.addColorStop(0,   'rgba(5,150,105,0)');
    qGrad.addColorStop(0.3, 'rgba(5,150,105,0.4)');
    qGrad.addColorStop(1,   aligned ? '#047857' : '#059669');
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(qEndX, qEndY);
    ctx.strokeStyle = qGrad;
    ctx.lineWidth = aligned ? 2.5 : 2;
    ctx.setLineDash([7, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Kaaba icon at tip
    const ks = R * 0.082;
    ctx.save();
    ctx.translate(qEndX, qEndY);

    if (aligned && pulse) {
      ctx.beginPath();
      ctx.arc(0, 0, ks * 2.0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(5,150,105,0.12)';
      ctx.fill();
    }

    ctx.shadowColor = aligned ? 'rgba(4,120,87,0.35)' : 'rgba(5,150,105,0.2)';
    ctx.shadowBlur = aligned ? 10 : 5;
    ctx.fillStyle = aligned ? '#047857' : '#059669';
    ctx.fillRect(-ks / 2, -ks / 2, ks, ks);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(-ks * 0.14, ks * 0.04, ks * 0.28, ks * 0.44);
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── North needle ─────────────────────────────────────────────────────
    const nAngle = -Math.PI / 2;
    const nLen = R * 0.58;
    const sLen = R * 0.36;
    const nw = 5;

    ctx.save();
    ctx.shadowColor = 'rgba(220,38,38,0.25)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(nAngle + Math.PI / 2) * nw, cy + Math.sin(nAngle + Math.PI / 2) * nw);
    ctx.lineTo(cx + Math.cos(nAngle) * nLen, cy + Math.sin(nAngle) * nLen);
    ctx.lineTo(cx + Math.cos(nAngle - Math.PI / 2) * nw, cy + Math.sin(nAngle - Math.PI / 2) * nw);
    ctx.closePath();
    const nGrad = ctx.createLinearGradient(cx, cy, cx + Math.cos(nAngle) * nLen, cy + Math.sin(nAngle) * nLen);
    nGrad.addColorStop(0, '#fecaca');
    nGrad.addColorStop(1, '#dc2626');
    ctx.fillStyle = nGrad;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(nAngle + Math.PI / 2) * nw, cy + Math.sin(nAngle + Math.PI / 2) * nw);
    ctx.lineTo(cx + Math.cos(nAngle + Math.PI) * sLen, cy + Math.sin(nAngle + Math.PI) * sLen);
    ctx.lineTo(cx + Math.cos(nAngle - Math.PI / 2) * nw, cy + Math.sin(nAngle - Math.PI / 2) * nw);
    ctx.closePath();
    const sGrad = ctx.createLinearGradient(cx, cy, cx + Math.cos(nAngle + Math.PI) * sLen, cy + Math.sin(nAngle + Math.PI) * sLen);
    sGrad.addColorStop(0, '#d1fae5');
    sGrad.addColorStop(1, '#6ee7b7');
    ctx.fillStyle = sGrad;
    ctx.fill();

    // ── Center jewel ─────────────────────────────────────────────────────
    const jewel = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, 9);
    jewel.addColorStop(0,   '#fefce8');
    jewel.addColorStop(0.4, '#d4af37');
    jewel.addColorStop(1,   '#92670a');
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fillStyle = jewel;
    ctx.shadowColor = 'rgba(212,175,55,0.5)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(cx - 2.5, cy - 2.5, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fill();

  }, [deviceHeading, manualHeading, manualMode, qiblaAngle, pulse]);

  // Smooth animation loop
  useEffect(() => {
    const loop = () => {
      if (!manualMode) {
        const diff = ((targetHeadingRef.current - currentHeadingRef.current + 540) % 360) - 180;
        currentHeadingRef.current = (currentHeadingRef.current + diff * 0.08 + 360) % 360;
      }
      draw();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw, manualMode]);

  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 700);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const parent = canvas.parentElement;
      if (parent) {
        const size = Math.min(parent.clientWidth, 440);
        canvas.width = size;
        canvas.height = size;
      }
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!orientationGranted) return;
    let dataReceived = false;

    const onOrientation = (e: DeviceOrientationEvent) => {
      dataReceived = true;
      let h: number | null = null;
      if ((e as any).webkitCompassHeading !== undefined) h = (e as any).webkitCompassHeading;
      else if (e.alpha !== null && !isNaN(e.alpha)) h = e.alpha;
      if (h !== null) {
        const norm = (h + 360) % 360;
        targetHeadingRef.current = norm;
        setDeviceHeading(norm);
        setManualMode(false);
        setError(null);
      }
    };

    window.addEventListener('deviceorientation', onOrientation);
    const t = setTimeout(() => {
      if (!dataReceived) {
        setManualMode(true);
        setError('কম্পাস সেন্সর পাওয়া যায়নি — ম্যানুয়াল মোড চালু');
        window.dispatchEvent(new Event('qibla-manual-mode'));
      }
    }, 2000);

    return () => { window.removeEventListener('deviceorientation', onOrientation); clearTimeout(t); };
  }, [orientationGranted]);

  useEffect(() => {
    if (manualMode) currentHeadingRef.current = manualHeading;
  }, [manualHeading, manualMode]);

  if (!orientationGranted) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shadow-sm">
          <svg className="w-7 h-7 text-emerald-500 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
          </svg>
        </div>
        <p className="text-emerald-700 text-sm">পারমিশন দিলে কম্পাস সক্রিয় হবে</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: '5%',
          background: isAligned
            ? 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)',
          transition: 'background 0.8s ease',
        }}
      />

      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={440}
          height={440}
          className="w-full max-w-[440px] h-auto"
          style={{ filter: 'drop-shadow(0 6px 20px rgba(6,95,70,0.10))' }}
        />
      </div>

      {/* Status */}
      <div className="mt-4 flex justify-center">
        {isAligned ? (
          <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-100 border border-emerald-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-800 text-sm font-semibold">কিবলামুখী — আল্লাহু আকবর</span>
          </div>
        ) : deviation !== null ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-emerald-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-emerald-700 text-sm">{deviation}° আরও ঘুরুন</span>
          </div>
        ) : null}
      </div>

      {error && (
        <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl text-center">
          ⚠️ {error}
        </div>
      )}

      {manualMode && (
        <div className="mt-5 flex flex-col items-center gap-3 px-4">
          <p className="text-xs font-semibold text-emerald-600 tracking-widest uppercase">ম্যানুয়াল মোড</p>
          <div className="flex items-center gap-5 w-full max-w-xs">
            <button onClick={() => setManualHeading(h => (h - 15 + 360) % 360)}
              className="w-10 h-10 rounded-lg bg-white border border-emerald-200 shadow-sm text-emerald-700 text-lg flex items-center justify-center hover:bg-emerald-50 transition active:scale-95">‹</button>
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-emerald-800 font-mono">{Math.round(manualHeading)}°</p>
            </div>
            <button onClick={() => setManualHeading(h => (h + 15) % 360)}
              className="w-10 h-10 rounded-lg bg-white border border-emerald-200 shadow-sm text-emerald-700 text-lg flex items-center justify-center hover:bg-emerald-50 transition active:scale-95">›</button>
          </div>
          <input type="range" min={0} max={359} value={manualHeading}
            onChange={e => setManualHeading(parseInt(e.target.value))}
            className="w-full max-w-xs accent-emerald-600" />
        </div>
      )}

      {!manualMode && !error && (
        <p className="mt-2 text-center text-xs text-emerald-500">🧭 লাইভ কম্পাস — ডিভাইস ঘুরিয়ে কিবলা খুঁজুন</p>
      )}
    </div>
  );
}
