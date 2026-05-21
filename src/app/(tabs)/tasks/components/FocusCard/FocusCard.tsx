'use client';
import { Task } from '../../types';

interface Props {
  activeTask: Task | null;
  isRunning: boolean;
  seconds: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60), r = s % 60;
  return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;
};

export default function FocusCard({ activeTask, isRunning, seconds, onPause, onResume, onStop }: Props) {
  if (!activeTask) return null;
  const MAX = 25 * 60;
  const RADIUS = 36, CIRC = 2 * Math.PI * RADIUS;
  const offset = CIRC * (1 - Math.min(seconds / MAX, 1));
  const timerColor = isRunning ? 'var(--az-success)' : 'var(--az-warn)';

  return (
    <>
      <div className="az-focus-card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:'var(--az-text-2)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
            <span className={`az-dot ${isRunning ? 'az-dot--live' : ''}`}/>
            {isRunning ? 'Focus session' : 'Paused'}
          </div>
          <button className="az-focus-stop" onClick={onStop}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            End
          </button>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ position:'relative', width:88, height:88, flexShrink:0 }}>
            <svg width="88" height="88" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r={RADIUS} fill="none" stroke="var(--az-surface-2)" strokeWidth="5"/>
              <circle cx="44" cy="44" r={RADIUS} fill="none" stroke={timerColor} strokeWidth="5"
                strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset}
                style={{ transform:'rotate(-90deg)', transformOrigin:'50% 50%', transition:'stroke-dashoffset 1s linear, stroke 0.3s' }}/>
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:16, fontWeight:700, fontVariantNumeric:'tabular-nums', color:timerColor, letterSpacing:'-0.02em' }}>{fmt(seconds)}</span>
            </div>
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:11, color:'var(--az-text-3)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 4px' }}>Working on</p>
            <p style={{ fontSize:14, fontWeight:600, color:'var(--az-text-1)', margin:'0 0 12px', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{activeTask.title}</p>
            <div style={{ display:'flex', gap:8 }}>
              {isRunning
                ? <button className="az-focus-btn az-focus-btn--pause" onClick={onPause}>⏸ Pause</button>
                : <button className="az-focus-btn az-focus-btn--resume" onClick={onResume}>▶ Resume</button>
              }
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .az-focus-card { background:var(--az-surface-1); border:1px solid var(--az-border); border-radius:18px; padding:16px; margin-bottom:16px; }
        .az-dot { width:7px; height:7px; border-radius:50%; background:var(--az-text-3); display:inline-block; flex-shrink:0; }
        .az-dot--live { background:var(--az-success); animation:azpulse 1.5s ease-in-out infinite; }
        @keyframes azpulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }
        .az-focus-stop { display:flex; align-items:center; gap:5px; font-size:12px; font-weight:500; color:var(--az-text-3); background:var(--az-surface-2); border:1px solid var(--az-border); border-radius:8px; padding:5px 10px; cursor:pointer; transition:all .15s; }
        .az-focus-stop:hover { color:var(--az-danger); border-color:var(--az-danger-border); }
        .az-focus-btn { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:600; border-radius:10px; padding:8px 16px; border:none; cursor:pointer; transition:all .15s; }
        .az-focus-btn:active { transform:scale(.97); }
        .az-focus-btn--pause  { background:var(--az-surface-2); color:var(--az-warn); border:1px solid var(--az-border); }
        .az-focus-btn--resume { background:var(--az-success-bg); color:var(--az-success); border:1px solid var(--az-success-border); }
      `}</style>
    </>
  );
}
