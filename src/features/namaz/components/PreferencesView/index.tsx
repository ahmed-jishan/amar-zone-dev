'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, BookOpen, Bell, BellRing, Moon, Sun, CloudSun,
  Sparkles, Settings2, ChevronRight, Globe, Calculator,
  Volume2, VolumeX, Loader2, CheckCircle2, AlertCircle,
  Map, Navigation, Clock, ShieldCheck
} from 'lucide-react';
import { usePrefsStore, type LifeMode } from '../../store/prefsStore';
import { useNotifications } from '../../hooks/useNotifications';
import { requestAppNotificationPermission } from '@/lib/native/notifications';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import methods from '../../data/calculationMethods.json';
import type { Madhab } from '../../types/prayer.types';
import type { PrayerLocation } from '../../types/prayer.types';
import {
  formatPrayerLocation,
  getCurrentPrayerLocation,
  LocationPermissionError,
  reverseGeocodeLocation,
} from '@/lib/native/location';
import ModePreferences from '../../modes/components/ModePreferences';
import { useModeEngine } from '../../modes/hooks/useModeEngine';
import '@/features/namaz/namaz-premium.css';

// ─── Sub-components ───

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
    <button
      className="np-group-row"
      onClick={onClick}
      type="button"
    >
      <div className="np-group-row-left">
        <div className={`np-group-row-icon np-group-row-icon--${iconType}`}>
          {icon}
        </div>
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

// ─── Location Picker (Premium) ───

function PremiumLocationPicker() {
  const location = usePrefsStore((s) => s.location);
  const autoDetectLocation = usePrefsStore((s) => s.autoDetectLocation);
  const setLocation = usePrefsStore((s) => s.setLocation);
  const setAutoDetectLocation = usePrefsStore((s) => s.setAutoDetectLocation);
  const { language } = useSettingsStore();

  const [address, setAddress] = useState(formatPrayerLocation(location));
  const [detectedLocation, setDetectedLocation] = useState<PrayerLocation | null>(null);
  const [detectState, setDetectState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const detectLocation = useCallback(async () => {
    setError(null);
    setSuccessMsg(null);
    setDetectState('loading');
    try {
      const detected = await getCurrentPrayerLocation();
      let nextLocation: PrayerLocation = { ...detected, displayName: 'Current location' };
      try {
        const place = await reverseGeocodeLocation(detected);
        nextLocation = { ...detected, ...place, displayName: place.displayName ?? formatPrayerLocation({ ...detected, ...place }), source: 'device', updatedAt: Date.now() };
      } catch { /* ignore */ }
      setLocation(nextLocation);
      setAutoDetectLocation(true);
      setDetectedLocation(nextLocation);
      setAddress(formatPrayerLocation(nextLocation));
      setSuccessMsg(language === 'bn' ? 'লোকেশন সেভ হয়েছে' : 'Location saved');
      setDetectState('success');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      const msg = err instanceof LocationPermissionError
        ? (language === 'bn' ? 'লোকেশন অনুমতি প্রয়োজন' : 'Location permission denied')
        : err instanceof Error ? err.message : (language === 'bn' ? 'লোকেশন পাওয়া যায়নি' : 'Unable to detect location');
      setError(msg);
      setDetectState('error');
    }
  }, [setLocation, setAutoDetectLocation, language]);

  const saveLocation = useCallback(() => {
    const nextAddress = address.trim();
    if (!nextAddress) { setError(language === 'bn' ? 'লোকেশন লিখুন' : 'Enter a location'); return; }
    const base = detectedLocation ?? location;
    setError(null);
    setLocation({ ...base, displayName: nextAddress, addressLines: nextAddress.split(',').map(p => p.trim()).filter(Boolean), updatedAt: Date.now() });
    setAutoDetectLocation(Boolean(detectedLocation || autoDetectLocation));
    setSuccessMsg(language === 'bn' ? 'লোকেশন সেভ হয়েছে' : 'Location saved');
    setTimeout(() => setSuccessMsg(null), 2500);
  }, [address, autoDetectLocation, detectedLocation, location, setLocation, setAutoDetectLocation, language]);

  return (
    <div className="np-group-section">
      <div className="np-group-header">
        {language === 'bn' ? 'লোকেশন' : 'Location'}
      </div>
      <div className="np-group-row" style={{ cursor: 'default', borderBottom: '1px solid var(--st-border, rgba(255,255,255,0.05))' }}>
        <div className="np-group-row-left">
          <div className="np-group-row-icon np-group-row-icon--success">
            <MapPin size={14} />
          </div>
          <div>
            <div className="np-group-row-label">
              {language === 'bn' ? 'বর্তমান অবস্থান' : 'Current Location'}
            </div>
            <div className="np-group-row-sub" style={{ fontFamily: 'monospace', fontSize: 10 }}>
              {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </div>
          </div>
        </div>
        <div className="np-group-row-right">
          <div style={{ fontSize: 12, color: 'var(--st-text-3, #5c5e72)' }}>
            {formatPrayerLocation(location)}
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <textarea
          readOnly
          value={address}
          disabled={detectState === 'loading'}
          rows={2}
          className="np-input"
          style={{ resize: 'none', fontSize: 13 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={saveLocation}
            disabled={detectState === 'loading'}
            className="np-chip np-chip--active"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <CheckCircle2 size={14} />
            {language === 'bn' ? 'সেভ' : 'Save'}
          </button>
          <button
            type="button"
            onClick={detectLocation}
            disabled={detectState === 'loading'}
            className="np-chip"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {detectState === 'loading' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Navigation size={14} />
            )}
            {detectState === 'loading'
              ? (language === 'bn' ? 'খোঁজা হচ্ছে...' : 'Detecting...')
              : (language === 'bn' ? 'অটো-ডিটেক্ট' : 'Auto-detect')}
          </button>
        </div>
        {successMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--st-success, #34d399)' }}>
            <CheckCircle2 size={14} />
            {successMsg}
          </div>
        )}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--st-danger, #f87171)' }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Calculation Method (Premium) ───

function PremiumCalculationMethod() {
  const calculationMethod = usePrefsStore((s) => s.calculationMethod);
  const madhab = usePrefsStore((s) => s.madhab);
  const setCalculationMethod = usePrefsStore((s) => s.setCalculationMethod);
  const setMadhab = usePrefsStore((s) => s.setMadhab);
  const { language } = useSettingsStore();

  const currentMethod = (methods as any[]).find((m: any) => m.id === calculationMethod);

  return (
    <div className="np-group-section">
      <div className="np-group-header">
        {language === 'bn' ? 'গণনা পদ্ধতি' : 'Calculation Method'}
      </div>
      <div className="np-group-row" style={{ cursor: 'default', borderBottom: '1px solid var(--st-border, rgba(255,255,255,0.05))' }}>
        <div className="np-group-row-left">
          <div className="np-group-row-icon np-group-row-icon--accent">
            <Calculator size={14} />
          </div>
          <div>
            <div className="np-group-row-label">
              {language === 'bn' ? 'বর্তমান পদ্ধতি' : 'Current Method'}
            </div>
            <div className="np-group-row-sub">
              {currentMethod?.shortName || (language === 'bn' ? 'নির্বাচন করুন' : 'Select')}
            </div>
          </div>
        </div>
        <div className="np-group-row-right">
          <div style={{ fontSize: 12, color: 'var(--st-text-3, #5c5e72)' }}>
            {currentMethod?.description || ''}
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="np-segmented">
          {(methods as any[]).slice(0, 3).map((method: any) => (
            <button
              key={method.id}
              type="button"
              className={`np-segmented-btn ${calculationMethod === method.id ? 'np-segmented-btn--active' : ''}`}
              onClick={() => setCalculationMethod(method.id)}
            >
              {method.shortName}
            </button>
          ))}
        </div>
        <div className="np-segmented">
          {(methods as any[]).slice(3, 6).map((method: any) => (
            <button
              key={method.id}
              type="button"
              className={`np-segmented-btn ${calculationMethod === method.id ? 'np-segmented-btn--active' : ''}`}
              onClick={() => setCalculationMethod(method.id)}
            >
              {method.shortName}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div className="np-divider" style={{ margin: '0 0 12px' }} />
        <div className="np-segmented">
          {([
            { id: 'shafi' as Madhab, label: language === 'bn' ? 'শাফিঈ' : 'Shafi\'i' },
            { id: 'hanafi' as Madhab, label: language === 'bn' ? 'হানাফি' : 'Hanafi' },
          ]).map((item) => (
            <button
              key={item.id}
              type="button"
              className={`np-segmented-btn ${madhab === item.id ? 'np-segmented-btn--active' : ''}`}
              onClick={() => setMadhab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Reminder Settings (Premium) ───

function PremiumReminderSettings() {
  const remindersEnabled = usePrefsStore((s) => s.remindersEnabled);
  const reminderMinutesBefore = usePrefsStore((s) => s.reminderMinutesBefore);
  const setReminderPrefs = usePrefsStore((s) => s.setReminderPrefs);
  const { permission, enable, disable } = useNotifications();
  const { language } = useSettingsStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = useCallback(async () => {
    setIsLoading(true);
    try {
      if (remindersEnabled) { disable(); }
      else {
        const result = await enable();
        if (result !== 'granted') {
          alert(language === 'bn' ? 'নোটিফিকেশন অনুমতি প্রয়োজন' : 'Notification permission required');
        }
      }
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  }, [disable, enable, remindersEnabled, language]);

  return (
    <div className="np-group-section">
      <div className="np-group-header">
        {language === 'bn' ? 'নামাজ রিমাইন্ডার' : 'Prayer Reminders'}
      </div>
      <GroupRow
        icon={remindersEnabled ? <Bell size={14} /> : <Bell size={14} />}
        iconType={remindersEnabled ? 'success' : 'neutral'}
        label={language === 'bn' ? 'রিমাইন্ডার' : 'Reminders'}
        sub={remindersEnabled
          ? (language === 'bn' ? `চালু · ${reminderMinutesBefore} মিনিট আগে` : `On · ${reminderMinutesBefore} min before`)
          : (language === 'bn' ? 'বন্ধ' : 'Off')}
        right={
          isLoading ? (
            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--st-text-3, #5c5e72)' }} />
          ) : (
            <Toggle value={remindersEnabled} onChange={handleToggle} />
          )
        }
      />
      {remindersEnabled && (
        <div style={{ padding: '8px 16px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Clock size={14} style={{ color: 'var(--st-text-3, #5c5e72)' }} />
          <input
            type="range"
            min={5}
            max={30}
            step={5}
            value={reminderMinutesBefore}
            onChange={(e) => setReminderPrefs(true, Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--st-accent, #7c8cff)' }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--st-text-2, #9a9bad)', minWidth: 40, textAlign: 'right' }}>
            {reminderMinutesBefore} min
          </span>
        </div>
      )}
      {remindersEnabled && permission !== 'granted' && (
        <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--st-gold, #c9a84c)' }}>
          <AlertCircle size={12} />
          {language === 'bn' ? 'নোটিফিকেশন অনুমতি প্রয়োজন' : 'Notification permission needed'}
        </div>
      )}
    </div>
  );
}

// ─── Azan Settings (Premium) ───

const RECITERS = [
  { id: 'alafasy', name: 'Mishary Alafasy', note: 'Clear and calm' },
  { id: 'husary', name: 'Mahmoud Khalil Al-Husary', note: 'Measured tajweed' },
  { id: 'sudais', name: 'Abdul Rahman Al-Sudais', note: 'Haram style' },
] as const;

function PremiumAzanSettings() {
  const azanEnabled = usePrefsStore((s) => s.azanEnabled);
  const setAzanEnabled = usePrefsStore((s) => s.setAzanEnabled);
  const quranReciter = usePrefsStore((s) => s.quranReciter);
  const setQuranReciter = usePrefsStore((s) => s.setQuranReciter);
  const { language } = useSettingsStore();

  const toggleAzan = async () => {
    const next = !azanEnabled;
    if (next) {
      const perm = await requestAppNotificationPermission();
      if (perm !== 'granted') { setAzanEnabled(false); return; }
    }
    setAzanEnabled(next);
  };

  return (
    <div className="np-group-section">
      <div className="np-group-header">
        {language === 'bn' ? 'আজান সিস্টেম' : 'Azan System'}
      </div>
      <GroupRow
        icon={azanEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        iconType={azanEnabled ? 'success' : 'neutral'}
        label={language === 'bn' ? 'আজান' : 'Azan'}
        sub={azanEnabled
          ? (language === 'bn' ? 'চালু · নন-ব্লকিং অডিও' : 'On · Non-blocking audio')
          : (language === 'bn' ? 'বন্ধ' : 'Off')}
        right={<Toggle value={azanEnabled} onChange={toggleAzan} />}
      />
      <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--st-text-2, #9a9bad)' }}>
          {language === 'bn' ? 'ক্বারী নির্বাচন' : 'Quran Reciter'}
        </label>
        <div className="np-segmented">
          {RECITERS.map((reciter) => (
            <button
              key={reciter.id}
              type="button"
              className={`np-segmented-btn ${quranReciter === reciter.id ? 'np-segmented-btn--active' : ''}`}
              onClick={() => setQuranReciter(reciter.id as any)}
              style={{ fontSize: 11, padding: '8px 6px' }}
            >
              {reciter.name.split(' ').pop()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Special Modes (Premium) ───

function PremiumSpecialModes() {
  const ramadanMode = usePrefsStore((s) => s.ramadanMode);
  const travelMode = usePrefsStore((s) => s.travelMode);
  const lifeMode = usePrefsStore((s) => s.lifeMode);
  const setSpecialMode = usePrefsStore((s) => s.setSpecialMode);
  const setLifeMode = usePrefsStore((s) => s.setLifeMode);
  const { language } = useSettingsStore();

  const LIFE_MODES: { id: LifeMode; labelEn: string; labelBn: string; icon: React.ReactNode }[] = [
    { id: 'normal', labelEn: 'Normal', labelBn: 'সাধারণ', icon: <Sun size={14} /> },
    { id: 'busy', labelEn: 'Busy', labelBn: 'ব্যস্ত', icon: <CloudSun size={14} /> },
    { id: 'sick', labelEn: 'Sick', labelBn: 'অসুস্থ', icon: <Moon size={14} /> },
    { id: 'focus', labelEn: 'Focus', labelBn: 'ফোকাস', icon: <Sparkles size={14} /> },
  ];

  return (
    <div className="np-group-section">
      <div className="np-group-header">
        {language === 'bn' ? 'বিশেষ মোড' : 'Special Modes'}
      </div>
      <GroupRow
        icon={<Moon size={14} />}
        iconType={ramadanMode ? 'gold' : 'neutral'}
        label={language === 'bn' ? 'রমজান মোড' : 'Ramadan Mode'}
        sub={ramadanMode
          ? (language === 'bn' ? 'সক্রিয়' : 'Active')
          : (language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive')}
        right={<Toggle value={ramadanMode} onChange={(v) => setSpecialMode('ramadanMode', v)} />}
      />
      <div className="np-divider" />
      <GroupRow
        icon={<Navigation size={14} />}
        iconType={travelMode ? 'gold' : 'neutral'}
        label={language === 'bn' ? 'ভ্রমণ মোড' : 'Travel Mode'}
        sub={travelMode
          ? (language === 'bn' ? 'সক্রিয়' : 'Active')
          : (language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive')}
        right={<Toggle value={travelMode} onChange={(v) => setSpecialMode('travelMode', v)} />}
      />
      <div className="np-divider" />
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
  );
}

// ─── Main PreferencesView ───

export default function PreferencesView() {
  const { language } = useSettingsStore();

  return (
    <div className="np-root" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="np-group">
        <PremiumLocationPicker />
        <PremiumCalculationMethod />
      </div>

      <div className="np-group">
        <PremiumReminderSettings />
        <PremiumAzanSettings />
      </div>

      {/* Enhanced Mode Preferences — replaces old PremiumSpecialModes */}
      <ModePreferences />
    </div>
  );
}