// ── Notes Feature Types (Enhanced Premium) ──

export type NoteType = 'text' | 'password' | 'image' | 'link'

export type NoteCategory =
  | 'personal'
  | 'work'
  | 'finance'
  | 'social'
  | 'education'
  | 'health'
  | 'other'

export type NoteStatus = 'active' | 'archived' | 'trashed'

export interface BaseNote {
  id: string
  type: NoteType
  title: string
  category: NoteCategory
  tags: string[]
  pinned: boolean
  pinnedAt?: number
  archivedAt?: number
  trashedAt?: number
  createdAt: number
  updatedAt: number
  /** Reminder timestamp (epoch ms) */
  reminderAt?: number
  /** If note was created from a template */
  templateId?: string
  /** Custom accent color override */
  accentColor?: string
  /** Linked note IDs (wiki-style [[links]]) */
  linkedNoteIds?: string[]
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

// ── Templates ──

export interface NoteTemplate {
  id: string
  name: string
  emoji: string
  description: string
  type: NoteType
  category: NoteCategory
  presetBody?: string
  presetTags?: string[]
  fields: TemplateField[]
}

export interface TemplateField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'select'
  placeholder?: string
  options?: string[]
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'meeting',
    name: 'Meeting Notes',
    emoji: '📋',
    description: 'Agenda, action items, attendees',
    type: 'text',
    category: 'work',
    presetTags: ['meeting'],
    fields: [
      { key: 'attendees', label: 'Attendees', type: 'text', placeholder: 'John, Sarah, ...' },
      { key: 'agenda', label: 'Agenda', type: 'textarea', placeholder: 'Main topics...' },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Key points...' },
      { key: 'actionItems', label: 'Action Items', type: 'textarea', placeholder: 'Follow-ups...' },
    ],
    presetBody: '# Meeting Notes\n\n## Attendees\n\n## Agenda\n\n## Notes\n\n## Action Items\n',
  },
  {
    id: 'daily-journal',
    name: 'Daily Journal',
    emoji: '📓',
    description: 'Mood, highlights, gratitude',
    type: 'text',
    category: 'personal',
    presetTags: ['journal'],
    fields: [
      { key: 'mood', label: 'Mood (1-10)', type: 'text', placeholder: '8' },
      { key: 'highlight', label: 'Today\'s Highlight', type: 'textarea' },
      { key: 'gratitude', label: 'Grateful For', type: 'textarea' },
    ],
    presetBody: '# Daily Journal\n\n**Mood:** \n\n## Today\'s Highlight\n\n## Grateful For\n\n## Notes\n',
  },
  {
    id: 'idea',
    name: 'Idea Brainstorm',
    emoji: '💡',
    description: 'Capture and develop ideas',
    type: 'text',
    category: 'personal',
    presetTags: ['idea'],
    fields: [
      { key: 'problem', label: 'Problem', type: 'textarea' },
      { key: 'solution', label: 'Solution Idea', type: 'textarea' },
      { key: 'nextSteps', label: 'Next Steps', type: 'textarea' },
    ],
    presetBody: '# Idea\n\n**Problem:** \n\n**Solution:** \n\n**Next Steps:** \n',
  },
  {
    id: 'study',
    name: 'Study Notes',
    emoji: '📚',
    description: 'Subject, key concepts, summary',
    type: 'text',
    category: 'education',
    presetTags: ['study'],
    fields: [
      { key: 'subject', label: 'Subject', type: 'text' },
      { key: 'concepts', label: 'Key Concepts', type: 'textarea' },
      { key: 'summary', label: 'Summary', type: 'textarea' },
    ],
    presetBody: '# Study Notes\n\n**Subject:** \n\n## Key Concepts\n\n## Summary\n',
  },
  {
    id: 'project',
    name: 'Project Note',
    emoji: '🚀',
    description: 'Goals, timeline, resources',
    type: 'text',
    category: 'work',
    presetTags: ['project'],
    fields: [
      { key: 'goals', label: 'Goals', type: 'textarea' },
      { key: 'timeline', label: 'Timeline', type: 'text', placeholder: 'Q1 2025' },
      { key: 'resources', label: 'Resources', type: 'textarea' },
    ],
    presetBody: '# Project\n\n**Goals:** \n\n**Timeline:** \n\n**Resources:** \n',
  },
]

// ── Analytics Types ──

export interface NoteAnalytics {
  totalNotes: number
  totalWords: number
  writingStreak: number
  longestStreak: number
  mostProductiveDay: string
  categoryDistribution: Record<string, number>
  monthlyCounts: Record<string, number>
  topTags: { tag: string; count: number }[]
  notesThisWeek: number
  pinnedCount: number
  archivedCount: number
  trashedCount: number
}

// ── Sort / Filter Types ──

export type NoteSortKey = 'newest' | 'oldest' | 'updated' | 'title' | 'pinned'
export type NoteFilterStatus = 'all' | 'active' | 'archived' | 'trashed'

export interface NoteSearchOptions {
  query: string
  category: string
  type: NoteType | 'all'
  status: NoteFilterStatus
  sortBy: NoteSortKey
  tags: string[]
  dateFrom?: number
  dateTo?: number
}