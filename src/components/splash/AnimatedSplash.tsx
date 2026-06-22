'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const SPLASH_DURATION = 4500; // ms
const SESSION_KEY = 'selfsync_splash_seen';

export default function AnimatedSplash() {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const particlesRef = useRef<any[]>([]);

  // ─── Canvas particles ───
  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = () => frame.clientWidth;
    const H = () => frame.clientHeight;
    const cx = () => W() / 2;
    const cy = () => H() / 2;

    let DPR = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = W() * DPR;
      canvas!.height = H() * DPR;
      canvas!.style.width = W() + 'px';
      canvas!.style.height = H() + 'px';
      ctx!.scale(DPR, DPR);
    }

    const COLORS = {
      indigo: [99, 102, 241] as [number, number, number],
      blue: [91, 127, 255] as [number, number, number],
      cyan: [0, 229, 255] as [number, number, number],
      green: [16, 185, 129] as [number, number, number],
      white: [255, 255, 255] as [number, number, number],
    };

    function createParticle(i: number) {
      const orb = i < 8;
      const a = Math.random() * Math.PI * 2;
      const d = orb ? 50 + Math.random() * 45 : 30 + Math.random() * Math.min(W(), H()) * 0.3;
      const cs = orb ? [COLORS.indigo, COLORS.blue, COLORS.cyan] : [COLORS.cyan, COLORS.white, COLORS.indigo, COLORS.blue];
      const c = cs[Math.floor(Math.random() * cs.length)];
      return {
        x: cx() + Math.cos(a) * (orb ? d * 1.2 : d),
        y: cy() + Math.sin(a) * (orb ? d * 1.2 : d),
        bx: cx() + Math.cos(a) * d,
        by: cy() + Math.sin(a) * d,
        sz: orb ? 0.5 + Math.random() * 1.2 : 0.6 + Math.random() * 2.5,
        op: orb ? 0.12 + Math.random() * 0.25 : 0.03 + Math.random() * 0.1,
        c,
        dx: (Math.random() - 0.5) * 0.1,
        dy: (Math.random() - 0.5) * 0.1,
        ph: Math.random() * Math.PI * 2,
        orb,
        oa: a,
        od: d,
        os: 0.05 + Math.random() * 0.15,
        pp: Math.random() * Math.PI * 2,
      };
    }

    function initParticles() {
      particlesRef.current = [];
      for (let i = 0; i < 50; i++) {
        particlesRef.current.push(createParticle(i));
      }
    }

    function updateParticles(time: number) {
      const t = time * 0.001;
      const w = W(), h = H();
      const cxVal = w / 2, cyVal = h / 2;
      for (const p of particlesRef.current) {
        if (p.orb) {
          p.oa += p.os * 0.016;
          const tx = cxVal + Math.cos(p.oa) * p.od;
          const ty = cyVal + Math.sin(p.oa) * p.od;
          p.x += (tx - p.x) * 0.025;
          p.y += (ty - p.y) * 0.025;
          const br = 1 + Math.sin(t * 1.2 + p.ph) * 0.2;
          p.op = (0.12 + Math.sin(t * 1.8 + p.ph) * 0.08) * br;
          p.sz = (0.5 + Math.sin(t * 2.5 + p.pp) * 0.3) * br;
        } else {
          p.x += Math.sin(t * 0.8 + p.ph) * p.dx;
          p.y += Math.cos(t * 0.9 + p.ph) * p.dy;
          if (Math.hypot(p.x - p.bx, p.y - p.by) > 40) { p.dx *= -1; p.dy *= -1; }
          p.op = 0.03 + 0.07 * (0.5 + 0.5 * Math.sin(t * 1.2 + p.ph));
        }
      }
    }

    function drawParticles() {
      for (const p of particlesRef.current) {
        if (p.op <= 0.005) continue;
        ctx!.save();
        ctx!.globalAlpha = p.op;
        const [r, g, b] = p.c;
        ctx!.fillStyle = `rgb(${r},${g},${b})`;
        ctx!.shadowColor = `rgba(${r},${g},${b},0.25)`;
        ctx!.shadowBlur = p.sz * 4;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.sz, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }
    }

    function drawCenterGlow(progress: number) {
      if (progress <= 0) return;
      const p = Math.min(progress * 2, 1);
      const cxVal = cx(), cyVal = cy();

      for (let i = 0; i < 3; i++) {
        const d = i * 0.2;
        const rp = Math.max(0, Math.min((p - d) / (1 - d), 1));
        if (rp <= 0) continue;
        const radius = rp * 160;
        const a = (1 - rp) * 0.15 * (1 - i * 0.15);
        ctx!.save();
        ctx!.globalAlpha = a;
        ctx!.strokeStyle = `rgba(91,127,255,${0.15 + (1 - rp) * 0.15})`;
        ctx!.lineWidth = 1.2 - rp * 0.6;
        ctx!.shadowColor = 'rgba(91,127,255,0.1)';
        ctx!.shadowBlur = 12;
        ctx!.beginPath();
        ctx!.arc(cxVal, cyVal, radius, 0, Math.PI * 2);
        ctx!.stroke();
        ctx!.restore();
      }

      const dotA = Math.min(p * 3, 1) * (1 - Math.max(Math.min(progress * 1.2, 1) - 0.6, 0) * 2.5);
      if (dotA > 0.01) {
        ctx!.save();
        ctx!.globalAlpha = dotA;
        const grd = ctx!.createRadialGradient(cxVal, cyVal, 0, cxVal, cyVal, 20);
        grd.addColorStop(0, 'rgba(255,255,255,0.6)');
        grd.addColorStop(0.4, 'rgba(91,127,255,0.25)');
        grd.addColorStop(1, 'rgba(91,127,255,0)');
        ctx!.fillStyle = grd;
        ctx!.beginPath();
        ctx!.arc(cxVal, cyVal, 20, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }
    }

    function drawLines(progress: number) {
      if (progress <= 0) return;
      const cxVal = cx(), cyVal = cy();
      const nodes = [
        { x: cxVal - 60, y: cyVal - 45, color: COLORS.indigo },
        { x: cxVal - 60, y: cyVal - 15, color: COLORS.cyan },
        { x: cxVal - 60, y: cyVal + 15, color: COLORS.blue },
        { x: cxVal - 60, y: cyVal + 45, color: [74, 222, 128] as [number, number, number] },
      ];
      const e = Math.min(progress * 1.5, 1);
      const ease = (t: number) => 1 - Math.pow(1 - t, 4);
      const ep = ease(e);

      for (const n of nodes) {
        const ex = cxVal + (n.x - cxVal) * (1 - ep);
        const ey = cyVal + (n.y - cyVal) * (1 - ep);
        const [r, g, b] = n.color;
        const a = Math.min(ep * 2.5, 0.6) * (1 - Math.max(progress - 0.75, 0) * 3);

        ctx!.save();
        ctx!.globalAlpha = a * 0.3;
        ctx!.shadowColor = `rgba(${r},${g},${b},0.4)`;
        ctx!.shadowBlur = 15;
        ctx!.strokeStyle = `rgba(${r},${g},${b},0.15)`;
        ctx!.lineWidth = 2;
        ctx!.lineCap = 'round';
        ctx!.beginPath();
        ctx!.moveTo(n.x, n.y);
        ctx!.lineTo(ex, ey);
        ctx!.stroke();
        ctx!.restore();

        ctx!.save();
        ctx!.globalAlpha = a;
        ctx!.shadowColor = `rgba(${r},${g},${b},0.5)`;
        ctx!.shadowBlur = 8;
        ctx!.strokeStyle = `rgba(${Math.min(r + 40, 255)},${Math.min(g + 40, 255)},${Math.min(b + 40, 255)},0.7)`;
        ctx!.lineWidth = 0.8;
        ctx!.lineCap = 'round';
        ctx!.beginPath();
        ctx!.moveTo(n.x, n.y);
        ctx!.lineTo(ex, ey);
        ctx!.stroke();
        ctx!.restore();
      }
    }

    function getP(elapsed: number, start: number, dur: number) {
      return Math.max(0, Math.min((elapsed - start) / dur, 1));
    }

    function render(time: number) {
      if (!startTimeRef.current) startTimeRef.current = time;
      const elapsed = (time - startTimeRef.current) / 1000;

      ctx!.clearRect(0, 0, W(), H());
      updateParticles(time);

      // Screen 1: Center glow (0s - 1.2s)
      const s1 = getP(elapsed, 0, 1.2);
      drawCenterGlow(s1);

      // Screen 2: Lines (0.9s - 2.2s)
      const s2 = getP(elapsed, 0.9, 1.3);
      if (s2 > 0) drawLines(s2);

      drawParticles();
      rafRef.current = requestAnimationFrame(render);
    }

    resize();
    initParticles();
    startTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(render);

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // ─── Auto-dismiss after duration ───
  useEffect(() => {
    const alreadySeen = sessionStorage.getItem(SESSION_KEY);
    if (alreadySeen) {
      setVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setVisible(false);
        sessionStorage.setItem(SESSION_KEY, '1');
        router.push('/home');
      }, 600);
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, [router]);

  if (!visible) return null;

  return (
    <div
      ref={frameRef}
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{
        background: '#05080F',
        transition: 'opacity 0.6s ease',
        opacity: fadeOut ? 0 : 1,
      }}
    >
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 w-[85%] h-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(91,127,255,0.07) 0%, rgba(0,229,255,0.03) 30%, transparent 70%)',
            animation: 'sp-ambient-pulse 5s ease-in-out infinite',
          }}
        />
        <div
          className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0,229,255,0.04) 0%, transparent 70%)',
            animation: 'sp-ambient-drift 10s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }} />

      {/* Screen 1: Synchronizing text */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[3] text-center pointer-events-none"
        style={{
          animation: 'sp-fade-in-out 4.5s ease forwards',
        }}
      >
        <div
          className="text-[22px] font-light tracking-[0.3em] uppercase mb-1"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Synchronizing
        </div>
        <div
          className="text-[26px] font-bold tracking-[-0.5px]"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Your Life...
        </div>
      </div>

      {/* Logo + Sync Ring (appears later) */}
      <div
        className="absolute top-1/2 left-1/2 z-[5] pointer-events-none"
        style={{
          animation: 'sp-logo-appear 4.5s ease forwards',
        }}
      >
        {/* Sync ring */}
        <div
          className="absolute top-1/2 left-1/2 w-[200px] h-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            border: '1.5px solid transparent',
            background: 'conic-gradient(from 0deg, transparent, rgba(99,102,241,0.3), rgba(91,127,255,0.5), rgba(0,229,255,0.6), rgba(91,127,255,0.4), transparent 70%, transparent) border-box',
            WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            animation: 'sp-ring-spin 4s linear infinite, sp-ring-appear 4.5s ease forwards',
            opacity: 0,
          }}
        />

        {/* Logo glass */}
        <div
          className="relative w-[140px] h-[140px] rounded-[36px] flex items-center justify-center overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.035)',
            backdropFilter: 'blur(50px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(50px) saturate(1.6)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 40px rgba(99,102,241,0.12), 0 0 120px rgba(99,102,241,0.06), inset 0 1px 0 rgba(255,255,255,0.10)',
          }}
        >
          <div
            className="absolute inset-0 rounded-[36px] pointer-events-none z-[2]"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.14) 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.05) 100%)',
            }}
          />
          <img
            src="/icons/app-icon.png"
            alt="SelfSync"
            className="w-[110px] h-[110px] relative z-[3] rounded-[22px]"
            style={{
              filter: 'drop-shadow(0 0 30px rgba(99,102,241,0.35))',
              animation: 'sp-icon-glow 4s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* Final text */}
      <div
        className="absolute z-[6] text-center pointer-events-none"
        style={{
          top: 'calc(50% + 90px)',
          left: '50%',
          transform: 'translateX(-50%)',
          animation: 'sp-final-text 4.5s ease forwards',
          opacity: 0,
        }}
      >
        <div
          className="text-[32px] font-extrabold tracking-[-1px] mb-2 leading-tight"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0.65) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Self<span style={{
            background: 'linear-gradient(135deg, #6366f1, #5B7FFF, #00E5FF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Sync</span>
        </div>
        <div
          className="text-[11px] font-light tracking-[0.3em] uppercase"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          Organize. Focus. Grow.
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="absolute z-[6] text-center pointer-events-none"
        style={{
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '180px',
          animation: 'sp-progress-appear 4.5s ease forwards',
          opacity: 0,
        }}
      >
        <div
          className="w-full h-[2px] rounded-full overflow-hidden relative"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <div
            className="h-full rounded-full relative"
            style={{
              background: 'linear-gradient(90deg, #6366f1, #5B7FFF, #00E5FF)',
              animation: 'sp-progress-fill 1.5s ease-out 3s forwards',
              width: '0%',
            }}
          />
        </div>
        <span
          className="block mt-2 text-[11px] font-medium tracking-[0.06em] tabular-nums"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          Loading...
        </span>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes sp-ambient-pulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%,-50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%,-50%) scale(1.15); }
        }
        @keyframes sp-ambient-drift {
          0% { transform: translate(0,0); opacity: 0.2; }
          100% { transform: translate(-30px,40px); opacity: 0.5; }
        }
        @keyframes sp-fade-in-out {
          0% { opacity: 0; }
          8% { opacity: 1; }
          22% { opacity: 1; }
          30% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes sp-logo-appear {
          0%, 40% { opacity: 0; transform: translate(-50%,-50%) scale(0.4); }
          55% { opacity: 1; transform: translate(-50%,-50%) scale(1); }
          100% { opacity: 1; transform: translate(-50%,-50%) scale(1); }
        }
        @keyframes sp-ring-spin {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to { transform: translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes sp-ring-appear {
          0%, 40% { opacity: 0; }
          55% { opacity: 1; }
          100% { opacity: 1; }
        }
        @keyframes sp-final-text {
          0%, 60% { opacity: 0; transform: translateX(-50%) translateY(10px); }
          75% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes sp-progress-appear {
          0%, 65% { opacity: 0; }
          78% { opacity: 1; }
          100% { opacity: 1; }
        }
        @keyframes sp-progress-fill {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes sp-icon-glow {
          0%, 100% { filter: drop-shadow(0 0 30px rgba(99,102,241,0.3)); }
          50% { filter: drop-shadow(0 0 45px rgba(99,102,241,0.5)) drop-shadow(0 0 70px rgba(0,229,255,0.2)); }
        }
      `}</style>
    </div>
  );
}