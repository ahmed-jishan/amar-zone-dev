// TODO: Full namaz tracker UI
// Connects to: useNamazStore, usePrayerTimes hook, adhan library
export default function NamazPage() {
  return (
    <div className="p-4 pt-6">
      <h1 className="text-2xl font-semibold mb-1">Namaz</h1>
      <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Prayer tracker & times</p>
      {/* Build: PrayerTimeCard, DailyPrayerGrid, MonthlyHeatmap, QiblaCompass */}
    </div>
  )
}
