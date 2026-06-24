// ─── SelfSync Voice — Fuzzy Bilingual Intent Parser ──────────────────────
// Parses both English and Bangla voice commands with fuzzy matching.
// Uses Levenshtein distance for misspelling tolerance (like Gemini).

import type { ParsedIntent, IntentType, VoiceEntity, VoiceLanguage } from './types'

// ─── Levenshtein Distance for Fuzzy Matching ───────────────────────────────

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

function fuzzyMatch(word: string, target: string): number {
  const w = word.toLowerCase().trim()
  const t = target.toLowerCase().trim()
  if (w === t) return 1.0
  if (w.includes(t) || t.includes(w)) return 0.9
  const dist = levenshtein(w, t)
  const maxLen = Math.max(w.length, t.length)
  return Math.max(0, 1 - dist / maxLen)
}

function bestMatch(word: string, candidates: string[]): { match: string; score: number } {
  let best = { match: candidates[0], score: 0 }
  for (const c of candidates) {
    const score = fuzzyMatch(word, c)
    if (score > best.score) {
      best = { match: c, score }
    }
  }
  return best
}

// ─── Constants ─────────────────────────────────────────────────────────────

const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
const PRAYER_NAMES_BN = ['ফজর', 'যোহর', 'আসর', 'মাগরিব', 'ইশা']
const PRAYER_MAP: Record<string, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
  zuhr: 'Dhuhr', zohr: 'Dhuhr', fojor: 'Fajr',
  magrib: 'Maghrib', esha: 'Isha',
  ফজর: 'Fajr', যোহর: 'Dhuhr', আসর: 'Asr',
  মাগরিব: 'Maghrib', ইশা: 'Isha',
}

const STATUS_NAMES = ['prayed', 'missed', 'qaza', 'done', 'complete', 'completed']
const STATUS_NAMES_BN = ['পড়েছি', 'পড়িনি', 'কাজা', 'শেষ', 'সম্পন্ন', 'সেরেছি']

const PRIORITIES = ['high', 'medium', 'low', 'critical']
const PRIORITIES_BN = ['উচ্চ', 'মধ্যম', 'নিম্ন', 'ক্রিটিকাল']

const CATEGORIES = ['food', 'transport', 'shopping', 'health', 'education', 'entertainment', 'utilities', 'rent', 'other']
const CATEGORIES_BN = ['খাবার', 'পরিবহন', 'শপিং', 'স্বাস্থ্য', 'শিক্ষা', 'বিনোদন', 'ইউটিলিটি', 'ভাড়া', 'অন্যান্য']

const NAV_TARGETS = ['tasks', 'namaz', 'prayer', 'money', 'finance', 'home', 'settings', 'analytics']
const NAV_TARGETS_BN = ['টাস্ক', 'নামাজ', 'মানি', 'হোম', 'সেটিংস', 'অ্যানালিটিক্স']

const DESTRUCTIVE_PATTERNS = [
  /delete\s+(all|every)\s+(task|tasks|data|everything)/i,
  /clear\s+(all|every)\s+(task|tasks|data|everything)/i,
  /remove\s+(all|every)\s+(task|tasks|data|everything)/i,
  /reset\s+(all|every\s+)?(data|settings|everything)/i,
  /erase\s+(all|every)\s+(data|tasks)/i,
  /সব\s*(ডিলিট|মুছে|রিসেট|ক্লিয়ার)\s*(কর|দাও|ফেল)/i,
  /ডাটা\s*(ডিলিট|মুছে|রিসেট)\s*(কর|দাও)/i,
]

// ─── Language Detection ────────────────────────────────────────────────────

function detectLanguage(text: string): VoiceLanguage {
  // Check for Bengali Unicode range
  const bengaliRegex = /[\u0980-\u09FF]/
  return bengaliRegex.test(text) ? 'bn' : 'en'
}

// ─── Time Parsing ──────────────────────────────────────────────────────────

function parseTime(text: string): string | null {
  // Match "4:00 PM", "4:00", "4 PM", "16:00"
  const patterns = [
    /(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/i,
    /(\d{1,2})\s*(AM|PM|am|pm)/i,
    /(\d{1,2}):(\d{2})/,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      let hours = parseInt(match[1])
      const minutes = match[2] && match[2].length <= 2 ? parseInt(match[2]) : 0
      const ampm = (match[3] || '').toUpperCase()
      if (ampm === 'PM' && hours < 12) hours += 12
      if (ampm === 'AM' && hours === 12) hours = 0
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
  }
  return null
}

// ─── Amount Parsing ────────────────────────────────────────────────────────

function parseAmount(text: string): number | null {
  const patterns = [
    /(\d+)\s*(টাকা|taka|bdt|tk|৳)/i,
    /(\d+)\s*(dollars?|usd)/i,
    /(\d+)/,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const num = parseInt(match[1])
      if (!isNaN(num) && num > 0 && num < 10000000) return num
    }
  }
  return null
}

// ─── Main Parser ───────────────────────────────────────────────────────────

export function parseIntent(text: string): ParsedIntent {
  const normalized = text.trim().toLowerCase()
  const language = detectLanguage(normalized)
  const isDestructive = DESTRUCTIVE_PATTERNS.some((p) => p.test(normalized))

  // If destructive, block immediately
  if (isDestructive) {
    return {
      intent: 'destructive',
      entities: {},
      confidence: 1.0,
      raw: text,
      language,
      isDestructive: true,
    }
  }

  // Try to parse
  const result = language === 'bn' ? parseBangla(normalized, text) : parseEnglish(normalized, text)
  return result
}

function parseEnglish(normalized: string, original: string): ParsedIntent {
  const entities: VoiceEntity = {}

  // ── Namaz: log prayer ──
  // "log fajr as prayed", "mark dhuhr missed", "fajr prayed", "today fajr done"
  let match = normalized.match(/(log|mark)\s+(\w+)\s+(as\s+)?(\w+)/i)
  if (!match) match = normalized.match(/^(\w+)\s+(prayed|missed|qaza|done)/i)
  if (!match) match = normalized.match(/^(today|now)\s+(\w+)\s+(prayed|missed|qaza|done|complete|completed)/i)
  if (match) {
    const hasTodayPrefix = match[1] === 'today' || match[1] === 'now'
    const prayerMatch = bestMatch(hasTodayPrefix ? match[2] : (match[1] || match[2]), PRAYER_NAMES)
    const statusMatch = bestMatch(hasTodayPrefix ? match[3] : (match[4] || match[2]), STATUS_NAMES)
    if (prayerMatch.score > 0.6 && statusMatch.score > 0.6) {
      const prayer = PRAYER_MAP[prayerMatch.match] || prayerMatch.match
      const status = statusMatch.match === 'prayed' || statusMatch.match === 'done' || statusMatch.match === 'complete' || statusMatch.match === 'completed'
        ? 'prayed' : statusMatch.match
      return {
        intent: 'log_prayer',
        entities: { prayer: prayer.charAt(0).toUpperCase() + prayer.slice(1), status },
        confidence: (prayerMatch.score + statusMatch.score) / 2,
        raw: original,
        language: 'en',
        isDestructive: false,
      }
    }
  }

  // ── Namaz: set jamat/azan ──
  // "set dhuhr jamat at 4:00 PM", "set fajr azan at 5:00"
  match = normalized.match(/set\s+(\w+)\s+(jamat|azan)\s+(at\s+)?(.+)/i)
  if (match) {
    const prayerMatch = bestMatch(match[1], PRAYER_NAMES)
    const time = parseTime(match[4])
    if (prayerMatch.score > 0.6 && time) {
      const prayer = PRAYER_MAP[prayerMatch.match] || prayerMatch.match
      return {
        intent: match[2] === 'jamat' ? 'set_jamat' : 'set_azan',
        entities: { prayer: prayer.charAt(0).toUpperCase() + prayer.slice(1), time },
        confidence: prayerMatch.score * 0.9 + (time ? 0.1 : 0),
        raw: original,
        language: 'en',
        isDestructive: false,
      }
    }
  }

  // ── Namaz: next prayer ──
  if (/next\s+prayer/i.test(normalized) || /prayer\s+time/i.test(normalized) || /when\s+is\s+(next\s+)?prayer/i.test(normalized)) {
    return { intent: 'next_prayer', entities: {}, confidence: 0.9, raw: original, language: 'en', isDestructive: false }
  }

  // ── Namaz: prayer streak ──
  if (/(prayer|namaz)\s+streak/i.test(normalized) || /streak/i.test(normalized)) {
    return { intent: 'prayer_streak', entities: {}, confidence: 0.85, raw: original, language: 'en', isDestructive: false }
  }

  // ── Tasks: add task ──
  // "add a task called buy groceries", "add task buy milk high priority"
  // "set a task reading book from 16 june to 17 june"
  match = normalized.match(/add\s+(a\s+)?task\s+(called\s+|named\s+)?["""]?(.+?)["""]?(\s+(high|medium|low)\s+priority)?/i)
  if (!match) match = normalized.match(/new\s+task\s+(called\s+|named\s+)?["""]?(.+?)["""]?/i)
  if (!match) match = normalized.match(/set\s+(a\s+)?task\s+(name\s+)?["""]?(.+?)["""]?(\s+from\s+(.+?)\s+to\s+(.+))?/i)
  if (match) {
    const title = (match[3] || match[2] || '').trim()
    const priority = match[5] || 'medium'
    if (title.length > 1) {
      return {
        intent: 'add_task',
        entities: { taskTitle: title, priority },
        confidence: 0.85,
        raw: original,
        language: 'en',
        isDestructive: false,
      }
    }
  }

  // ── Tasks: complete task ──
  // "mark buy groceries done", "complete task buy milk"
  match = normalized.match(/mark\s+(task\s+)?["""]?(.+?)["""]?\s+(as\s+)?(done|complete|completed)/i)
  if (!match) match = normalized.match(/complete\s+(task\s+)?["""]?(.+?)["""]?/i)
  if (match) {
    const title = (match[2] || '').trim()
    if (title.length > 1) {
      return { intent: 'complete_task', entities: { taskTitle: title }, confidence: 0.8, raw: original, language: 'en', isDestructive: false }
    }
  }

  // ── Tasks: list today's tasks ──
  if (/(what\s+(are|is)\s+my|show|list)\s+(today'?s?\s+)?(task|tasks)/i.test(normalized)) {
    return { intent: 'list_tasks', entities: {}, confidence: 0.85, raw: original, language: 'en', isDestructive: false }
  }

  // ── Money: add expense ──
  // "add 500 taka for lunch", "spent 300 on food"
  match = normalized.match(/(add|spent|spend|expense|খরচ)\s+(\d+)\s*(টাকা|taka|bdt|tk|৳)?\s*(for|on)?\s*(.+)?/i)
  if (match) {
    const amount = parseInt(match[2])
    const note = (match[5] || '').trim()
    if (!isNaN(amount) && amount > 0) {
      // Check for category
      let category = 'other'
      if (note) {
        const catMatch = bestMatch(note, CATEGORIES)
        if (catMatch.score > 0.5) category = catMatch.match
      }
      return {
        intent: 'add_expense',
        entities: { amount, note, category },
        confidence: 0.85,
        raw: original,
        language: 'en',
        isDestructive: false,
      }
    }
  }

  // ── Money: add income ──
  match = normalized.match(/(income|earned|salary|received|pay|payment)\s+(\d+)/i)
  if (match) {
    const amount = parseInt(match[2])
    if (!isNaN(amount) && amount > 0) {
      return { intent: 'add_income', entities: { amount, note: match[1] }, confidence: 0.8, raw: original, language: 'en', isDestructive: false }
    }
  }

  // ── Money: check balance ──
  if (/(how\s+much|what'?s?\s+my|check|show)\s+(money|balance|do I have)/i.test(normalized)) {
    return { intent: 'check_balance', entities: {}, confidence: 0.9, raw: original, language: 'en', isDestructive: false }
  }

  // ── Money: month summary ──
  if (/(how\s+much|what)\s+(did I|have I|I)\s+(spend|spent)\s+(this\s+)?(month|week)/i.test(normalized)) {
    return { intent: 'month_summary', entities: {}, confidence: 0.85, raw: original, language: 'en', isDestructive: false }
  }

  // ── Health: log weight ──
  match = normalized.match(/(log|record|save|add)\s+(my\s+)?weight\s+(\d+)/i)
  if (match) {
    const weight = parseInt(match[3])
    if (!isNaN(weight) && weight > 20 && weight < 350) {
      return { intent: 'log_weight', entities: { weight }, confidence: 0.9, raw: original, language: 'en', isDestructive: false }
    }
  }

  // ── Health: check BMI ──
  if (/(what'?s?\s+my|check|show)\s+(bmi|body\s+mass\s+index)/i.test(normalized)) {
    return { intent: 'check_bmi', entities: {}, confidence: 0.9, raw: original, language: 'en', isDestructive: false }
  }

  // ── Navigation ──
  match = normalized.match(/(go\s+to|open|show|navigate\s+to)\s+(.+)/i)
  if (match) {
    const target = match[2].trim()
    const targetMatch = bestMatch(target, NAV_TARGETS)
    if (targetMatch.score > 0.5) {
      return { intent: 'navigate', entities: { target: targetMatch.match }, confidence: targetMatch.score, raw: original, language: 'en', isDestructive: false }
    }
  }

  // ── Greeting ──
  if (/^(hello|hi|hey|assalamu'?alaikum|assalamualaikum|salam)\b/i.test(normalized)) {
    return { intent: 'greeting', entities: {}, confidence: 1.0, raw: original, language: 'en', isDestructive: false }
  }

  // ── Help ──
  if (/(what\s+can\s+you\s+do|help|commands)/i.test(normalized)) {
    return { intent: 'help', entities: {}, confidence: 1.0, raw: original, language: 'en', isDestructive: false }
  }

  // ── Stop ──
  if (/(stop|exit|cancel|close)\s*(listening|voice)?/i.test(normalized)) {
    return { intent: 'stop_listening', entities: {}, confidence: 1.0, raw: original, language: 'en', isDestructive: false }
  }

  // ── Status ──
  if (/(what'?s?\s+my|my)\s+(status|score|wellness)/i.test(normalized)) {
    return { intent: 'status', entities: {}, confidence: 0.8, raw: original, language: 'en', isDestructive: false }
  }

  // Unknown
  return { intent: 'help', entities: {}, confidence: 0.3, raw: original, language: 'en', isDestructive: false }
}

function parseBangla(normalized: string, original: string): ParsedIntent {
  const entities: VoiceEntity = {}

  // ── Namaz: log prayer (Bangla) ──
  // "ফজর পড়েছি", "যোহর পড়িনি", "মাগরিব কাজা"
  let match = normalized.match(/(ফজর|যোহর|আসর|মাগরিব|ইশা)\s*(পড়েছি|পড়িনি|কাজা|শেষ)/i)
  if (match) {
    const prayer = PRAYER_MAP[match[1]] || match[1]
    const statusMap: Record<string, string> = { পড়েছি: 'prayed', পড়িনি: 'missed', কাজা: 'qaza', শেষ: 'prayed' }
    const status = statusMap[match[2]] || 'prayed'
    return { intent: 'log_prayer', entities: { prayer, status }, confidence: 0.9, raw: original, language: 'bn', isDestructive: false }
  }

  // ── Namaz: set jamat (Bangla) ──
  // "যোহর জামাত সেট কর ৪:০০", "ফজর আযান ৫:০০"
  match = normalized.match(/(ফজর|যোহর|আসর|মাগরিব|ইশা)\s*(জামাত|আযান)\s*(সেট\s*কর)?\s*(\d{1,2}:\d{2})/i)
  if (match) {
    const prayer = PRAYER_MAP[match[1]] || match[1]
    const time = parseTime(match[4]) || match[4]
    return {
      intent: match[2] === 'জামাত' ? 'set_jamat' : 'set_azan',
      entities: { prayer, time },
      confidence: 0.85,
      raw: original,
      language: 'bn',
      isDestructive: false,
    }
  }

  // ── Namaz: next prayer (Bangla) ──
  if (/পরের\s*নামাজ|নামাজের\s*সময়|কখন\s*নামাজ/i.test(normalized)) {
    return { intent: 'next_prayer', entities: {}, confidence: 0.9, raw: original, language: 'bn', isDestructive: false }
  }

  // ── Namaz: streak (Bangla) ──
  if (/streak|ধারাবাহিকতা/i.test(normalized)) {
    return { intent: 'prayer_streak', entities: {}, confidence: 0.8, raw: original, language: 'bn', isDestructive: false }
  }

  // ── Tasks: add task (Bangla) ──
  // "নতুন টাস্ক যোগ কর বাজার করা"
  match = normalized.match(/নতুন\s*(টাস্ক|কাজ)\s*(যোগ\s*কর)?\s*(বলো|নাম)?\s*(.+)/i)
  if (match) {
    const title = match[4]?.trim()
    if (title && title.length > 1) {
      return { intent: 'add_task', entities: { taskTitle: title, priority: 'medium' }, confidence: 0.8, raw: original, language: 'bn', isDestructive: false }
    }
  }

  // ── Tasks: complete (Bangla) ──
  match = normalized.match(/(.+?)\s*(শেষ|done|complete|করেছি)\s*/i)
  if (match && match[1].length > 1) {
    return { intent: 'complete_task', entities: { taskTitle: match[1].trim() }, confidence: 0.7, raw: original, language: 'bn', isDestructive: false }
  }

  // ── Tasks: list (Bangla) ──
  if (/(আজকের\s*)?(টাস্ক|কাজ)\s*(কী|দেখাও|বলো)/i.test(normalized)) {
    return { intent: 'list_tasks', entities: {}, confidence: 0.85, raw: original, language: 'bn', isDestructive: false }
  }

  // ── Money: add expense (Bangla) ──
  // "৫০০ টাকা খরচ হয়েছে লাঞ্চের জন্য"
  match = normalized.match(/(\d+)\s*(টাকা|taka)\s*(খরচ|expense)\s*(হয়েছে|করেছি)?\s*(.+)?/i)
  if (match) {
    const amount = parseInt(match[1])
    const note = (match[5] || '').trim()
    if (!isNaN(amount) && amount > 0) {
      return { intent: 'add_expense', entities: { amount, note, category: 'other' }, confidence: 0.85, raw: original, language: 'bn', isDestructive: false }
    }
  }

  // ── Money: check balance (Bangla) ──
  if (/(কত\s*টাকা|ব্যালেন্স|টাকা\s*আছে)/i.test(normalized)) {
    return { intent: 'check_balance', entities: {}, confidence: 0.9, raw: original, language: 'bn', isDestructive: false }
  }

  // ── Money: month summary (Bangla) ──
  if (/(এই\s*)?(মাসে|সপ্তাহে)\s*(কত\s*)?(খরচ|expense)/i.test(normalized)) {
    return { intent: 'month_summary', entities: {}, confidence: 0.85, raw: original, language: 'bn', isDestructive: false }
  }

  // ── Health: log weight (Bangla) ──
  match = normalized.match(/(ওজন|weight)\s*(লগ\s*কর)?\s*(\d+)/i)
  if (match) {
    const weight = parseInt(match[3])
    if (!isNaN(weight) && weight > 20 && weight < 350) {
      return { intent: 'log_weight', entities: { weight }, confidence: 0.9, raw: original, language: 'bn', isDestructive: false }
    }
  }

  // ── Navigation (Bangla) ──
  match = normalized.match(/(টাস্ক|নামাজ|মানি|হোম|সেটিংস|অ্যানালিটিক্স)\s*(এ\s*যাও|খোল|দেখাও)/i)
  if (match) {
    const targetMap: Record<string, string> = {
      টাস্ক: 'tasks', নামাজ: 'namaz', মানি: 'money', হোম: 'home', সেটিংস: 'settings', অ্যানালিটিক্স: 'analytics',
    }
    return { intent: 'navigate', entities: { target: targetMap[match[1]] || match[1] }, confidence: 0.9, raw: original, language: 'bn', isDestructive: false }
  }

  // ── Greeting (Bangla) ──
  if (/^(সালাম|হ্যালো|হাই|আসসালামু আলাইকুম)/i.test(normalized)) {
    return { intent: 'greeting', entities: {}, confidence: 1.0, raw: original, language: 'bn', isDestructive: false }
  }

  // ── Help (Bangla) ──
  if (/(কী\s*করতে\s*পারো|কমান্ড|সাহায্য|help)/i.test(normalized)) {
    return { intent: 'help', entities: {}, confidence: 1.0, raw: original, language: 'bn', isDestructive: false }
  }

  // ── Stop (Bangla) ──
  if (/(বন্ধ\s*কর|থাম|stop)/i.test(normalized)) {
    return { intent: 'stop_listening', entities: {}, confidence: 1.0, raw: original, language: 'bn', isDestructive: false }
  }

  // Unknown
  return { intent: 'help', entities: {}, confidence: 0.3, raw: original, language: 'bn', isDestructive: false }
}