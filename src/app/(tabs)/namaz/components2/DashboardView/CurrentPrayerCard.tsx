// // app/(tabs)/namaz/components/DashboardView/CurrentPrayerCard.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { Clock, MapPin, ChevronRight, Moon, Sun, Cloud } from 'lucide-react';

// interface PrayerTimes {
//   Fajr: { adhan: string; jamaat: string; status: string };
//   Dhuhr: { adhan: string; jamaat: string; status: string };
//   Asr: { adhan: string; jamaat: string; status: string };
//   Maghrib: { adhan: string; jamaat: string; status: string };
//   Isha: { adhan: string; jamaat: string; status: string };
// }

// interface Props {
//   prayerTimes: PrayerTimes;
//   prayerStatuses: Record<string, string>;
// }

// const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// // Helper: Convert time string to minutes since midnight
// const timeToMinutes = (timeStr: string): number => {
//   const [hour, minute] = timeStr.split(':').map(Number);
//   return hour * 60 + minute;
// };

// // Get dynamic greeting and icon based on current time
// const getTimeBasedTheme = () => {
//   const hour = new Date().getHours();
//   if (hour >= 4 && hour < 11) return { greeting: 'সুবহে সাদিক', icon: <Sun size={24} />, gradient: 'from-amber-600 to-orange-700' };
//   if (hour >= 11 && hour < 16) return { greeting: 'যোহরের সময়', icon: <Sun size={24} />, gradient: 'from-yellow-500 to-orange-600' };
//   if (hour >= 16 && hour < 19) return { greeting: 'অপরাহ্ন', icon: <Cloud size={24} />, gradient: 'from-orange-400 to-red-500' };
//   if (hour >= 19 && hour < 20) return { greeting: 'সন্ধ্যা', icon: <Cloud size={24} />, gradient: 'from-purple-600 to-pink-600' };
//   return { greeting: 'রাতের ইবাদত', icon: <Moon size={24} />, gradient: 'from-indigo-800 to-purple-900' };
// };

// export default function CurrentPrayerCard({ prayerTimes, prayerStatuses }: Props) {
//   const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; remaining: string } | null>(null);
//   const [currentTime, setCurrentTime] = useState(new Date());
//   const theme = getTimeBasedTheme();

//   // Update countdown every second
//   useEffect(() => {
//     const updateNextPrayer = () => {
//       const now = new Date();
//       setCurrentTime(now);
//       const nowMinutes = now.getHours() * 60 + now.getMinutes();

//       let found = null;
//       for (const prayer of prayerOrder) {
//         const prayerTime = prayerTimes[prayer as keyof PrayerTimes].adhan;
//         const prayerMinutes = timeToMinutes(prayerTime);
//         const isCompleted = prayerStatuses[prayer] === 'onTime' || prayerStatuses[prayer] === 'late' || prayerStatuses[prayer] === 'jamaat';
        
//         if (prayerMinutes > nowMinutes && !isCompleted) {
//           const diffMinutes = prayerMinutes - nowMinutes;
//           const hours = Math.floor(diffMinutes / 60);
//           const minutes = diffMinutes % 60;
//           const remaining = hours > 0 ? `${hours} ঘ ${minutes} মি` : `${minutes} মিনিট`;
//           found = { name: prayer, time: prayerTime, remaining };
//           break;
//         }
//       }

//       if (!found) {
//         // Next is tomorrow's Fajr
//         const fajrTime = prayerTimes.Fajr.adhan;
//         const fajrMinutes = timeToMinutes(fajrTime);
//         const tomorrowFajr = fajrMinutes + 24 * 60;
//         const diffMinutes = tomorrowFajr - nowMinutes;
//         const hours = Math.floor(diffMinutes / 60);
//         const minutes = diffMinutes % 60;
//         const remaining = hours > 0 ? `${hours} ঘ ${minutes} মি` : `${minutes} মিনিট`;
//         found = { name: 'ফজর (কাল)', time: fajrTime, remaining };
//       }

//       setNextPrayer(found);
//     };

//     updateNextPrayer();
//     const interval = setInterval(updateNextPrayer, 1000);
//     return () => clearInterval(interval);
//   }, [prayerTimes, prayerStatuses]);

//   if (!nextPrayer) return null;

//   return (
//     <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${theme.gradient} text-white shadow-xl transition-all duration-500`}>
//       {/* Islamic geometric pattern */}
//       <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
//         <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
//           <path d="M50 5L95 50L50 95L5 50L50 5z" stroke="currentColor" strokeWidth="1" />
//           <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="1" />
//           <path d="M50 15 L85 50 L50 85 L15 50 L50 15z" stroke="currentColor" strokeWidth="0.5" />
//         </svg>
//       </div>
      
//       <div className="relative p-6">
//         <div className="flex justify-between items-start">
//           <div>
//             <p className="text-white/80 text-sm font-medium tracking-wide flex items-center gap-1">
//               {theme.icon}
//               <span className="ml-1">{theme.greeting}</span>
//             </p>
//             <h2 className="text-3xl font-bold mt-2 font-amiri">{nextPrayer.name}</h2>
//             <div className="flex items-center gap-2 mt-1 text-white/90">
//               <Clock size={16} />
//               <span className="text-xl font-mono">{nextPrayer.time}</span>
//             </div>
//           </div>
//           <div className="text-right">
//             <p className="text-white/70 text-xs">বাকি সময়</p>
//             <p className="text-2xl font-bold tracking-tighter">{nextPrayer.remaining}</p>
//           </div>
//         </div>
        
//         <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-white/80 text-sm">
//           <div className="flex items-center gap-1">
//             <MapPin size={14} />
//             <span>ঢাকা, বাংলাদেশ</span>
//           </div>
//           <div className="flex items-center gap-1">
//             <span>{new Date().toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
//             <ChevronRight size={14} />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock, MapPin } from 'lucide-react';

interface PrayerEntry {
  adhan: string;
  jamaat: string;
  status: string;
}

interface PrayerTimes {
  Fajr:    PrayerEntry;
  Dhuhr:   PrayerEntry;
  Asr:     PrayerEntry;
  Maghrib: PrayerEntry;
  Isha:    PrayerEntry;
}

interface Props {
  prayerTimes: PrayerTimes;
  prayerStatuses: Record<string, string>;
}

const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
const PRAYER_LABELS: Record<string, string> = {
  Fajr: 'ফজর', Dhuhr: 'যোহর', Asr: 'আসর', Maghrib: 'মাগরিব', Isha: 'এশা',
};

const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
const toBN = (n: number | string) =>
  String(n).split('').map(d => BN_DIGITS[Number(d)] ?? d).join('');
const pad2 = (n: number) => toBN(String(n).padStart(2, '0'));

const toMins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const isDone = (status: string) =>
  status === 'onTime' || status === 'late' || status === 'jamaat';

// Arc circumference for r=22
const CIRC = 2 * Math.PI * 22; // ≈ 138.23

export default function CurrentPrayerCard({ prayerTimes, prayerStatuses }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const nowMins = now.getHours() * 60 + now.getMinutes();

  /** Find the next upcoming prayer */
  const { nextName, nextIdx, isTomorrow } = useMemo(() => {
    for (let i = 0; i < PRAYER_ORDER.length; i++) {
      const name = PRAYER_ORDER[i];
      const pm = toMins(prayerTimes[name].adhan);
      if (pm > nowMins && !isDone(prayerStatuses[name])) {
        return { nextName: name, nextIdx: i, isTomorrow: false };
      }
    }
    return { nextName: 'Fajr' as const, nextIdx: 0, isTomorrow: true };
  }, [nowMins, prayerStatuses, prayerTimes]);

  const nextEntry = prayerTimes[nextName];

  /** Countdown in seconds */
  const countdownSec = useMemo(() => {
    const targetMins = toMins(nextEntry.adhan) + (isTomorrow ? 1440 : 0);
    return Math.max(0, (targetMins - nowMins) * 60 - now.getSeconds());
  }, [nextEntry, isTomorrow, nowMins, now]);

  const cdH = Math.floor(countdownSec / 3600);
  const cdM = Math.floor((countdownSec % 3600) / 60);
  const cdS = countdownSec % 60;

  /** Arc progress: fraction elapsed between prev and next prayer */
  const arcOffset = useMemo(() => {
    const prevIdx = (nextIdx - 1 + PRAYER_ORDER.length) % PRAYER_ORDER.length;
    const prevMins = toMins(prayerTimes[PRAYER_ORDER[prevIdx]].adhan) +
      (nextIdx === 0 ? -1440 : 0);
    const nextMins = toMins(nextEntry.adhan) + (isTomorrow ? 1440 : 0);
    const span = nextMins - prevMins;
    const elapsed = nowMins - prevMins;
    const pct = Math.min(1, Math.max(0, elapsed / span));
    return CIRC * (1 - pct);
  }, [nextIdx, nextEntry, isTomorrow, nowMins, prayerTimes]);

  const arcPct = Math.round((1 - arcOffset / CIRC) * 100);

  /** Bengaili date */
  const dateBN = useMemo(() => {
    const days = ['রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার','শনিবার'];
    const months = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
    return `${days[now.getDay()]}, ${toBN(now.getDate())} ${months[now.getMonth()]}`;
  }, [now]);

  return (
    <div
      className="relative rounded-[24px] overflow-hidden"
      style={{
        background: '#fff',
        border: '1px solid rgba(16,185,129,0.15)',
        boxShadow:
          '0 8px 40px rgba(5,150,105,0.1), 0 2px 8px rgba(5,150,105,0.06)',
      }}
    >
      {/* ── TOP PANEL ─────────────────────────────────────────────── */}
      <div
        className="relative px-6 pt-6 pb-5 overflow-hidden"
        style={{
          background:
            'linear-gradient(145deg,#065742 0%,#0a6b50 40%,#0f766e 100%)',
        }}
      >
        {/* Islamic geometric motif */}
        <svg
          className="absolute -top-4 -right-4 opacity-[0.12] pointer-events-none"
          width="160" height="160" viewBox="0 0 160 160" fill="none"
          aria-hidden
        >
          <path d="M80 8L152 80L80 152L8 80L80 8z" stroke="white" strokeWidth="1.2" />
          <path d="M80 28L132 80L80 132L28 80L80 28z" stroke="white" strokeWidth="0.8" />
          <circle cx="80" cy="80" r="30" stroke="white" strokeWidth="0.8" />
          <path d="M80 50L110 80L80 110L50 80L80 50z" stroke="white" strokeWidth="0.6" />
          <circle cx="80" cy="80" r="8" stroke="white" strokeWidth="0.6" />
          <line x1="80" y1="8" x2="80" y2="152" stroke="white" strokeWidth="0.4" />
          <line x1="8" y1="80" x2="152" y2="80" stroke="white" strokeWidth="0.4" />
        </svg>

        {/* Dot-grid accent */}
        <div
          className="absolute left-0 bottom-0 w-28 h-16 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle,#fff 1px,transparent 1px)',
            backgroundSize: '10px 10px',
          }}
          aria-hidden
        />

        {/* Badge */}
        <div
          className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full text-[12px] font-medium"
          style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.88)',
          }}
        >
          <Clock size={12} />
          {isTomorrow ? 'কাল ফজর' : 'পরবর্তী নামাজ'}
        </div>

        {/* Prayer name */}
        <h2
          className="text-white mb-1 leading-none"
          style={{
            fontFamily: "'Amiri', serif",
            fontSize: 42,
            fontWeight: 700,
            letterSpacing: '-0.5px',
          }}
        >
          {PRAYER_LABELS[nextName]}
        </h2>

        {/* Adhan / Jamaat row */}
        <div
          className="flex items-center gap-2 mb-5"
          style={{ color: 'rgba(255,255,255,0.72)', fontSize: 14, fontWeight: 500 }}
        >
          <Clock size={13} />
          <span>আযান</span>
          <span className="text-white font-semibold text-lg tracking-wide" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {nextEntry.adhan}
          </span>
          <span className="opacity-50">·</span>
          <span>জামাত</span>
          <span className="text-white font-semibold text-lg tracking-wide" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {nextEntry.jamaat}
          </span>
        </div>

        {/* Countdown strip */}
        <div
          className="flex items-center justify-between rounded-[14px] px-4 py-3"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.14)',
          }}
        >
          {/* HH : MM : SS blocks */}
          <div className="flex items-center gap-2">
            {[
              { val: cdH, label: 'ঘণ্টা' },
              { val: cdM, label: 'মিনিট' },
              { val: cdS, label: 'সেকেন্ড' },
            ].map((block, i) => (
              <div key={i} className="flex items-center gap-2">
                {i > 0 && (
                  <span
                    className="text-2xl pb-3 leading-none"
                    style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}
                  >
                    :
                  </span>
                )}
                <div className="text-center">
                  <div
                    className="text-white font-semibold leading-none"
                    style={{ fontSize: 28, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px' }}
                  >
                    {pad2(block.val)}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                    {block.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Arc progress */}
          <svg width="54" height="54" viewBox="0 0 54 54" fill="none" aria-label={`${arcPct}% সম্পন্ন`}>
            <circle cx="27" cy="27" r="22" stroke="rgba(255,255,255,0.18)" strokeWidth="3" />
            <circle
              cx="27" cy="27" r="22"
              stroke="white" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={arcOffset}
              transform="rotate(-90 27 27)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
            <text
              x="27" y="31"
              textAnchor="middle"
              fontFamily="'Plus Jakarta Sans',sans-serif"
              fontSize="11"
              fontWeight="600"
              fill="rgba(255,255,255,0.9)"
            >
              {toBN(arcPct)}%
            </text>
          </svg>
        </div>
      </div>

      {/* ── PRAYER PILLS STRIP ────────────────────────────────────── */}
      <div
        className="flex gap-1.5 px-5 py-4 overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {PRAYER_ORDER.map((name, i) => {
          const pm = toMins(prayerTimes[name].adhan);
          const done = pm < nowMins || isDone(prayerStatuses[name]);
          const isNext = i === nextIdx;
          return (
            <div
              key={name}
              className="flex flex-col items-center gap-1 flex-shrink-0 rounded-xl px-3 py-2"
              style={{
                minWidth: 60,
                border: isNext
                  ? '1px solid rgba(5,150,105,0.3)'
                  : '1px solid rgba(6,87,66,0.1)',
                background: isNext
                  ? 'rgba(5,150,105,0.09)'
                  : 'rgba(236,253,245,0.6)',
                opacity: done && !isNext ? 0.5 : 1,
              }}
            >
              <span
                style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
                  color: '#4b7a66', textTransform: 'uppercase',
                }}
              >
                {name}
              </span>
              <div
                className="rounded-full"
                style={{
                  width: 5, height: 5,
                  background: isNext ? '#059669' : done ? '#059669' : '#d1fae5',
                  boxShadow: isNext ? '0 0 0 3px rgba(5,150,105,0.18)' : 'none',
                }}
              />
              <span
                style={{
                  fontSize: 12, fontWeight: 600,
                  color: '#065742', fontVariantNumeric: 'tabular-nums',
                }}
              >
                {prayerTimes[name].adhan}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── BOTTOM BAR ────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 py-3"
        style={{ borderTop: '1px solid rgba(6,87,66,0.08)' }}
      >
        <div className="flex items-center gap-1.5" style={{ fontSize: 13, color: '#4b7a66', fontWeight: 500 }}>
          <MapPin size={14} />
          ঢাকা, বাংলাদেশ
        </div>
        <div style={{ fontSize: 12, color: '#7aab96', fontWeight: 500 }}>
          {dateBN}
        </div>
      </div>
    </div>
  );
}