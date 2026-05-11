// app/(tabs)/namaz/components/QiblaView/QiblaCompass.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Compass, RotateCw, RotateCcw, Smartphone } from 'lucide-react';

interface QiblaCompassProps {
  qiblaAngle: number;
  orientationGranted: boolean;
}

export default function QiblaCompass({ qiblaAngle, orientationGranted }: QiblaCompassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualHeading, setManualHeading] = useState(0);
  const [noDataTimeout, setNoDataTimeout] = useState<NodeJS.Timeout | null>(null);

  // Draw compass (same drawing logic)
  const drawCompass = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4;

    ctx.clearRect(0, 0, size, size);

    // Outer circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();
    ctx.strokeStyle = '#065f46';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Degree marks
    for (let i = 0; i < 360; i += 15) {
      const rad = (i * Math.PI) / 180;
      const x1 = centerX + (radius - 5) * Math.cos(rad);
      const y1 = centerY + (radius - 5) * Math.sin(rad);
      const x2 = centerX + radius * Math.cos(rad);
      const y2 = centerY + radius * Math.sin(rad);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Use current heading (manual or real)
    const heading = manualMode ? manualHeading : (deviceHeading ?? 0);
    const rotate = -heading * Math.PI / 180;

    const directions = [
      { label: 'N', angle: 0 },
      { label: 'E', angle: 90 },
      { label: 'S', angle: 180 },
      { label: 'W', angle: 270 }
    ];
    ctx.font = `bold ${size * 0.05}px "Segoe UI", system-ui`;
    ctx.fillStyle = '#065f46';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const dir of directions) {
      const rad = (dir.angle * Math.PI) / 180 + rotate;
      const x = centerX + (radius + 15) * Math.cos(rad);
      const y = centerY + (radius + 15) * Math.sin(rad);
      ctx.fillText(dir.label, x, y);
    }

    // Qibla line (static)
    const qiblaRad = (qiblaAngle * Math.PI) / 180;
    const qiblaX = centerX + radius * Math.cos(qiblaRad);
    const qiblaY = centerY + radius * Math.sin(qiblaRad);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(qiblaX, qiblaY);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Needle
    const needleRad = heading * Math.PI / 180;
    const needleLen = radius + 5;
    const needleX = centerX + needleLen * Math.cos(needleRad);
    const needleY = centerY + needleLen * Math.sin(needleRad);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(needleX, needleY);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#065f46';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
    ctx.fill();

    // Relative angle text
    const diff = (qiblaAngle - heading + 360) % 360;
    const deviation = Math.min(diff, 360 - diff);
    ctx.font = `${size * 0.06}px "Segoe UI", system-ui`;
    ctx.fillStyle = '#047857';
    let msg = deviation <= 5 ? '✓ কিবলার দিকে মুখ করুন' : `${Math.round(deviation)}° বাম/ডানে ঘুরুন`;
    ctx.fillText(msg, centerX, centerY + radius + 25);
  };

  // Resize and draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeObserver = new ResizeObserver(() => {
      const container = canvas.parentElement;
      if (container) {
        const size = Math.min(container.clientWidth, 400);
        canvas.width = size;
        canvas.height = size;
        drawCompass();
      }
    });
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    drawCompass();
  }, [deviceHeading, manualHeading, manualMode, qiblaAngle]);

  // Listen to real orientation and fallback to manual mode if no data
  useEffect(() => {
    if (!orientationGranted) return;

    let dataReceived = false;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      dataReceived = true;
      if (noDataTimeout) clearTimeout(noDataTimeout);

      let heading: number | null = null;
      if ((event as any).webkitCompassHeading !== undefined) {
        heading = (event as any).webkitCompassHeading;
      } else if (event.alpha !== null && !isNaN(event.alpha)) {
        heading = event.alpha;
      }
      if (heading !== null) {
        setDeviceHeading((heading + 360) % 360);
        setError(null);
        setManualMode(false); // Real data available, switch to normal mode
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);

    // Timeout: if no data within 2 seconds, switch to manual mode
    const timeout = setTimeout(() => {
      if (!dataReceived) {
        setManualMode(true);
        setError('আপনার ডিভাইস কম্পাস সাপোর্ট করে না। ম্যানুয়াল মোড চালু হয়েছে। আপনি স্লাইডার ব্যবহার করে কিবলা খুঁজে নিন।');
        if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('qibla-manual-mode'));
        }
      }
    }, 2000);
    setNoDataTimeout(timeout);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (timeout) clearTimeout(timeout);
    };
  }, [orientationGranted]);

  const increaseHeading = () => setManualHeading(h => (h + 15) % 360);
  const decreaseHeading = () => setManualHeading(h => (h - 15 + 360) % 360);

  if (!orientationGranted) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100 p-6 text-center">
        <Compass size={48} className="text-emerald-400 mx-auto mb-3" />
        <p className="text-emerald-700">কম্পাস সক্রিয় করতে ওরিয়েন্টেশন পারমিশন দিন</p>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100 p-4">
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
            <button onClick={decreaseHeading} className="p-2 bg-emerald-100 rounded-full hover:bg-emerald-200 transition">
              <RotateCcw size={20} className="text-emerald-700" />
            </button>
            <div className="text-center">
              <p className="text-xs text-emerald-600">ম্যানুয়াল হেডিং</p>
              <p className="text-xl font-bold text-emerald-800">{Math.round(manualHeading)}°</p>
            </div>
            <button onClick={increaseHeading} className="p-2 bg-emerald-100 rounded-full hover:bg-emerald-200 transition">
              <RotateCw size={20} className="text-emerald-700" />
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="359"
            value={manualHeading}
            onChange={(e) => setManualHeading(parseInt(e.target.value))}
            className="w-full max-w-xs accent-emerald-600"
          />
          <p className="text-xs text-emerald-600 flex items-center gap-1">
            <Smartphone size={12} /> ম্যানুয়াল মোড: আপনার ডিভাইসের হেডিং সিমুলেট করুন
          </p>
        </div>
      )}

      {!manualMode && !error && (
        <div className="mt-3 text-center text-xs text-emerald-600">
          🧭 কম্পাস সক্রিয় – ডিভাইস ঘুরিয়ে কিবলা খুঁজুন
        </div>
      )}
    </div>
  );
}