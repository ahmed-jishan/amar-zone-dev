// app/(tabs)/namaz/components/QiblaView/index.tsx
'use client';

import { useState, useEffect } from 'react';
import { Compass, MapPin, Navigation, RefreshCw } from 'lucide-react';
import QiblaCompass from './QiblaCompass';
import AccuracyMeter from './AccuracyMeter';

interface Location {
  lat: number;
  lng: number;
  city?: string;
}

export default function QiblaView() {
  const [location, setLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [orientationPermissionGranted, setOrientationPermissionGranted] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Detect iOS for special permission handling
  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
  }, []);

  // Get user location and calculate qibla angle
  const getLocationAndQibla = () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('আপনার ব্রাউজার লোকেশন সাপোর্ট করে না');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const qibla = calculateQibla(latitude, longitude);
        setQiblaAngle(qibla);
        
        // Get city name from coordinates (optional, for display)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || 'অজানা স্থান';
          setLocation({ lat: latitude, lng: longitude, city });
        } catch {
          setLocation({ lat: latitude, lng: longitude, city: 'অজানা স্থান' });
        }
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let message = 'লোকেশন পাওয়া যায়নি';
        if (error.code === 1) message = 'লোকেশন অ্যাক্সেস অনুমতি দিন';
        else if (error.code === 2) message = 'লোকেশন তথ্য অনুপলব্ধ';
        else if (error.code === 3) message = 'লোকেশন টাইমআউট';
        setLocationError(message);
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Calculate qibla direction from user's lat/lon to Kaaba
  const calculateQibla = (lat: number, lon: number): number => {
    const kaabaLat = 21.4225;
    const kaabaLon = 39.8262;
    
    const φ1 = (lat * Math.PI) / 180;
    const φ2 = (kaabaLat * Math.PI) / 180;
    const Δλ = ((kaabaLon - lon) * Math.PI) / 180;
    
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360;
    return bearing;
  };

  // Request device orientation permission (iOS only)
  const requestOrientationPermission = async () => {
    if (isIOS && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setOrientationPermissionGranted(true);
        } else {
          console.warn('Orientation permission denied');
        }
      } catch (err) {
        console.error('Error requesting orientation permission:', err);
      }
    } else {
      // Non-iOS: permission is automatically granted (but need to check if deviceorientation is supported)
      if ('DeviceOrientationEvent' in window) {
        setOrientationPermissionGranted(true);
      } else {
        console.warn('Device orientation not supported');
      }
    }
  };

  useEffect(() => {
    getLocationAndQibla();
  }, []);

  // Auto-request orientation on mount for non-iOS, for iOS we need user gesture
  useEffect(() => {
    if (!isIOS && !orientationPermissionGranted && 'DeviceOrientationEvent' in window) {
      setOrientationPermissionGranted(true);
    }
  }, [isIOS, orientationPermissionGranted]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <Compass className="text-emerald-700" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">কিবলা দিক নির্ণয়</h2>
            <p className="text-emerald-600 text-sm">ডিভাইস ঘুরিয়ে কিবলার দিক খুঁজুন</p>
          </div>
        </div>
        <button
          onClick={getLocationAndQibla}
          className="flex items-center gap-2 px-4 py-2 bg-white/70 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-white transition"
        >
          <RefreshCw size={16} />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* Location info or error */}
      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-emerald-100">
        {isLoadingLocation ? (
          <div className="flex items-center gap-3 text-emerald-600">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-600 border-t-transparent" />
            <span>লোকেশন সংগ্রহ করা হচ্ছে...</span>
          </div>
        ) : locationError ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-rose-600">
              <MapPin size={18} />
              <span>{locationError}</span>
            </div>
            <button
              onClick={getLocationAndQibla}
              className="self-start text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg"
            >
              পুনরায় চেষ্টা
            </button>
          </div>
        ) : location && qiblaAngle !== null && (
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <MapPin size={18} />
              <span>{location.city} ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-emerald-500">কিবলা দিক</p>
                <p className="text-xl font-bold text-emerald-800">{Math.round(qiblaAngle)}°</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compass & Accuracy Section */}
      {!isLoadingLocation && !locationError && qiblaAngle !== null && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compass - takes 2/3 on large screens */}
          <div className="lg:col-span-2">
            <QiblaCompass qiblaAngle={qiblaAngle} orientationGranted={orientationPermissionGranted} />
          </div>
          {/* Accuracy Meter */}
          <div>
            <AccuracyMeter onGrantPermission={requestOrientationPermission} isIOS={isIOS} permissionGranted={orientationPermissionGranted} />
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
        <h3 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
          <Navigation size={18} />
          ব্যবহারবিধি
        </h3>
        <ul className="text-sm text-emerald-700 space-y-1 list-disc list-inside">
          <li>ডিভাইসটি সমতল (টেবিলের উপর বা হাতে) ধরে রাখুন</li>
          <li>কিবলা কম্পাস ক্যানভাসে লাল সুঁই কিবলার দিক নির্দেশ করবে</li>
          <li>সবুজ রেখা হলো কিবলার প্রকৃত দিক (আপনার লোকেশন অনুযায়ী)</li>
          <li>আপনি ডিভাইস ঘোরানোর সাথে সাথে কম্পাস সুঁই ঘুরবে</li>
          {isIOS && !orientationPermissionGranted && (
            <li className="text-amber-700">iOS ডিভাইসে ওরিয়েন্টেশন পারমিশন দরকার: নিচের "পারমিশন দিন" বাটনে ক্লিক করুন</li>
          )}
        </ul>
      </div>
    </div>
  );
}