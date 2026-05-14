const KAABA = {
  latitude: 21.422487,
  longitude: 39.826206,
};

const toRad = (degrees: number) => (degrees * Math.PI) / 180;
const toDeg = (radians: number) => (radians * 180) / Math.PI;

export function calculateQiblaDirection(latitude: number, longitude: number): number {
  const lat1 = toRad(latitude);
  const lat2 = toRad(KAABA.latitude);
  const deltaLng = toRad(KAABA.longitude - longitude);

  const y = Math.sin(deltaLng);
  const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(deltaLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
