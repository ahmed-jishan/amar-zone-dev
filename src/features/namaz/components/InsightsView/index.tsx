'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, CalendarDays, Activity, Target, Sparkles } from 'lucide-react';
import { useLogsStore } from '../../store/logsStore';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { generateWeaknessInsights, generateHeatmapData, generateConsistencyChartData } from '../../utils/analyticsHelpers';
import { calculateCurrentStreak } from '../../utils/streakCalculator';
import { PRAYER_NAME_LABELS } from '../../constants/prayerNames';
import type { PrayerName, PrayerStatus } from '../../types/prayer.types';
import '@/features/namaz/namaz-premium.css';

const PRAYER_NAMES: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const DONE: PrayerStatus[] = ['onTime', 'jamaat', 'late'];
const RING_CIRCUMFERENCE = 2 * Math.PI * 24; // r=24

function getGreeting(language: 'bn' | 'en'): string {
  const hour = new Date().getHours();
  if (hour < 12) return language === 'bn' ? 'সুপ্রভাত' : 'Good Morning';
  if (hour < 17) return language === 'bn' ? 'শুভ অপরাহ্ন' : 'Good Afternoon';
  return language === 'bn' ? 'শুভ সন্ধ্যা' : 'Good Evening';
}

function getMonthName(date: Date, language: 'bn' | 'en'): string {
  return date.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' });
}

function PrayerRing({ pct, color }: { pct: number; color: string }) {
  const offset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * pct) / 100;
  return (
    <div className="np-prayer-ring-wrap">
      <svg className="np-prayer-ring-svg" viewBox="0 0 54 54">
        <circle className="np-prayer-ring-bg" cx="27" cy="27" r="24" />
        <circle
          className="np-prayer-ring-fill"
          cx="27" cy="27" r="24"
          stroke={color}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="np-prayer-ring-center">
        <span className="np-prayer-ring-pct">{pct}%</span>
      </div>
    </div>
  );
}

function HeroCard({
  streak,
  completionRate,
  totalDays,
  bestPrayer,
  language,
}: {
  streak: number;
  completionRate: number;
  totalDays: number;
  bestPrayer: string;
  language: 'bn' | 'en';
}) {
  const greeting = getGreeting(language);
  const streakOffset = 188.5 - (188.5 * Math.min(streak / 365, 1));

  return (
    <div className="np-hero-card np-surface">
      {/* SVG defs for hero ring gradient */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <linearGradient id="np-hero-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--st-accent, #7c8cff)" />
            <stop offset="100%" stopColor="var(--st-accent-2, #a5b1ff)" />
          </linearGradient>
        </defs>
      </svg>

      <div className="np-hero-top">
        <div className="np-hero-greeting">
          <span className="np-hero-greeting-text">
            {greeting} 👋
          </span>
          <span className="np-hero-greeting-sub">
            {language === 'bn' ? 'আপনার নামাজের অগ্রগতি' : 'Your prayer progress'}
          </span>
        </div>
        <div className="np-hero-ring-wrap">
          <svg className="np-hero-ring-svg" viewBox="0 0 65 65">
            <circle className="np-hero-ring-bg" cx="32.5" cy="32.5" r="30" />
            <circle
              className="np-hero-ring-fill"
              cx="32.5" cy="32.5" r="30"
              strokeDasharray={188.5}
              strokeDashoffset={streakOffset}
            />
          </svg>
          <div className="np-hero-ring-center">
            <span className="np-hero-ring-number">{streak}</span>
            <span className="np-hero-ring-label">
              {language === 'bn' ? 'দিন' : 'days'}
            </span>
          </div>
        </div>
      </div>

      <div className="np-hero-stats">
        <div className="np-hero-stat">
          <div className="np-hero-stat-value">{completionRate}%</div>
          <div className="np-hero-stat-label">
            {language === 'bn' ? 'সম্পূর্ণতা' : 'Completion'}
          </div>
        </div>
        <div className="np-hero-stat">
          <div className="np-hero-stat-value">{totalDays}</div>
          <div className="np-hero-stat-label">
            {language === 'bn' ? 'মোট দিন' : 'Total days'}
          </div>
        </div>
        <div className="np-hero-stat">
          <div className="np-hero-stat-value" style={{ fontSize: 14, fontWeight: 700 }}>
            {bestPrayer || (language === 'bn' ? '—' : '—')}
          </div>
          <div className="np-hero-stat-label">
            {language === 'bn' ? 'সেরা' : 'Best'}
          </div>
        </div>
      </div>
    </div>
  );
}

function PrayerBreakdownGrid({
  logs,
  month,
  language,
}: {
  logs: Record<string, any>;
  month: Date;
  language: 'bn' | 'en';
}) {
  const heatmapData = useMemo(() => generateHeatmapData(logs, month), [logs, month]);

  const prayerStats = useMemo(() => {
    const stats = new Map<PrayerName, { onTime: number; late: number; missed: number; total: number }>();
    PRAYER_NAMES.forEach((p) => stats.set(p, { onTime: 0, late: 0, missed: 0, total: 0 }));

    Object.entries(logs).forEach(([dateKey, log]) => {
      const parsed = new Date(dateKey);
      if (parsed.getFullYear() !== month.getFullYear() || parsed.getMonth() !== month.getMonth()) return;
      PRAYER_NAMES.forEach((prayer) => {
        const status = log[prayer]?.status || 'pending';
        if (status === 'pending') return;
        const s = stats.get(prayer)!;
        s.total += 1;
        if (status === 'onTime' || status === 'jamaat') s.onTime += 1;
        else if (status === 'late') s.late += 1;
        else if (status === 'missed') s.missed += 1;
      });
    });

    return stats;
  }, [logs, month]);

  const getColor = (pct: number) =>
    pct >= 80 ? 'var(--st-success, #34d399)' : pct >= 60 ? 'var(--st-accent, #7c8cff)' : pct >= 40 ? 'var(--st-gold, #c9a84c)' : 'var(--st-danger, #f87171)';

  return (
    <div className="np-section">
      <div className="np-section-head">
        <div className="np-section-icon">
          <Activity size={16} />
        </div>
        <span className="np-section-title">
          {language === 'bn' ? 'প্রতি ওয়াক্তের অগ্রগতি' : 'Prayer-wise Progress'}
        </span>
      </div>
      <div className="np-prayer-grid">
        {PRAYER_NAMES.map((prayer) => {
          const stats = prayerStats.get(prayer)!;
          const pct = stats.total > 0 ? Math.round((stats.onTime / stats.total) * 100) : 0;
          const color = getColor(pct);
          return (
            <motion.div
              key={prayer}
              className="np-prayer-item"
              whileTap={{ scale: 0.93 }}
            >
              <PrayerRing pct={pct} color={color} />
              <span className="np-prayer-name">
                {language === 'bn' ? PRAYER_NAME_LABELS[prayer].bn : PRAYER_NAME_LABELS[prayer].en}
              </span>
              <div className="np-prayer-breakdown">
                {stats.total > 0 && (
                  <>
                    <span className="np-prayer-dot np-prayer-dot--onTime" />
                    <span className="np-prayer-dot-label">{stats.onTime}</span>
                    {stats.late > 0 && (
                      <>
                        <span className="np-prayer-dot np-prayer-dot--late" />
                        <span className="np-prayer-dot-label">{stats.late}</span>
                      </>
                    )}
                    {stats.missed > 0 && (
                      <>
                        <span className="np-prayer-dot np-prayer-dot--missed" />
                        <span className="np-prayer-dot-label">{stats.missed}</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function PremiumHeatmap({ logs, month, language }: { logs: Record<string, any>; month: Date; language: 'bn' | 'en' }) {
  const heatmapData = useMemo(() => generateHeatmapData(logs, month), [logs, month]);
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startCol = new Date(year, monthIndex, 1).getDay();
  const totalCells = Math.ceil((startCol + daysInMonth) / 7) * 7;
  const todayStr = new Date().toISOString().split('T')[0];
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const heatmapByDate = useMemo(() => new Map(heatmapData.map((d) => [d.date, d])), [heatmapData]);

  const stats = useMemo(() => {
    const logged = heatmapData.filter((d) => d.completed > 0);
    const perfect = heatmapData.filter((d) => d.completionRate === 100).length;
    const avg = logged.length ? (logged.reduce((s, d) => s + d.completed, 0) / logged.length).toFixed(1) : '—';
    return { perfectDays: perfect, avgDone: avg };
  }, [heatmapData]);

  const monthName = getMonthName(month, language);
  const DAY_LABELS = language === 'bn'
    ? ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const HM_COLOR: Record<number, { bg: string; border: string }> = {
    0: { bg: 'var(--st-surface-2, #12151b)', border: 'var(--st-border, rgba(255,255,255,0.05))' },
    1: { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.20)' },
    2: { bg: 'rgba(52,211,153,0.30)', border: 'rgba(52,211,153,0.35)' },
    3: { bg: 'rgba(52,211,153,0.50)', border: 'rgba(52,211,153,0.55)' },
    4: { bg: 'rgba(16,185,129,0.75)', border: 'rgba(16,185,129,0.80)' },
    5: { bg: 'var(--st-success, #34d399)', border: 'var(--st-success, #34d399)' },
  };

  return (
    <div className="np-chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <p className="np-chart-title">
            {language === 'bn' ? 'মাসিক সম্পূর্ণতা' : 'Monthly Completion'}
          </p>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--st-text-1, #f0f0f6)' }}>{monthName}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { value: stats.perfectDays, label: language === 'bn' ? 'পূর্ণ দিন' : 'Perfect' },
            { value: stats.avgDone, label: language === 'bn' ? 'গড়/দিন' : 'Avg/day' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                textAlign: 'center',
                background: 'var(--st-surface-2, #12151b)',
                border: '1px solid var(--st-border, rgba(255,255,255,0.05))',
                borderRadius: 10,
                padding: '6px 10px',
              }}
            >
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--st-text-1, #f0f0f6)' }}>{item.value}</p>
              <p style={{ fontSize: 9, color: 'var(--st-text-3, #5c5e72)', marginTop: 1 }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 4 }}>
        {DAY_LABELS.map((day) => (
          <div key={day} style={{ fontSize: 10, color: 'var(--st-text-3, #5c5e72)', textAlign: 'center', fontWeight: 600 }}>{day}</div>
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
                background: isFuture ? 'var(--st-surface-2, #12151b)' : color.bg,
                border: isToday ? '2px solid var(--st-accent, #7c8cff)' : `1px solid ${isFuture ? 'var(--st-border, rgba(255,255,255,0.05))' : color.border}`,
                position: 'relative',
                cursor: 'default',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; e.currentTarget.style.boxShadow = 'var(--st-shadow-md, 0 4px 14px rgba(0,0,0,0.55))'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {hoveredDay === dayIdx && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 6px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--st-surface-3, #181c24)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid var(--st-border, rgba(255,255,255,0.05))',
                    borderRadius: 8,
                    padding: '4px 9px',
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--st-text-1, #f0f0f6)',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    zIndex: 20,
                    boxShadow: 'var(--st-shadow-md, 0 4px 14px rgba(0,0,0,0.55))',
                  }}
                >
                  {isFuture
                    ? `${day} — ${language === 'bn' ? 'আসেনি' : 'Future'}`
                    : count === 0
                    ? `${day} — ${language === 'bn' ? 'কোনো ডেটা নেই' : 'No data'}`
                    : `${day} — ${completionRate}% ${language === 'bn' ? 'সম্পূর্ণ' : 'complete'}`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 14, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 10, color: 'var(--st-text-3, #5c5e72)' }}>
          {language === 'bn' ? 'কম' : 'Less'}
        </span>
        {[0, 1, 2, 3, 4, 5].map((value) => (
          <div key={value} style={{ width: 11, height: 11, borderRadius: 2, background: HM_COLOR[value].bg, border: `1px solid ${HM_COLOR[value].border}` }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--st-text-3, #5c5e72)' }}>
          {language === 'bn' ? 'বেশি' : 'More'}
        </span>
      </div>
    </div>
  );
}

function PremiumConsistencyChart({ logs, language }: { logs: Record<string, any>; language: 'bn' | 'en' }) {
  const consistencyData = useMemo(() => generateConsistencyChartData(logs), [logs]);

  return (
    <div className="np-chart-card">
      <p className="np-chart-title">
        {language === 'bn' ? 'ওয়াক্তভিত্তিক সময়মত আদায়' : 'Prayer-wise On-Time Rate'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {consistencyData.map((point) => (
          <div key={point.prayer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--st-text-1, #f0f0f6)' }}>
                {language === 'bn' ? PRAYER_NAME_LABELS[point.prayer].bn : PRAYER_NAME_LABELS[point.prayer].en}
              </span>
              <span style={{ fontSize: 11, color: 'var(--st-text-3, #5c5e72)' }}>{point.percentage}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: 10,
                borderRadius: 99,
                overflow: 'hidden',
                background: 'var(--st-surface-2, #12151b)',
                border: '1px solid var(--st-border, rgba(255,255,255,0.05))',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${point.percentage}%` }}
                transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                style={{
                  height: '100%',
                  borderRadius: 99,
                  background: point.percentage >= 80
                    ? 'var(--st-success, #34d399)'
                    : point.percentage >= 50
                    ? 'var(--st-accent, #7c8cff)'
                    : 'var(--st-gold, #c9a84c)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InsightsView() {
  const logs = useLogsStore((state) => state.logs);
  const { language } = useSettingsStore();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const monthDate = useMemo(() => new Date(selectedMonth + '-01'), [selectedMonth]);
  const insights = useMemo(() => generateWeaknessInsights(logs, monthDate), [logs, monthDate]);
  const streak = useMemo(() => calculateCurrentStreak(logs), [logs]);

  const hasData = Object.keys(logs).length > 0;
  const bestPrayerName = hasData && insights.bestPrayer
    ? (language === 'bn' ? PRAYER_NAME_LABELS[insights.bestPrayer].bn : PRAYER_NAME_LABELS[insights.bestPrayer].en)
    : null;

  return (
    <div className="np-root" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* SVG Defs */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <linearGradient id="np-hero-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--st-accent, #7c8cff)" />
            <stop offset="100%" stopColor="var(--st-accent-2, #a5b1ff)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Month Picker */}
      <div className="np-month-picker" style={{ alignSelf: 'flex-start' }}>
        <CalendarDays size={14} style={{ color: 'var(--st-text-3, #5c5e72)' }} />
        <label htmlFor="np-month">
          {language === 'bn' ? 'মাস' : 'Month'}
        </label>
        <input
          id="np-month"
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />
      </div>

      {!hasData ? (
        <div className="np-section">
          <div className="np-empty">
            <div className="np-empty-icon">
              <Sparkles size={48} />
            </div>
            <div className="np-empty-title">
              {language === 'bn' ? 'কোনো ডেটা নেই' : 'No Data Yet'}
            </div>
            <div className="np-empty-sub">
              {language === 'bn'
                ? 'নামাজ ট্র্যাক করা শুরু করুন এবং আপনার অগ্রগতি দেখুন'
                : 'Start tracking your prayers to see insights and progress'}
            </div>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedMonth}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            {/* Hero Card */}
            <HeroCard
              streak={streak}
              completionRate={insights.completionRate}
              totalDays={insights.totalDaysTracked}
              bestPrayer={bestPrayerName || (language === 'bn' ? '—' : '—')}
              language={language}
            />

            {/* Prayer Breakdown Grid */}
            <PrayerBreakdownGrid logs={logs} month={monthDate} language={language} />

            {/* Heatmap + Consistency Chart */}
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              <PremiumHeatmap logs={logs} month={monthDate} language={language} />
              <PremiumConsistencyChart logs={logs} language={language} />
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}