// ── Notes Zustand Store with localStorage Persistence (Premium Enhanced) ──

import { create } from 'zustand'
import { Note, NoteType, NoteCategory, NoteStatus, NoteSortKey, NoteAnalytics } from '../types'

const STORAGE_KEY = 'az-notes'
const TRASH_AUTO_EMPTY_DAYS = 30

function loadNotes(): Note[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveNotes(notes: Note[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch (e) {
    console.warn('Failed to save notes:', e)
  }
}

let noteCounter = 0
function generateId(): string {
  noteCounter++
  return `note_${Date.now()}_${noteCounter}_${Math.random().toString(36).slice(2, 8)}`
}

// ── Analytics Helpers (memoized, runs only when notes change) ──

function computeAnalytics(notes: Note[]): NoteAnalytics {
  const active = notes.filter((n) => !n.trashedAt && !n.archivedAt)
  const trashed = notes.filter((n) => n.trashedAt)
  const archived = notes.filter((n) => n.archivedAt)

  // Total words in text notes
  let totalWords = 0
  active.forEach((n) => {
    if (n.type === 'text') {
      totalWords += (n as any).body?.split(/\s+/).filter(Boolean).length || 0
    }
  })

  // Writing streak (consecutive days with at least one note created/updated)
  const dates = new Set<string>()
  active.forEach((n) => {
    const d = new Date(n.createdAt).toISOString().split('T')[0]
    dates.add(d)
    const ud = new Date(n.updatedAt).toISOString().split('T')[0]
    dates.add(ud)
  })
  const sortedDates = Array.from(dates).sort().reverse()
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  const checkDate = new Date(today)
  for (const d of sortedDates) {
    const expected = checkDate.toISOString().split('T')[0]
    if (d === expected) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  // Longest streak
  let longest = 0
  let current = 0
  const ascDates = Array.from(dates).sort()
  for (let i = 0; i < ascDates.length; i++) {
    if (i === 0) {
      current = 1
    } else {
      const prev = new Date(ascDates[i - 1])
      const curr = new Date(ascDates[i])
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000)
      if (diffDays === 1) {
        current++
      } else {
        current = 1
      }
    }
    longest = Math.max(longest, current)
  }

  // Most productive day of week
  const dayCounts: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 }
  active.forEach((n) => {
    const day = new Date(n.createdAt).toLocaleDateString('en-US', { weekday: 'short' })
    dayCounts[day] = (dayCounts[day] || 0) + 1
  })
  const mostProductiveDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Mon'

  // Category distribution
  const categoryDistribution: Record<string, number> = {}
  active.forEach((n) => {
    categoryDistribution[n.category] = (categoryDistribution[n.category] || 0) + 1
  })

  // Monthly counts (last 6 months)
  const monthlyCounts: Record<string, number> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyCounts[key] = 0
  }
  active.forEach((n) => {
    const d = new Date(n.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (monthlyCounts[key] !== undefined) monthlyCounts[key]++
  })

  // Top tags
  const tagCounts: Record<string, number> = {}
  active.forEach((n) => {
    n.tags.forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1
    })
  })
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }))

  // Notes this week
  const weekAgo = Date.now() - 7 * 86400000
  const notesThisWeek = active.filter((n) => n.createdAt > weekAgo).length

  return {
    totalNotes: active.length,
    totalWords,
    writingStreak: streak,
    longestStreak: longest,
    mostProductiveDay,
    categoryDistribution,
    monthlyCounts,
    topTags,
    notesThisWeek,
    pinnedCount: active.filter((n) => n.pinned).length,
    archivedCount: archived.length,
    trashedCount: trashed.length,
  }
}

interface NotesState {
  notes: Note[]
  searchQuery: string
  statusFilter: NoteStatus
  categoryFilter: string
  typeFilter: NoteType | 'all'
  sortBy: NoteSortKey
  analytics: NoteAnalytics

  // Actions
  addNote: (
    type: NoteType,
    data: {
      title: string
      category: NoteCategory
      tags?: string[]
      body?: string
      username?: string
      password?: string
      url?: string
      dataUrl?: string
      caption?: string
      description?: string
      templateId?: string
      accentColor?: string
    }
  ) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  softDeleteNote: (id: string) => void
  restoreNote: (id: string) => void
  permanentDeleteNote: (id: string) => void
  emptyTrash: () => void
  archiveNote: (id: string) => void
  unarchiveNote: (id: string) => void
  togglePin: (id: string) => void
  setSearchQuery: (q: string) => void
  setStatusFilter: (s: NoteStatus) => void
  setCategoryFilter: (c: string) => void
  setTypeFilter: (t: NoteType | 'all') => void
  setSortBy: (s: NoteSortKey) => void
  setReminder: (id: string, reminderAt: number | undefined) => void
  linkNotes: (sourceId: string, targetId: string) => void
  unlinkNote: (sourceId: string, targetId: string) => void
  getFilteredNotes: () => Note[]
  getDueReminders: () => Note[]
  markReminderFired: (id: string) => void
  autoEmptyTrash: () => void
  refreshAnalytics: () => void
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: loadNotes(),
  searchQuery: '',
  statusFilter: 'active',
  categoryFilter: 'all',
  typeFilter: 'all',
  sortBy: 'pinned',
  analytics: computeAnalytics(loadNotes()),

  addNote: (type, data) => {
    const now = Date.now()
    const base = {
      id: generateId(),
      type,
      title: data.title,
      category: data.category,
      tags: data.tags ?? [],
      pinned: false,
      createdAt: now,
      updatedAt: now,
      templateId: data.templateId,
      accentColor: data.accentColor,
    }

    let note: Note
    switch (type) {
      case 'text':
        note = { ...base, type: 'text', body: data.body ?? '' } as Note
        break
      case 'password':
        note = {
          ...base,
          type: 'password',
          username: data.username ?? '',
          password: data.password ?? '',
          url: data.url ?? '',
        } as Note
        break
      case 'image':
        note = {
          ...base,
          type: 'image',
          dataUrl: data.dataUrl ?? '',
          caption: data.caption ?? '',
        } as Note
        break
      case 'link':
        note = {
          ...base,
          type: 'link',
          url: data.url ?? '',
          description: data.description ?? '',
        } as Note
        break
      default:
        return
    }

    const notes = [note, ...get().notes]
    set({ notes, analytics: computeAnalytics(notes) })
    saveNotes(notes)
  },

  updateNote: (id, updates) => {
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, ...updates, updatedAt: Date.now() } as Note : n
    )
    set({ notes, analytics: computeAnalytics(notes) })
    saveNotes(notes)
  },

  deleteNote: (id) => {
    const notes = get().notes.filter((n) => n.id !== id)
    set({ notes, analytics: computeAnalytics(notes) })
    saveNotes(notes)
  },

  softDeleteNote: (id) => {
    const now = Date.now()
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, trashedAt: now, archivedAt: undefined, updatedAt: now } as Note : n
    )
    set({ notes, analytics: computeAnalytics(notes) })
    saveNotes(notes)
  },

  restoreNote: (id) => {
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, trashedAt: undefined, updatedAt: Date.now() } as Note : n
    )
    set({ notes, analytics: computeAnalytics(notes) })
    saveNotes(notes)
  },

  permanentDeleteNote: (id) => {
    const notes = get().notes.filter((n) => n.id !== id)
    set({ notes, analytics: computeAnalytics(notes) })
    saveNotes(notes)
  },

  emptyTrash: () => {
    const notes = get().notes.filter((n) => !n.trashedAt)
    set({ notes, analytics: computeAnalytics(notes) })
    saveNotes(notes)
  },

  archiveNote: (id) => {
    const now = Date.now()
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, archivedAt: now, trashedAt: undefined, updatedAt: now } as Note : n
    )
    set({ notes, analytics: computeAnalytics(notes) })
    saveNotes(notes)
  },

  unarchiveNote: (id) => {
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, archivedAt: undefined, updatedAt: Date.now() } as Note : n
    )
    set({ notes, analytics: computeAnalytics(notes) })
    saveNotes(notes)
  },

  togglePin: (id) => {
    const now = Date.now()
    const notes = get().notes.map((n) =>
      n.id === id
        ? { ...n, pinned: !n.pinned, pinnedAt: n.pinned ? undefined : now, updatedAt: now } as Note
        : n
    )
    set({ notes, analytics: computeAnalytics(notes) })
    saveNotes(notes)
  },

  setSearchQuery: (q) => set({ searchQuery: q }),

  setStatusFilter: (s) => set({ statusFilter: s }),
  setCategoryFilter: (c) => set({ categoryFilter: c }),
  setTypeFilter: (t) => set({ typeFilter: t }),
  setSortBy: (s) => set({ sortBy: s }),

  setReminder: (id, reminderAt) => {
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, reminderAt, updatedAt: Date.now() } as Note : n
    )
    set({ notes })
    saveNotes(notes)
  },

  linkNotes: (sourceId, targetId) => {
    const notes = get().notes.map((n) => {
      if (n.id === sourceId) {
        const linked = n.linkedNoteIds ?? []
        if (!linked.includes(targetId)) {
          return { ...n, linkedNoteIds: [...linked, targetId], updatedAt: Date.now() } as Note
        }
      }
      if (n.id === targetId) {
        const linked = n.linkedNoteIds ?? []
        if (!linked.includes(sourceId)) {
          return { ...n, linkedNoteIds: [...linked, sourceId], updatedAt: Date.now() } as Note
        }
      }
      return n
    })
    set({ notes })
    saveNotes(notes)
  },

  unlinkNote: (sourceId, targetId) => {
    const notes = get().notes.map((n) => {
      if (n.id === sourceId && n.linkedNoteIds) {
        return { ...n, linkedNoteIds: n.linkedNoteIds.filter((id) => id !== targetId), updatedAt: Date.now() } as Note
      }
      if (n.id === targetId && n.linkedNoteIds) {
        return { ...n, linkedNoteIds: n.linkedNoteIds.filter((id) => id !== sourceId), updatedAt: Date.now() } as Note
      }
      return n
    })
    set({ notes })
    saveNotes(notes)
  },

  getFilteredNotes: () => {
    const { notes, searchQuery, statusFilter, categoryFilter, typeFilter, sortBy } = get()
    let result = [...notes]

    // Status filter
    if (statusFilter === 'active') {
      result = result.filter((n) => !n.trashedAt && !n.archivedAt)
    } else if (statusFilter === 'archived') {
      result = result.filter((n) => n.archivedAt)
    } else if (statusFilter === 'trashed') {
      result = result.filter((n) => n.trashedAt)
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((n) => n.category === categoryFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((n) => n.type === typeFilter)
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((n) => {
        if (n.title.toLowerCase().includes(q)) return true
        if (n.tags.some((t) => t.toLowerCase().includes(q))) return true
        if (n.type === 'text' && (n as any).body?.toLowerCase().includes(q)) return true
        if (n.type === 'link' && (n as any).url?.toLowerCase().includes(q)) return true
        if (n.type === 'password' && (n as any).username?.toLowerCase().includes(q)) return true
        return false
      })
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'pinned') {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return b.updatedAt - a.updatedAt
      }
      if (sortBy === 'newest') return b.createdAt - a.createdAt
      if (sortBy === 'oldest') return a.createdAt - b.createdAt
      if (sortBy === 'updated') return b.updatedAt - a.updatedAt
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      return b.updatedAt - a.updatedAt
    })

    return result
  },

  getDueReminders: () => {
    const now = Date.now()
    return get().notes.filter((n) => n.reminderAt && n.reminderAt <= now && !n.trashedAt)
  },

  markReminderFired: (id) => {
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, reminderAt: undefined } as Note : n
    )
    set({ notes })
    saveNotes(notes)
  },

  autoEmptyTrash: () => {
    const cutoff = Date.now() - TRASH_AUTO_EMPTY_DAYS * 86400000
    const notes = get().notes.filter((n) => !n.trashedAt || n.trashedAt > cutoff)
    set({ notes, analytics: computeAnalytics(notes) })
    saveNotes(notes)
  },

  refreshAnalytics: () => {
    set({ analytics: computeAnalytics(get().notes) })
  },
}))