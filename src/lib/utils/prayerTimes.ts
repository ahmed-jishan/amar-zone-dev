// Wrapper around adhan library for prayer time calculations
import { Coordinates, CalculationMethod, PrayerTimes, type CalculationParameters } from 'adhan'

export type MethodKey = 'Karachi' | 'MWL' | 'ISNA' | 'Egypt' | 'Dubai'

const METHOD_MAP: Record<MethodKey, () => CalculationParameters> = {
  Karachi: CalculationMethod.Karachi,
  MWL:     CalculationMethod.MuslimWorldLeague,
  ISNA:    CalculationMethod.NorthAmerica,
  Egypt:   CalculationMethod.Egyptian,
  Dubai:   CalculationMethod.Dubai,
}

export function getPrayerTimes(
  lat: number,
  lng: number,
  date: Date,
  method: MethodKey = 'Karachi'
): PrayerTimes {
  const coords = new Coordinates(lat, lng)
  const params = METHOD_MAP[method]()
  return new PrayerTimes(coords, date, params)
}
