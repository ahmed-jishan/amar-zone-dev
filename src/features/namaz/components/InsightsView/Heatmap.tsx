'use client';

import { useMemo, useState } from 'react';
import { formatLocalDateKey } from '../../utils/dateHelpers';
import { generateHeatmapData } from '../../utils/analyticsHelpers';
import type { DailyPrayerLog } from '../../types/prayer.types';

const DAY_LABELS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];

const HM_COLOR: Record<number, { bg: string; border: string }> = {
  0: { bg: 'var(--nz-accent-softer)', border: 'var(--nz-border)' },
  1: { bg: 'rgba(84,185,165,0.18)', border: 'rgba(84,185,165,0.24)' },
  2: { bg: 'rgba(84,185,165,0.34)', border: 'rgba(84,185,165,0.38)' },
  3: { bg: 'rgba(84,185,165,0.56)', border: 'rgba(84,185,165,0.62)' },
  4: { bg: 'rgba(23,123,106,0.78)', border: 'rgba(23,123,106,0.84)' },
  5: { bg: 'var(--nz-accent-strong)', border: 'var(--nz-accent-strong)' },
};

function Tooltip({ text }: { text: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 6px)',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--nz-surface-strong)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--nz-border)',
        borderRadius: 8,
        padding: '4px 9px',
        fontSize: 11,
        fontWeight: 500,
        color: 'var(--nz-text)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 20,
        boxShadow: 'var(--nz-shadow-soft)',
      }}
    >
      {text}
    </div>
  );
}

export default function Heatmap({ logs, month = new Date() }: { logs: Record<string, DailyPrayerLog>; month?: Date }) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const todayStr = formatLocalDateKey(new Date());
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startCol = new Date(year, monthIndex, 1).getDay();
  const totalCells = Math.ceil((startCol + daysInMonth) / 7) * 7;

  const heatmapData = useMemo(() => generateHeatmapData(logs, month), [logs, month]);
  const heatmapByDate = useMemo(
    () => new Map(heatmapData.map((day) => [day.date, day])),
    [heatmapData]
  );
  const stats = useMemo(() => {
    const loggedDays = heatmapData.filter((day) => day.completed > 0);
    const perfectDays = heatmapData.filter((day) => day.completionRate === 100).length;
    const avgDone = loggedDays.length
      ? (loggedDays.reduce((sum, day) => sum + day.completed, 0) / loggedDays.length).toFixed(1)
      : '—';
    return { perfectDays, avgDone };
  }, [heatmapData]);

  const monthName = new Date(year, monthIndex, 1).toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' });

  return (
    <div
      style={{
        background: 'var(--nz-card)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--nz-border)',
        borderRadius: 18,
        padding: '18px 18px 14px',
        boxShadow: 'var(--nz-shadow-soft)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--nz-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>
            মাসিক সম্পূর্ণতা
          </p>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--nz-text)' }}>{monthName}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { value: stats.perfectDays, label: 'পূর্ণ দিন' },
            { value: stats.avgDone, label: 'গড় / দিন' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                textAlign: 'center',
                background: 'var(--nz-soft)',
                border: '1px solid var(--nz-border)',
                borderRadius: 10,
                padding: '6px 10px',
              }}
            >
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--nz-text)' }}>{item.value}</p>
              <p style={{ fontSize: 9, color: 'var(--nz-muted)', marginTop: 1 }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 4 }}>
        {DAY_LABELS_BN.map((day) => (
          <div key={day} style={{ fontSize: 10, color: 'var(--nz-muted)', textAlign: 'center' }}>{day}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {Array.from({ length: totalCells }, (_, index) => {
          const dayIdx = index - startCol;
          if (dayIdx < 0 || dayIdx >= daysInMonth) return <div key={index} style={{ aspectRatio: '1' }} />;

          const day = dayIdx + 1;
          const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isFuture = dateStr > todayStr;
          const isToday = dateStr === todayStr;
          const dayData = heatmapByDate.get(dateStr);
          const count = isFuture ? -1 : dayData?.completed ?? 0;
          const completionRate = dayData?.completionRate ?? 0;
          const color = HM_COLOR[Math.max(0, count)];

          return (
            <div
              key={index}
              onMouseEnter={() => setHoveredDay(dayIdx)}
              onMouseLeave={() => setHoveredDay(null)}
              style={{
                aspectRatio: '1',
                borderRadius: 5,
                background: isFuture ? 'var(--nz-accent-softer)' : color.bg,
                border: isToday ? '2px solid var(--nz-accent-strong)' : `1px solid ${isFuture ? 'var(--nz-border)' : color.border}`,
                position: 'relative',
                cursor: 'default',
                transition: 'transform 0.1s',
              }}
              onMouseOver={(event) => { event.currentTarget.style.transform = 'scale(1.18)'; }}
              onMouseOut={(event) => { event.currentTarget.style.transform = 'scale(1)'; }}
            >
              {hoveredDay === dayIdx && (
                <Tooltip text={isFuture ? `${day} — আসেনি` : count === 0 ? `${day} — কোনো ডেটা নেই` : `${day} — ${completionRate}% সম্পূর্ণ`} />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 14, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 10, color: 'var(--nz-muted)' }}>কম</span>
        {[0, 1, 2, 3, 4, 5].map((value) => (
          <div key={value} style={{ width: 11, height: 11, borderRadius: 2, background: HM_COLOR[value].bg, border: `1px solid ${HM_COLOR[value].border}` }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--nz-muted)' }}>বেশি</span>
      </div>
    </div>
  );
}
