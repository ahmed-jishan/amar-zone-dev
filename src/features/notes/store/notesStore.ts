// ── Notes Zustand Store with localStorage Persistence ──

import { create } from 'zustand'
import { Note, NoteType, NoteCategory } from '../types'

const STORAGE_KEY = 'az-notes'

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

interface NotesState {
  notes: Note[]
  searchQuery: string

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
    }
  ) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  togglePin: (id: string) => void
  setSearchQuery: (q: string) => void
  getFilteredNotes: () => Note[]
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: loadNotes(),
  searchQuery: '',

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
    set({ notes })
    saveNotes(notes)
  },

  updateNote: (id, updates) => {
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, ...updates, updatedAt: Date.now() } as Note : n
    )
    set({ notes })
    saveNotes(notes)
  },

  deleteNote: (id) => {
    const notes = get().notes.filter((n) => n.id !== id)
    set({ notes })
    saveNotes(notes)
  },

  togglePin: (id) => {
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } as Note : n
    )
    set({ notes })
    saveNotes(notes)
  },

  setSearchQuery: (q) => set({ searchQuery: q }),

  getFilteredNotes: () => {
    const { notes, searchQuery } = get()
    if (!searchQuery.trim()) return notes
    const q = searchQuery.toLowerCase()
    return notes.filter((n) => {
      if (n.title.toLowerCase().includes(q)) return true
      if (n.tags.some((t) => t.toLowerCase().includes(q))) return true
      if (n.type === 'text' && (n as any).body?.toLowerCase().includes(q)) return true
      if (n.type === 'link' && (n as any).url?.toLowerCase().includes(q)) return true
      if (n.type === 'password' && (n as any).username?.toLowerCase().includes(q)) return true
      return false
    })
  },
}))