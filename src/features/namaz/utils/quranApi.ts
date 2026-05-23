import { NAMAZ_STORAGE_KEYS } from '../constants/storageKeys';
import { getItem, setItem } from './storageHelpers';

export interface QuranAyah {
  number: number;
  numberInSurah: number;
  arabic: string;
  bangla: string;
  pronunciation: string;
}

interface AlQuranEdition {
  ayahs: Array<{
    number: number;
    numberInSurah: number;
    text: string;
  }>;
}

interface AlQuranResponse {
  code: number;
  data: AlQuranEdition[];
}

type QuranCache = Record<string, { savedAt: number; ayahs: QuranAyah[] }>;

const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

export const RECITER_AUDIO_FOLDERS = {
  alafasy: 'Alafasy_128kbps',
  husary: 'Husary_128kbps',
  sudais: 'Abdurrahmaan_As-Sudais_192kbps',
} as const;

const ARABIC_TO_BANGLA: Record<string, string> = {
  ا: 'আ', أ: 'আ', إ: 'ই', آ: 'আ',
  ب: 'ব', ت: 'ত', ث: 'স', ج: 'জ', ح: 'হ', خ: 'খ',
  د: 'দ', ذ: 'য', ر: 'র', ز: 'য', س: 'স', ش: 'শ',
  ص: 'স', ض: 'দ', ط: 'ত', ظ: 'য', ع: 'আ', غ: 'গ',
  ف: 'ফ', ق: 'ক', ك: 'ক', ک: 'ক', ل: 'ল', م: 'ম',
  ن: 'ন', ه: 'হ', ة: 'হ', و: 'ও', ي: 'ই', ى: 'আ',
  ء: '', ئ: 'ই', ؤ: 'উ', ٱ: 'আ',
};

const VOWELS: Record<string, string> = {
  '\u064e': 'া',
  '\u0650': 'ি',
  '\u064f': 'ু',
  '\u064b': 'ান',
  '\u064d': 'িন',
  '\u064c': 'ুন',
  '\u0652': '',
  '\u0651': '',
  '\u0670': 'া',
  '\u0653': '',
  '\u0654': '',
  '\u0655': '',
};

function toBanglaPronunciation(text: string): string {
  let output = '';

  for (const char of text) {
    if (char === ' ') {
      output += ' ';
      continue;
    }
    if (char === 'ۚ' || char === 'ۖ' || char === 'ۗ' || char === 'ۙ' || char === 'ۛ' || char === 'ۜ') {
      output += ' ';
      continue;
    }
    if (/[\u06d6-\u06ed]/.test(char)) continue;
    if (VOWELS[char] !== undefined) {
      output += VOWELS[char];
      continue;
    }
    output += ARABIC_TO_BANGLA[char] ?? '';
  }

  return output.replace(/\s+/g, ' ').trim();
}

export async function fetchSurahAyahs(surahNumber: number): Promise<QuranAyah[]> {
  const cache = getItem<QuranCache>(NAMAZ_STORAGE_KEYS.quranCache, {});
  const key = String(surahNumber);
  const cached = cache[key];

  if (cached && Date.now() - cached.savedAt < CACHE_MAX_AGE_MS) {
    return cached.ayahs.map((ayah) => ({
      ...ayah,
      pronunciation: ayah.pronunciation || toBanglaPronunciation(ayah.arabic),
    }));
  }

  const response = await fetch(
    `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,bn.bengali`
  );
  if (!response.ok) throw new Error(`Unable to load Surah ${surahNumber}`);

  const payload = (await response.json()) as AlQuranResponse;
  if (payload.code !== 200 || payload.data.length < 2) {
    throw new Error('Invalid Quran response');
  }

  const [arabic, bangla] = payload.data;
  const ayahs = arabic.ayahs.map((ayah, index) => ({
    number: ayah.number,
    numberInSurah: ayah.numberInSurah,
    arabic: ayah.text,
    bangla: bangla.ayahs[index]?.text ?? '',
    pronunciation: toBanglaPronunciation(ayah.text),
  }));

  setItem<QuranCache>(NAMAZ_STORAGE_KEYS.quranCache, {
    ...cache,
    [key]: { savedAt: Date.now(), ayahs },
  });

  return ayahs;
}

export function getAyahAudioUrl(surah: number, ayah: number, reciter: keyof typeof RECITER_AUDIO_FOLDERS): string {
  const file = `${String(surah).padStart(3, '0')}${String(ayah).padStart(3, '0')}.mp3`;
  return `https://everyayah.com/data/${RECITER_AUDIO_FOLDERS[reciter]}/${file}`;
}
