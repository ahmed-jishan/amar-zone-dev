'use client';

import { useMemo, useState } from 'react';
import { formatLocalDateKey, parseLocalDateKey } from '../../utils/dateHelpers';
import { generateConsistencyChartData } from '../../utils/analyticsHelpers';
import type { DailyPrayerLog, PrayerName, PrayerStatus } from '../../types/prayer.types';

const PRAYER_NAMES: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const isDone = (status: PrayerStatus) => status === 'onTime' || status === 'jamaat' || status === 'late';
const dateKey = (date: Date) => formatLocalDateKey(date);

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

function countDone(log?: DailyPrayerLog): number {
  if (!log) return 0;
  return PRAYER_NAMES.filter((prayer) => isDone(log[prayer]?.status || 'pending')).length;
}

export default function ConsistencyChart({ logs }: { logs: Record<string, DailyPrayerLog> }) {
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);

  const weekData = useMemo(() => {
    const weekMap: Record<string, string[]> = {};

    Object.keys(logs).forEach((key) => {
      const parsed = parseLocalDateKey(key);
      const day = parsed.getDay();
      const monday = new Date(parsed);
      monday.setDate(parsed.getDate() - ((day + 6) % 7));
      const weekStart = dateKey(monday);
      weekMap[weekStart] = [...(weekMap[weekStart] || []), key];
    });

    return Object.entries(weekMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([weekStart, days]) => {
        const totalSlots = days.length * PRAYER_NAMES.length;
        const done = days.reduce((sum, day) => sum + countDone(logs[day]), 0);
        const pct = totalSlots > 0 ? Math.round((done / totalSlots) * 100) : 0;
        const parsed = parseLocalDateKey(weekStart);
        const label = `${String(parsed.getDate()).padStart(2, '0')}/${String(parsed.getMonth() + 1).padStart(2, '0')}`;
        return { weekStart, label, pct };
      });
  }, [logs]);

  const consistencyData = useMemo(() => generateConsistencyChartData(logs), [logs]);

  const maxPct = weekData.length ? Math.max(...weekData.map((week) => week.pct), 1) : 100;
  const barColor = (pct: number) =>
    pct >= 80 ? 'var(--nz-accent-strong)' : pct >= 60 ? 'var(--nz-accent)' : pct >= 40 ? 'rgba(84,185,165,0.42)' : 'var(--nz-accent-soft)';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12 }}>
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
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--nz-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
          সাপ্তাহিক ধারাবাহিকতা
        </p>

        {weekData.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--nz-muted)', textAlign: 'center', padding: '24px 0' }}>পর্যাপ্ত ডেটা নেই</p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 130 }}>
              {weekData.map((week, index) => {
                const relH = Math.round((week.pct / maxPct) * 100);
                return (
                  <div
                    key={week.weekStart}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}
                    onMouseEnter={() => setHoveredWeek(index)}
                    onMouseLeave={() => setHoveredWeek(null)}
                  >
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--nz-muted)', opacity: hoveredWeek === index ? 1 : 0.6 }}>{week.pct}%</span>
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: `${relH}%`,
                        minHeight: 3,
                        background: barColor(week.pct),
                        borderRadius: '4px 4px 0 0',
                        opacity: hoveredWeek !== null && hoveredWeek !== index ? 0.45 : 1,
                      }}
                    >
                      {hoveredWeek === index && <Tooltip text={`${week.label} — ${week.pct}% সম্পূর্ণ`} />}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ height: 1, background: 'var(--nz-border)', margin: '4px 0 5px' }} />
            <div style={{ display: 'flex', gap: 6 }}>
              {weekData.map((week) => (
                <div key={week.weekStart} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: 'var(--nz-muted)' }}>{week.label}</div>
              ))}
            </div>
          </>
        )}
      </div>

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
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--nz-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
          ওয়াক্তভিত্তিক সময়মত আদায়
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {consistencyData.map((point) => (
            <div key={point.prayer}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--nz-text)' }}>{point.label}</span>
                <span style={{ fontSize: 11, color: 'var(--nz-muted)' }}>{point.percentage}%</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: 9,
                  borderRadius: 99,
                  overflow: 'hidden',
                  background: 'var(--nz-accent-softer)',
                  border: '1px solid var(--nz-border)'
                }}
              >
                <div
                  style={{
                    width: `${point.percentage}%`,
                    height: '100%',
                    borderRadius: 99,
                    background: point.percentage >= 80 ? 'var(--nz-accent-strong)' : point.percentage >= 50 ? 'var(--nz-accent)' : 'var(--nz-gold)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
