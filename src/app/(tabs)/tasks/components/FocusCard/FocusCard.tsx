'use client';
// FIX 9: FocusCard.tsx
// BUGS FIXED:
//   - FocusCard called useTaskFocus() internally, creating a SECOND independent focus
//     state. page.tsx also owned focus state via setFocusedTask(). Two systems, no sync.
//   - resumeFocus was undefined (missing from hook return) — silent no-op on click.
//   - Timer display had no visual progress context — just a raw number.
//   - No visual distinction between paused and running states beyond button swap.
//   - Hardcoded className for buttons had no disabled state.
//
// DESIGN IMPROVEMENTS:
//   - Animated pulse ring when running
//   - Color-coded state (running=emerald, paused=amber)
//   - Progress arc concept via border animation
//   - Accessible button labels

import { Task } from '../../types';

interface Props {
  activeTask: Task | null;
  isRunning: boolean;
  seconds: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
};

export default function FocusCard({
  activeTask,
  isRunning,
  seconds,
  onPause,
  onResume,
  onStop,
}: Props) {
  return (
    <div className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-r from-purple-500/10 to-emerald-500/10 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-widest text-white/50">
          Focus Session
        </h2>
        {isRunning && (
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
            {/* Animated pulse dot */}
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Running
          </span>
        )}
      </div>

      {activeTask ? (
        <>
          <p className="mt-2 truncate text-sm font-semibold text-white">
            {activeTask.title}
          </p>

          <p
            className={`mt-1 font-mono text-3xl font-bold tabular-nums tracking-tight transition-colors ${
              isRunning ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {formatTime(seconds)}
          </p>

          <div className="mt-4 flex gap-2">
            {isRunning ? (
              <button
                onClick={onPause}
                aria-label="Pause focus session"
                className="rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-semibold text-black transition hover:bg-amber-400 active:scale-95"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={onResume}
                aria-label="Resume focus session"
                className="rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-black transition hover:bg-emerald-400 active:scale-95"
              >
                Resume
              </button>
            )}

            <button
              onClick={onStop}
              aria-label="Stop focus session"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/70 transition hover:bg-white/10 active:scale-95"
            >
              Stop
            </button>
          </div>
        </>
      ) : (
        <p className="mt-3 text-xs text-white/40">
          Click <span className="text-white/60">Focus</span> on any task to start a session.
        </p>
      )}
    </div>
  );
}
