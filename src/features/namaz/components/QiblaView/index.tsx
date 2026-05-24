// // app/(tabs)/namaz/components/QiblaView/index.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { Compass, MapPin, Navigation, RefreshCw } from 'lucide-react';
// import QiblaCompass from './QiblaCompass';
// import AccuracyMeter from './AccuracyMeter';

// interface Location {
//   lat: number;
//   lng: number;
//   city?: string;
// }

// export default function QiblaView() {
//   const [location, setLocation] = useState<Location | null>(null);
//   const [locationError, setLocationError] = useState<string | null>(null);
//   const [isLoadingLocation, setIsLoadingLocation] = useState(true);
//   const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
//   const [orientationPermissionGranted, setOrientationPermissionGranted] = useState(false);
//   const [isIOS, setIsIOS] = useState(false);

//   // Detect iOS for special permission handling
//   useEffect(() => {
//     const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
//     setIsIOS(isIOSDevice);
//   }, []);

//   // Get user location and calculate qibla angle
//   const getLocationAndQibla = () => {
//     setIsLoadingLocation(true);
//     setLocationError(null);

//     if (!navigator.geolocation) {
//       setLocationError('আপনার ব্রাউজার লোকেশন সাপোর্ট করে না');
//       setIsLoadingLocation(false);
//       return;
//     }

//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const { latitude, longitude } = position.coords;
//         const qibla = calculateQibla(latitude, longitude);
//         setQiblaAngle(qibla);
        
//         // Get city name from coordinates (optional, for display)
//         try {
//           const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
//           const data = await res.json();
//           const city = data.address?.city || data.address?.town || data.address?.village || 'অজানা স্থান';
//           setLocation({ lat: latitude, lng: longitude, city });
//         } catch {
//           setLocation({ lat: latitude, lng: longitude, city: 'অজানা স্থান' });
//         }
//         setIsLoadingLocation(false);
//       },
//       (error) => {
//         console.error('Geolocation error:', error);
//         let message = 'লোকেশন পাওয়া যায়নি';
//         if (error.code === 1) message = 'লোকেশন অ্যাক্সেস অনুমতি দিন';
//         else if (error.code === 2) message = 'লোকেশন তথ্য অনুপলব্ধ';
//         else if (error.code === 3) message = 'লোকেশন টাইমআউট';
//         setLocationError(message);
//         setIsLoadingLocation(false);
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   };

//   // Calculate qibla direction from user's lat/lon to Kaaba
//   const calculateQibla = (lat: number, lon: number): number => {
//     const kaabaLat = 21.4225;
//     const kaabaLon = 39.8262;
    
//     const φ1 = (lat * Math.PI) / 180;
//     const φ2 = (kaabaLat * Math.PI) / 180;
//     const Δλ = ((kaabaLon - lon) * Math.PI) / 180;
    
//     const y = Math.sin(Δλ) * Math.cos(φ2);
//     const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
//     let bearing = Math.atan2(y, x) * 180 / Math.PI;
//     bearing = (bearing + 360) % 360;
//     return bearing;
//   };

//   // Request device orientation permission (iOS only)
//   const requestOrientationPermission = async () => {
//     if (isIOS && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
//       try {
//         const permissionState = await (DeviceOrientationEvent as any).requestPermission();
//         if (permissionState === 'granted') {
//           setOrientationPermissionGranted(true);
//         } else {
//           console.warn('Orientation permission denied');
//         }
//       } catch (err) {
//         console.error('Error requesting orientation permission:', err);
//       }
//     } else {
//       // Non-iOS: permission is automatically granted (but need to check if deviceorientation is supported)
//       if ('DeviceOrientationEvent' in window) {
//         setOrientationPermissionGranted(true);
//       } else {
//         console.warn('Device orientation not supported');
//       }
//     }
//   };

//   useEffect(() => {
//     getLocationAndQibla();
//   }, []);

//   // Auto-request orientation on mount for non-iOS, for iOS we need user gesture
//   useEffect(() => {
//     if (!isIOS && !orientationPermissionGranted && 'DeviceOrientationEvent' in window) {
//       setOrientationPermissionGranted(true);
//     }
//   }, [isIOS, orientationPermissionGranted]);

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//         <div className="flex items-center gap-3">
//           <div className="p-2 bg-emerald-100 rounded-xl">
//             <Compass className="text-emerald-700" size={24} />
//           </div>
//           <div>
//             <h2 className="text-2xl font-bold text-emerald-900">কিবলা দিক নির্ণয়</h2>
//             <p className="text-emerald-600 text-sm">ডিভাইস ঘুরিয়ে কিবলার দিক খুঁজুন</p>
//           </div>
//         </div>
//         <button
//           onClick={getLocationAndQibla}
//           className="flex items-center gap-2 px-4 py-2 bg-white/70 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-white transition"
//         >
//           <RefreshCw size={16} />
//           <span>রিফ্রেশ</span>
//         </button>
//       </div>

//       {/* Location info or error */}
//       <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-emerald-100">
//         {isLoadingLocation ? (
//           <div className="flex items-center gap-3 text-emerald-600">
//             <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-600 border-t-transparent" />
//             <span>লোকেশন সংগ্রহ করা হচ্ছে...</span>
//           </div>
//         ) : locationError ? (
//           <div className="flex flex-col gap-2">
//             <div className="flex items-center gap-2 text-rose-600">
//               <MapPin size={18} />
//               <span>{locationError}</span>
//             </div>
//             <button
//               onClick={getLocationAndQibla}
//               className="self-start text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg"
//             >
//               পুনরায় চেষ্টা
//             </button>
//           </div>
//         ) : location && qiblaAngle !== null && (
//           <div className="flex flex-wrap justify-between items-center gap-3">
//             <div className="flex items-center gap-2 text-emerald-700">
//               <MapPin size={18} />
//               <span>{location.city} ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})</span>
//             </div>
//             <div className="flex items-center gap-3">
//               <div className="text-right">
//                 <p className="text-xs text-emerald-500">কিবলা দিক</p>
//                 <p className="text-xl font-bold text-emerald-800">{Math.round(qiblaAngle)}°</p>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Compass & Accuracy Section */}
//       {!isLoadingLocation && !locationError && qiblaAngle !== null && (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Compass - takes 2/3 on large screens */}
//           <div className="lg:col-span-2">
//             <QiblaCompass qiblaAngle={qiblaAngle} orientationGranted={orientationPermissionGranted} />
//           </div>
//           {/* Accuracy Meter */}
//           <div>
//             <AccuracyMeter onGrantPermission={requestOrientationPermission} isIOS={isIOS} permissionGranted={orientationPermissionGranted} />
//           </div>
//         </div>
//       )}

//       {/* Instructions */}
//       <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
//         <h3 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
//           <Navigation size={18} />
//           ব্যবহারবিধি
//         </h3>
//         <ul className="text-sm text-emerald-700 space-y-1 list-disc list-inside">
//           <li>ডিভাইসটি সমতল (টেবিলের উপর বা হাতে) ধরে রাখুন</li>
//           <li>কিবলা কম্পাস ক্যানভাসে লাল সুঁই কিবলার দিক নির্দেশ করবে</li>
//           <li>সবুজ রেখা হলো কিবলার প্রকৃত দিক (আপনার লোকেশন অনুযায়ী)</li>
//           <li>আপনি ডিভাইস ঘোরানোর সাথে সাথে কম্পাস সুঁই ঘুরবে</li>
//           {isIOS && !orientationPermissionGranted && (
//             <li className="text-amber-700">iOS ডিভাইসে ওরিয়েন্টেশন পারমিশন দরকার: নিচের "পারমিশন দিন" বাটনে ক্লিক করুন</li>
//           )}
//         </ul>
//       </div>
//     </div>
//   );
// }

'use client';

import { useState, useEffect, useCallback } from 'react';
import QiblaCompass from './QiblaCompass';
import AccuracyMeter from './AccuracyMeter';

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

export default function QiblaView() {
  const [location, setLocation] = useState<Location | null>(null);
  const [locationState, setLocationState] = useState<LocationState>('loading');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [orientationPermissionGranted, setOrientationPermissionGranted] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);
  }, []);

  const getLocationAndQibla = useCallback(() => {
    setLocationState('loading');
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('ব্রাউজার লোকেশন সাপোর্ট করে না');
      setLocationState('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        setQiblaAngle(calculateQibla(lat, lng));
        setDistanceKm(distanceToKaaba(lat, lng));
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || 'অজানা স্থান';
          setLocation({ lat, lng, city });
        } catch {
          setLocation({ lat, lng, city: 'অজানা স্থান' });
        }
        setLocationState('success');
      },
      error => {
        const msgs: Record<number, string> = { 1: 'লোকেশন অনুমতি দিন', 2: 'লোকেশন অনুপলব্ধ', 3: 'টাইমআউট' };
        setLocationError(msgs[error.code] ?? 'লোকেশন পাওয়া যায়নি');
        setLocationState('error');
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
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
    <div className="space-y-5 pb-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          {/* Arabic subtitle */}
          <p className="text-xs tracking-[0.2em] text-amber-600/80" style={{ fontFamily: 'Georgia, serif' }}>
            اتجاه القبلة
          </p>
          <h2 className="text-2xl font-bold nz-text tracking-tight">কিবলা দিক</h2>
          <p className="nz-muted text-sm">মক্কার কাবার দিকে মুখ করুন</p>
        </div>

        <button
          onClick={getLocationAndQibla}
          disabled={locationState === 'loading'}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm shadow-sm transition active:scale-95 disabled:opacity-50 nz-surface nz-text"
        >
          <svg className={`w-3.5 h-3.5 ${locationState === 'loading' ? 'animate-spin' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          রিফ্রেশ
        </button>
      </div>

      {/* ── Location card ────────────────────────────────────────────────── */}
      <div className="rounded-2xl shadow-sm p-4 nz-card">
        {locationState === 'loading' && (
          <div className="flex items-center gap-3 nz-muted">
            <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin flex-shrink-0" />
            <span className="text-sm">অবস্থান নির্ধারণ হচ্ছে...</span>
          </div>
        )}

        {locationState === 'error' && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
            </div>
            <div>
              <p className="text-rose-700 text-sm">{locationError}</p>
              <button onClick={getLocationAndQibla} className="mt-1.5 text-xs nz-accent underline underline-offset-2">
                পুনরায় চেষ্টা
              </button>
            </div>
          </div>
        )}

        {locationState === 'success' && location && qiblaAngle !== null && (
          <div className="space-y-3">
            {/* City + coords */}
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span className="nz-text text-sm font-medium">{location.city}</span>
              <span className="nz-muted text-xs font-mono">
                {location.lat.toFixed(3)}°, {location.lng.toFixed(3)}°
              </span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t nz-divider">
              {[
                { label: 'কিবলা কোণ', value: `${Math.round(qiblaAngle)}°`, mono: true },
                { label: 'দিক',       value: getCardinalBangla(qiblaAngle), mono: false },
                { label: 'কাবা থেকে', value: `${distanceKm?.toLocaleString()} km`, mono: true },
              ].map(({ label, value, mono }) => (
                <div key={label} className="text-center rounded-xl py-2 nz-soft">
                  <p className="nz-muted text-[10px] mb-0.5">{label}</p>
                  <p className={`nz-text text-base font-bold ${mono ? 'font-mono' : ''}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Compass + Accuracy ───────────────────────────────────────────── */}
      {locationState === 'success' && qiblaAngle !== null && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Compass card — 2/3 */}
          <div className="lg:col-span-2 rounded-2xl shadow-sm p-5 nz-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-300" />
              <span className="nz-text text-sm font-semibold">কম্পাস</span>
              {orientationPermissionGranted && (
                <span className="ml-auto flex items-center gap-1 text-xs nz-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  লাইভ
                </span>
              )}
            </div>
            <QiblaCompass qiblaAngle={qiblaAngle} orientationGranted={orientationPermissionGranted} />
          </div>

          {/* Accuracy — 1/3 */}
          <div className="lg:col-span-1">
            <AccuracyMeter
              onGrantPermission={requestOrientationPermission}
              isIOS={isIOS}
              permissionGranted={orientationPermissionGranted}
            />
          </div>
        </div>
      )}

      {/* ── How-to guide ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl shadow-sm p-5 space-y-3 nz-card">
        {/* Decorative divider heading */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-200" />
          <span className="text-amber-600 text-xs font-semibold tracking-widest uppercase px-1">ব্যবহারবিধি</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-200" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { icon: '📐', text: 'ডিভাইস সমতল রাখুন — কম্পাস সঠিক থাকবে' },
            { icon: '🟩', text: 'সবুজ বর্গ (কাবা) যেদিকে — সেদিকে মুখ করুন' },
            { icon: '🧲', text: 'ধাতব বস্তু থেকে দূরে থাকলে নির্ভুলতা বাড়ে' },
            { icon: '∞',  text: 'কম্পাস ক্যালিব্রেট করতে ৮ আকারে ঘোরান' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 nz-soft">
              <span className="text-base leading-none mt-0.5 flex-shrink-0">{item.icon}</span>
              <span className="nz-muted text-xs leading-relaxed">{item.text}</span>
            </div>
          ))}
        </div>

        {isIOS && !orientationPermissionGranted && (
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <span>⚠️</span>
            <span>iOS এ কম্পাস চালু করতে অ্যাকুরেসি মিটারে <strong>"পারমিশন দিন"</strong> বাটনে ক্লিক করুন।</span>
          </div>
        )}
      </div>

      {/* ── Quranic ayah footer ──────────────────────────────────────────── */}
      <div className="text-center space-y-1.5 py-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
          <span className="text-amber-500/60 text-xs">✦</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
        </div>
        <p
          className="text-base text-amber-700/80 leading-relaxed"
          style={{ fontFamily: 'Georgia, serif', direction: 'rtl' }}
        >
          وَمِنْ حَيْثُ خَرَجْتَ فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ
        </p>
        <p className="nz-muted text-xs">
          "যেখান থেকেই বেরিয়ে যাও, মসজিদুল হারামের দিকে মুখ কর।" — সূরা বাকারা: ১৫০
        </p>
      </div>

    </div>
  );
}
