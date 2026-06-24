// app/(tabs)/namaz/components/QiblaView/index.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QiblaCompass from './QiblaCompass';
import AccuracyMeter from './AccuracyMeter';
import { getCurrentPrayerLocation, LocationPermissionError, reverseGeocodeLocation } from '@/lib/native/location';
import { triggerHaptic, vibrateBrowser } from '@/lib/native/haptics';
import '../../qibla-premium.css';

interface Location { lat: number; lng: number; city?: string; }
type LocationState = 'loading' | 'success' | 'error';

function distanceToKaaba(lat: number, lon: number): number {
  const R = 6371;
  const kLat = (21.4225 * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const Δφ = kLat - φ1;
  const Δλ = (39.8262 * Math.PI) / 180 - (lon * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(kLat) * Math.sin(Δλ / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function calculateQibla(lat: number, lon: number): number {
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (21.4225 * Math.PI) / 180;
  const Δλ = ((39.8262 - lon) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function getCardinalBangla(deg: number) {
  return ['উত্তর','উ-পূ','পূর্ব','দ-পূ','দক্ষিণ','দ-প','পশ্চিম','উ-প'][Math.round(deg / 45) % 8];
}

// ── Stagger animation variants ──
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 } as any,
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 200, damping: 22 },
  },
} as const;

export default function QiblaView() {
  const [location, setLocation] = useState<Location | null>(null);
  const [locationState, setLocationState] = useState<LocationState>('loading');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [orientationPermissionGranted, setOrientationPermissionGranted] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAligned, setIsAligned] = useState(false);
  const prevAlignedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);
  }, []);

  // Haptic on alignment change
  useEffect(() => {
    if (isAligned && !prevAlignedRef.current) {
      triggerHaptic('success');
      vibrateBrowser(12);
    } else if (!isAligned && prevAlignedRef.current) {
      triggerHaptic('light');
    }
    prevAlignedRef.current = isAligned;
  }, [isAligned]);

  const getLocationAndQibla = useCallback(() => {
    setLocationState('loading');
    setLocationError(null);

    void getCurrentPrayerLocation()
      .then(async (position) => {
        const lat = position.latitude;
        const lng = position.longitude;

        setQiblaAngle(calculateQibla(lat, lng));
        setDistanceKm(distanceToKaaba(lat, lng));

        try {
          const place = await reverseGeocodeLocation(position);
          setLocation({ lat, lng, city: place.displayName ?? place.city ?? 'Current location' });
        } catch {
          setLocation({ lat, lng, city: 'Current location' });
        }

        setLocationState('success');
      })
      .catch((error) => {
        setLocationError(
          error instanceof LocationPermissionError
            ? 'Location permission is required. Allow location for SelfSync from phone settings.'
            : error instanceof Error
              ? error.message
              : 'Location could not be detected.'
        );
        setLocationState('error');
        console.error('Geolocation error:', error);
      });
  }, []);

  const requestOrientationPermission = async () => {
    if (isIOS && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const state = await (DeviceOrientationEvent as any).requestPermission();
        if (state === 'granted') setOrientationPermissionGranted(true);
      } catch (e) { console.error(e); }
    } else if ('DeviceOrientationEvent' in window) {
      setOrientationPermissionGranted(true);
    }
  };

  useEffect(() => { getLocationAndQibla(); }, [getLocationAndQibla]);

  useEffect(() => {
    if (!isIOS && 'DeviceOrientationEvent' in window) setOrientationPermissionGranted(true);
  }, [isIOS]);

  if (!mounted) return null;

  return (
    <motion.div
      className="space-y-5 pb-6 qp-root"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Premium Header ─────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex items-start justify-between">
        <div className="space-y-1">
          <p
            className="text-xs tracking-[0.25em] text-emerald-600/80 dark:text-emerald-400/80 font-medium"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            اتجاه القبلة
          </p>
          <h2 className="text-2xl font-bold tracking-tight np-gradient-text">
            কিবলা দিক
          </h2>
          <p className="text-sm text-emerald-700/80 dark:text-emerald-300/70">
            মক্কার কাবার দিকে মুখ করুন
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            triggerHaptic('light');
            vibrateBrowser(5);
            getLocationAndQibla();
          }}
          disabled={locationState === 'loading'}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 bg-white/80 dark:bg-[rgba(13,15,20,0.78)] backdrop-blur-2xl border border-emerald-200/50 dark:border-[rgba(255,255,255,0.06)] disabled:opacity-50"
        >
          <svg
            className={`w-3.5 h-3.5 ${locationState === 'loading' ? 'animate-spin' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          <span className="text-emerald-600 dark:text-emerald-400">রিফ্রেশ</span>
        </motion.button>
      </motion.div>

      {/* ── Location Card ──────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <AnimatePresence mode="wait">
          {locationState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl p-5 bg-white/80 dark:bg-[rgba(13,15,20,0.78)] backdrop-blur-2xl border border-emerald-200/50 dark:border-[rgba(255,255,255,0.06)] qp-location-card"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-5 h-5 flex-shrink-0">
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">অবস্থান নির্ধারণ হচ্ছে</p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/50">GPS সিগনাল অপেক্ষমান...</p>
                </div>
              </div>
            </motion.div>
          )}

          {locationState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="qp-error-card"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-rose-300 text-sm font-medium">{locationError}</p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={getLocationAndQibla}
                    className="mt-2 text-xs text-emerald-400 font-semibold underline underline-offset-2 decoration-emerald-500/30"
                  >
                    পুনরায় চেষ্টা করুন
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {locationState === 'success' && location && qiblaAngle !== null && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl p-5 bg-white/80 dark:bg-[rgba(13,15,20,0.78)] backdrop-blur-2xl border border-emerald-200/50 dark:border-[rgba(255,255,255,0.06)] qp-location-card"
            >
              <div className="space-y-4">
                {/* City + coords */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100/70 dark:bg-emerald-500/10 border border-emerald-300/50 dark:border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 truncate">
                      {location.city}
                    </p>
                    <p className="text-xs font-mono text-emerald-600/60 dark:text-emerald-400/40">
                      {location.lat.toFixed(4)}° N, {location.lng.toFixed(4)}° E
                    </p>
                  </div>
                  <div className="qp-live-badge">
                    <span className="qp-live-dot" />
                    <span className="qp-live-label">লাইভ</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-emerald-300/40 dark:border-emerald-500/10">
                  {[
                    { label: 'কিবলা কোণ', value: `${Math.round(qiblaAngle)}°`, mono: true },
                    { label: 'দিক',       value: getCardinalBangla(qiblaAngle), mono: false },
                    { label: 'কাবা থেকে', value: `${distanceKm?.toLocaleString()} km`, mono: true },
                  ].map(({ label, value, mono }) => (
                    <motion.div
                      key={label}
                      whileTap={{ scale: 0.95 }}
                      className="qp-stat-card"
                    >
                      <p className="text-[10px] font-semibold tracking-wider uppercase text-emerald-700/60 dark:text-emerald-400/50 mb-1">
                        {label}
                      </p>
                      <p className={`text-base font-bold text-emerald-800 dark:text-emerald-200 ${mono ? 'font-mono tracking-tight' : ''}`}>
                        {value}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Compass + Accuracy ─────────────────────────────────────────── */}
      {locationState === 'success' && qiblaAngle !== null && (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          {/* Compass card — 2/3 */}
          <div className="lg:col-span-2 rounded-2xl p-5 bg-white/80 dark:bg-[rgba(13,15,20,0.78)] backdrop-blur-2xl border border-emerald-200/50 dark:border-[rgba(255,255,255,0.06)] qp-compass-container">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">কম্পাস</span>
              {orientationPermissionGranted && (
                <div className="qp-live-badge ml-auto">
                  <span className="qp-live-dot" />
                  <span className="qp-live-label">লাইভ</span>
                </div>
              )}
            </div>
            <QiblaCompass
              qiblaAngle={qiblaAngle}
              orientationGranted={orientationPermissionGranted}
              onAlignmentChange={setIsAligned}
            />
          </div>

          {/* Accuracy — 1/3 */}
          <div className="lg:col-span-1">
            <AccuracyMeter
              onGrantPermission={requestOrientationPermission}
              isIOS={isIOS}
              permissionGranted={orientationPermissionGranted}
            />
          </div>
        </motion.div>
      )}

      {/* ── How-to Guide ───────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="rounded-2xl p-5 bg-white/80 dark:bg-[rgba(13,15,20,0.78)] backdrop-blur-2xl border border-emerald-200/50 dark:border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-400/30 dark:via-emerald-500/20 to-transparent" />
          <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-emerald-700/50 dark:text-emerald-400/50 px-1">
            ব্যবহারবিধি
          </span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-emerald-500/20 to-transparent" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { icon: '📐', text: 'ডিভাইস সমতল রাখুন — কম্পাস সঠিক থাকবে' },
            { icon: '🟩', text: 'সবুজ বর্গ (কাবা) যেদিকে — সেদিকে মুখ করুন' },
            { icon: '🧲', text: 'ধাতব বস্তু থেকে দূরে থাকলে নির্ভুলতা বাড়ে' },
            { icon: '∞',  text: 'কম্পাস ক্যালিব্রেট করতে ৮ আকারে ঘোরান' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.06, type: 'spring', stiffness: 200, damping: 22 }}
              className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 bg-emerald-100/50 dark:bg-emerald-500/5 border border-emerald-300/40 dark:border-emerald-500/10"
            >
              <span className="text-base leading-none mt-0.5 flex-shrink-0">{item.icon}</span>
              <span className="text-xs leading-relaxed text-emerald-800/80 dark:text-emerald-300/80">{item.text}</span>
            </motion.div>
          ))}
        </div>

        {isIOS && !orientationPermissionGranted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 flex items-start gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3.5 py-3"
          >
            <span>⚠️</span>
            <span>iOS এ কম্পাস চালু করতে অ্যাকুরেসি মিটারে <strong className="text-amber-200">"পারমিশন দিন"</strong> বাটনে ক্লিক করুন</span>
          </motion.div>
        )}
      </motion.div>

      {/* ── Quranic Ayah Footer ────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="text-center space-y-2.5 py-2">
        <div className="qp-ayah-divider">
          <div className="qp-ayah-divider-line" />
          <span className="qp-ayah-divider-icon">✦</span>
          <div className="qp-ayah-divider-line" />
        </div>
        <p
          className="text-base leading-relaxed qp-gradient-text-gold"
          style={{ fontFamily: 'Georgia, serif', direction: 'rtl' }}
        >
          وَمِنْ حَيْثُ خَرَجْتَ فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ
        </p>
        <p className="text-xs text-emerald-700/60 dark:text-emerald-400/50 leading-relaxed max-w-md mx-auto">
          "যেখান থেকেই বেরিয়ে যাও, মসজুল হারামের দিকে মুখ কর।" — সূরা বাকারা: ১৪৯
        </p>
      </motion.div>
    </motion.div>
  );
}