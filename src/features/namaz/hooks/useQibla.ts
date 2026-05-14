import { useEffect, useMemo, useState } from 'react';
import { calculateQiblaDirection } from '../utils/qiblaDirection';
import { usePrefsStore } from '../store/prefsStore';

interface WebkitDeviceOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

export function useQibla() {
  const location = usePrefsStore((state) => state.location);
  const [heading, setHeading] = useState<number | null>(null);
  const [supported, setSupported] = useState(false);

  const qiblaBearing = useMemo(
    () => calculateQiblaDirection(location.latitude, location.longitude),
    [location.latitude, location.longitude]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return;
    setSupported(true);

    const handler = (event: DeviceOrientationEvent) => {
      const compassEvent = event as WebkitDeviceOrientationEvent;
      const nextHeading = compassEvent.webkitCompassHeading ?? (event.alpha != null ? 360 - event.alpha : null);
      setHeading(nextHeading == null ? null : (nextHeading + 360) % 360);
    };

    window.addEventListener('deviceorientation', handler);
    return () => window.removeEventListener('deviceorientation', handler);
  }, []);

  const directionOffset = heading == null ? qiblaBearing : (qiblaBearing - heading + 360) % 360;

  return { qiblaBearing, heading, directionOffset, supported };
}
