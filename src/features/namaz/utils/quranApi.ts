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

const CONSONANTS: Record<string, string> = {
  ا: 'আ',
  أ: 'আ',
  إ: 'ই',
  آ: 'আ',
  ٱ: 'আ',
  ب: 'ব',
  ت: 'ত',
  ث: 'ছ',
  ج: 'জ',
  ح: 'হ',
  خ: 'খ',
  د: 'দ',
  ذ: 'য',
  ر: 'র',
  ز: 'য',
  س: 'স',
  ش: 'শ',
  ص: 'স',
  ض: 'দ্ব',
  ط: 'ত্ব',
  ظ: 'য',
  ع: 'আ',
  غ: 'গ',
  ف: 'ফ',
  ق: 'ক্ব',
  ك: 'ক',
  ک: 'ক',
  ل: 'ল',
  م: 'ম',
  ن: 'ন',
  ه: 'হ',
  ة: 'হ',
  و: 'ও',
  ي: 'ই',
  ى: 'আ',
  ء: '',
  ئ: 'ই',
  ؤ: 'উ',
};

const SHORT_VOWELS: Record<string, string> = {
  '\u064e': 'া',
  '\u0650': 'ি',
  '\u064f': 'ু',
};

const TANWEEN: Record<string, string> = {
  '\u064b': 'ান',
  '\u064d': 'িন',
  '\u064c': 'ুন',
};

const SUN_LETTERS = new Set(['ت', 'ث', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ل', 'ن']);
const SILENT_MARKS = /[\u0610-\u061a\u06d6-\u06ed]/;
const DIACRITICS = /[\u064b-\u065f\u0670]/;

function nextLetter(chars: string[], start: number): string | null {
  for (let index = start; index < chars.length; index += 1) {
    if (!DIACRITICS.test(chars[index]) && !SILENT_MARKS.test(chars[index])) return chars[index];
  }
  return null;
}

function previousPronouncedLetter(chars: string[], start: number): string | null {
  for (let index = start; index >= 0; index -= 1) {
    if (CONSONANTS[chars[index]]) return chars[index];
  }
  return null;
}

function longVowelFor(char: string, previousMark: string | null): string | null {
  if (char === 'ا' || char === 'ى' || char === 'ٰ') return previousMark === '\u064e' ? '' : 'আ';
  if (char === 'و' && previousMark === '\u064f') return '';
  if (char === 'ي' && previousMark === '\u0650') return '';
  return null;
}

function toBanglaPronunciation(text: string): string {
  const chars = Array.from(text.normalize('NFC'));
  const parts: string[] = [];
  let lastVowelMark: string | null = null;

  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];
    const previousChar = chars[index - 1];
    const upcoming = nextLetter(chars, index + 1);

    if (char.trim() === '') {
      parts.push(' ');
      lastVowelMark = null;
      continue;
    }

    if (SILENT_MARKS.test(char) || /[۝۞۩۔،؛]/.test(char)) {
      parts.push(' ');
      continue;
    }

    if (TANWEEN[char]) {
      parts.push(TANWEEN[char]);
      lastVowelMark = char;
      continue;
    }

    if (SHORT_VOWELS[char]) {
      parts.push(SHORT_VOWELS[char]);
      lastVowelMark = char;
      continue;
    }

    if (char === '\u0651') {
      const previousLetter = previousPronouncedLetter(chars, index - 1);
      if (previousLetter) parts.push(CONSONANTS[previousLetter]);
      continue;
    }

    if (char === '\u0652' || char === '\u0653' || char === '\u0654' || char === '\u0655') continue;

    if (char === 'ل' && (previousChar === 'ا' || previousChar === 'ٱ') && upcoming && SUN_LETTERS.has(upcoming)) {
      continue;
    }

    const longVowel = longVowelFor(char, lastVowelMark);
    if (longVowel !== null) {
      parts.push(longVowel);
      lastVowelMark = null;
      continue;
    }

    const consonant = CONSONANTS[char];
    if (consonant) {
      parts.push(consonant);
      lastVowelMark = null;
    }
  }

  return parts
    .join('')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

export async function fetchSurahAyahs(surahNumber: number): Promise<QuranAyah[]> {
  const cache = getItem<QuranCache>(NAMAZ_STORAGE_KEYS.quranCache, {});
  const key = String(surahNumber);
  const cached = cache[key];

  if (cached && Date.now() - cached.savedAt < CACHE_MAX_AGE_MS) {
    return cached.ayahs.map((ayah) => ({
      ...ayah,
      pronunciation: toBanglaPronunciation(ayah.arabic),
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
