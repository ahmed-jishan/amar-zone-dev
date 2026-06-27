// ────────────────────────────────────────────────────────────────
// ╔══════════════════════════════════════════════════════════════╗
// ║   ModePreferences — Enhanced Mode Settings Panel           ║
// ║   Premium iOS-style grouped rows for mode configuration    ║
// ╚══════════════════════════════════════════════════════════════╝
// ────────────────────────────────────────────────────────────────

'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Moon, Navigation, Sun, CloudSun, Sparkles,
  ChevronRight, Info, CheckCircle2, AlertCircle
} from 'lucide-react';
import { usePrefsStore, type LifeMode } from '../../store/prefsStore';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { useModeEngine } from '../hooks/useModeEngine';
import { getModeLabel, getModeDescription, getModeLabel as getModeName } from '../types';
import type { PrayerCombination } from '../types';
import { triggerHaptic } from '@/lib/native/haptics';
import '@/features/namaz/namaz-premium.css';

/**
 * Premium toggle switch (reusing existing pattern from PreferencesView)
 */
function Toggle({ value, onChange, id }: { value: boolean; onChange: (v: boolean) => void; id?: string }) {
  return (
    <div
      className="np-toggle"
      role="switch"
      aria-checked={value}
      id={id}
      onClick={() => onChange(!value)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(!value); } }}
      tabIndex={0}
    >
      <div className={`np-toggle-track ${value ? 'np-toggle-track--on' : ''}`} />
      <div className={`np-toggle-knob ${value ? 'np-toggle-knob--on' : ''}`} />
    </div>
  );
}

function GroupRow({
  icon,
  iconType = 'accent',
  label,
  sub,
  right,
  onClick,
  showChevron = false,
}: {
  icon: React.ReactNode;
  iconType?: 'accent' | 'success' | 'gold' | 'neutral';
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  showChevron?: boolean;
}) {
  return (
    <button className="np-group-row" onClick={onClick} type="button">
      <div className="np-group-row-left">
        <div className={`np-group-row-icon np-group-row-icon--${iconType}`}>{icon}</div>
        <div style={{ textAlign: 'left' }}>
          <div className="np-group-row-label">{label}</div>
          {sub && <div className="np-group-row-sub">{sub}</div>}
        </div>
      </div>
      <div className="np-group-row-right">
        {right}
        {showChevron && (
          <div className="np-group-row-chevron">
            <ChevronRight size={14} />
          </div>
        )}
      </div>
    </button>
  );
}

/**
 * ModePreferences — Enhanced smart mode panel
 * Shows in the Preferences tab with additional mode-specific controls
 */
export default function ModePreferences() {
  const { language } = useSettingsStore();
  const ramadanMode = usePrefsStore((s) => s.ramadanMode);
  const travelMode = usePrefsStore((s) => s.travelMode);
  const lifeMode = usePrefsStore((s) => s.lifeMode);
  const setSpecialMode = usePrefsStore((s) => s.setSpecialMode);
  const setLifeMode = usePrefsStore((s) => s.setLifeMode);
  const engine = useModeEngine();
  const [showTravelDetails, setShowTravelDetails] = useState(false);

  const LIFE_MODES: { id: LifeMode; labelEn: string; labelBn: string; icon: React.ReactNode }[] = [
    { id: 'normal', labelEn: 'Normal', labelBn: 'সাধারণ', icon: <Sun size={14} /> },
    { id: 'busy', labelEn: 'Busy', labelBn: 'ব্যস্ত', icon: <CloudSun size={14} /> },
    { id: 'sick', labelEn: 'Sick', labelBn: 'অসুস্থ', icon: <Moon size={14} /> },
    { id: 'focus', labelEn: 'Focus', labelBn: 'ফোকাস', icon: <Sparkles size={14} /> },
  ];

  const COMBINATION_OPTIONS: { id: PrayerCombination; labelEn: string; labelBn: string }[] = [
    { id: 'dhuhr_asr', labelEn: 'Dhuhr + Asr', labelBn: 'যোহর + আসর' },
    { id: 'maghrib_isha', labelEn: 'Maghrib + Isha', labelBn: 'মাগরিব + ইশা' },
  ];

  return (
    <div className="np-root" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* ─── SMART MODES SECTION ─── */}
      <div className="np-group">
        <div className="np-group-section">
          <div className="np-group-header">
            {language === 'bn' ? 'স্মার্ট মোড' : 'Smart Modes'}
          </div>

          {/* Ramadan Mode */}
          <GroupRow
            icon={<Moon size={14} />}
            iconType={ramadanMode ? 'gold' : 'neutral'}
            label={getModeName('ramadanMode', language)}
            sub={getModeDescription('ramadanMode', language)}
            right={
              <Toggle
                value={ramadanMode}
                onChange={(v) => {
                  triggerHaptic('medium');
                  setSpecialMode('ramadanMode', v);
                }}
              />
            }
          />

          {/* Ramadan Mode Info (shown when active) */}
          {ramadanMode && (
            <div style={{ padding: '8px 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Ramadan Day progress */}
              {engine.ramadanData.dayOfRamadan && (
                <div className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                  <CheckCircle2 size={14} style={{ color: '#fbbf24' }} />
                  <div className="flex-1">
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24' }}>
                      {language === 'bn'
                        ? `রমজান ${engine.ramadanData.dayOfRamadan} / ${engine.ramadanData.totalRamadanDays}`
                        : `Ramadan ${engine.ramadanData.dayOfRamadan} / ${engine.ramadanData.totalRamadanDays}`}
                    </span>
                    <div className="mt-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round((engine.ramadanData.dayOfRamadan / 30) * 100)}%`,
                          background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Last 10 days indicator */}
              {engine.ramadanData.isLastTenDays && (
                <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
                  <Sparkles size={14} style={{ color: '#c084fc' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#c084fc' }}>
                    {engine.ramadanData.isLaylatulQadrLikely
                      ? (language === 'bn' ? '🌙 লাইলাতুল কদর — শেষ ১০ দিনের বেজোড় রাত!' : '🌙 Laylatul Qadr — Last 10 odd night!')
                      : (language === 'bn' ? '🕌 শেষ ১০ দিন — বেশি বেশি ইবাদত' : '🕌 Last 10 days — increase worship')}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="np-divider" />

          {/* Travel Mode */}
          <GroupRow
            icon={<Navigation size={14} />}
            iconType={travelMode ? 'gold' : 'neutral'}
            label={getModeName('travelMode', language)}
            sub={getModeDescription('travelMode', language)}
            right={
              <Toggle
                value={travelMode}
                onChange={(v) => {
                  triggerHaptic('medium');
                  setSpecialMode('travelMode', v);
                }}
              />
            }
          />

          {/* Travel Mode Details (shown when active) */}
          {travelMode && (
            <div style={{ padding: '8px 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--st-text-2, #9a9bad)' }}>
                {language === 'bn' ? 'জমা ও কসর পদ্ধতি' : 'Jam\'a & Qasr Method'}
              </p>
              <div className="flex gap-2">
                {COMBINATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      engine.setCombinationPreference(opt.id);
                    }}
                    className="np-chip"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      ...(engine.prayerAdjustments.combination === opt.id
                        ? {
                            background: 'rgba(56, 189, 248, 0.12)',
                            borderColor: 'rgba(56, 189, 248, 0.3)',
                            color: '#7dd3fc',
                          }
                        : {}),
                    }}
                  >
                    {language === 'bn' ? opt.labelBn : opt.labelEn}
                  </button>
                ))}
              </div>

              {/* Qasr prayers list */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => {
                  const isQasr = engine.prayerAdjustments.qasrPrayers.includes(prayer.toLowerCase());
                  return (
                    <span
                      key={prayer}
                      className={`travel-badge--${isQasr ? 'qasr' : 'full'}`}
                    >
                      {prayer}
                      {isQasr ? ' (2)' : ''}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="np-divider" />

          {/* Life Mode — preserved from existing */}
          <div style={{ padding: '12px 16px 16px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--st-text-2, #9a9bad)', marginBottom: 8, display: 'block' }}>
              {language === 'bn' ? 'জীবনের মোড' : 'Life Mode'}
            </label>
            <div className="np-segmented">
              {LIFE_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={`np-segmented-btn ${lifeMode === mode.id ? 'np-segmented-btn--active' : ''}`}
                  onClick={() => setLifeMode(mode.id)}
                >
                  {mode.icon}
                  <span style={{ marginLeft: 4 }}>{language === 'bn' ? mode.labelBn : mode.labelEn}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODE INFO CARD ─── */}
      {(ramadanMode || travelMode) && (
        <div className="np-group">
          <div className="np-group-section">
            <div style={{ padding: 16 }}>
              <div className="flex items-start gap-3">
                <Info size={16} style={{ color: 'var(--st-accent, #7c8cff)', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--st-text-1, #f0f0f6)', marginBottom: 4 }}>
                    {getModeInfoTitle(ramadanMode, travelMode, language)}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--st-text-3, #5c5e72)', lineHeight: 1.5 }}>
                    {getModeInfoBody(ramadanMode, travelMode, language, engine)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getModeInfoTitle(
  ramadan: boolean,
  travel: boolean,
  language: 'bn' | 'en'
): string {
  if (ramadan && travel) {
    return language === 'bn'
      ? '🌙 রমজানে ভ্রমণ — বিশেষ নিয়ম'
      : '🌙 Traveling in Ramadan — Special Rules';
  }
  if (ramadan) {
    return language === 'bn'
      ? '🌙 রমজান মোড সক্রিয়'
      : '🌙 Ramadan Mode Active';
  }
  return language === 'bn'
    ? '🧳 ভ্রমণ মোড সক্রিয়'
    : '🧳 Travel Mode Active';
}

function getModeInfoBody(
  ramadan: boolean,
  travel: boolean,
  language: 'bn' | 'en',
  engine: any
): string {
  if (ramadan && travel) {
    return language === 'bn'
      ? 'ভ্রমণে নামাজ কসর ও জমা পড়ুন। রোজা রেখে ভ্রমণ করলে ইফতার স্থানীয় সময় অনুযায়ী হবে। তারাবীহ ৮ রাকাত পড়া উত্তম।'
      : 'Pray Qasr & combine during travel. Break fast at local Maghrib time. 8 rakat Taraweeh is recommended while traveling.';
  }
  if (ramadan) {
    return language === 'bn'
      ? `ইফটার ট্র্যাকিং, রোজার লগ, তারাবীহ ট্র্যাকার ও কুরআন খতম প্ল্যান এখন ড্যাশবোর্ডে সক্রিয়।${engine?.ramadanData?.isLastTenDays ? ' শেষ ১০ দিন — ইবাদত বাড়িয়ে দিন!' : ''}`
      : `Iftar tracking, fasting log, Taraweeh tracker & Quran khatam plan now active on dashboard.${engine?.ramadanData?.isLastTenDays ? ' Last 10 days — increase worship!' : ''}`;
  }
  return language === 'bn'
    ? 'নামাজ কসর (২ রাকাত) ও জমা (একত্রিত) পদ্ধতি সক্রিয়। সময় অঞ্চল অনুযায়ী অ্যাডজাস্টেড। সরলীকৃত UI চালু।'
    : 'Qasr (2 rakat) & Jam\'a (combined) prayers active. Timezone-adjusted. Simplified UI enabled.';
}