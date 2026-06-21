// ── Notes Feature Types ──

export type NoteType = 'text' | 'password' | 'image' | 'link'

export type NoteCategory =
  | 'personal'
  | 'work'
  | 'finance'
  | 'social'
  | 'education'
  | 'health'
  | 'other'

export interface BaseNote {
  id: string
  type: NoteType
  title: string
  category: NoteCategory
  tags: string[]
  pinned: boolean
  createdAt: number
  updatedAt: number
}

export interface TextNote extends BaseNote {
  type: 'text'
  body: string
}

export interface PasswordEntry extends BaseNote {
  type: 'password'
  username: string
  password: string
  url: string
}

export interface ImageNote extends BaseNote {
  type: 'image'
  dataUrl: string
  caption: string
}

export interface LinkNote extends BaseNote {
  type: 'link'
  url: string
  description: string
}

export type Note = TextNote | PasswordEntry | ImageNote | LinkNote

export interface NoteCollection {
  notes: Note[]
}

export const NOTE_CATEGORIES: { value: NoteCategory; label: string; emoji: string }[] = [
  { value: 'personal', label: 'Personal', emoji: '👤' },
  { value: 'work', label: 'Work', emoji: '💼' },
  { value: 'finance', label: 'Finance', emoji: '💰' },
  { value: 'social', label: 'Social', emoji: '🤝' },
  { value: 'education', label: 'Education', emoji: '📚' },
  { value: 'health', label: 'Health', emoji: '❤️' },
  { value: 'other', label: 'Other', emoji: '📌' },
]

export const NOTE_CATEGORY_COLORS: Record<NoteCategory, string> = {
  personal: '#6366f1',
  work: '#f59e0b',
  finance: '#10b981',
  social: '#ec4899',
  education: '#3b82f6',
  health: '#ef4444',
  other: '#8b5cf6',
}