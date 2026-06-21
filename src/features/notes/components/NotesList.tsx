'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  Pin,
  Trash2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  X,
  Link as LinkIcon,
  FileText,
  Lock,
  Image as ImageIcon,
} from 'lucide-react'
import { useNotesStore } from '../store/notesStore'
import { Note, LinkNote, NOTE_CATEGORY_COLORS } from '../types'
import AddNoteModal from './AddNoteModal'

function getNoteIcon(note: Note): { emoji: string; bg: string } {
  const color = NOTE_CATEGORY_COLORS[note.category]
  switch (note.type) {
    case 'text':
      return { emoji: '📄', bg: `${color}15` }
    case 'link':
      return { emoji: '🔗', bg: `${color}15` }
    case 'password':
      return { emoji: '🔒', bg: `${color}15` }
    case 'image':
      return { emoji: '🖼️', bg: `${color}15` }
  }
}

function getPreview(note: Note): string {
  switch (note.type) {
    case 'text':
      return (note as any).body?.slice(0, 80) || 'No content'
    case 'link':
      return (note as any).url || 'No URL'
    case 'password':
      return `Username: ${(note as any).username || 'Not set'}`
    case 'image':
      return (note as any).caption || 'No caption'
  }
}

export default function NotesList() {
  const notes = useNotesStore((s) => s.notes)
  const searchQuery = useNotesStore((s) => s.searchQuery)
  const setSearchQuery = useNotesStore((s) => s.setSearchQuery)
  const getFilteredNotes = useNotesStore((s) => s.getFilteredNotes)
  const deleteNote = useNotesStore((s) => s.deleteNote)
  const togglePin = useNotesStore((s) => s.togglePin)

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    let result = getFilteredNotes()
    if (categoryFilter !== 'all') {
      result = result.filter((n) => n.category === categoryFilter)
    }
    // Pinned first, then by updatedAt desc
    return result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return b.updatedAt - a.updatedAt
    })
  }, [getFilteredNotes, categoryFilter])

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    }
  }, [])

  const handleOpenLink = useCallback((url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      window.open(`https://${url}`, '_blank', 'noopener,noreferrer')
    }
  }, [])

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--hm-muted)]"
        />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes..."
          className="w-full bg-[var(--hm-soft)] border border-[var(--hm-border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--hm-text)] placeholder:text-[var(--hm-muted)] outline-none focus:border-[var(--hm-accent)] transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--hm-muted)] hover:text-[var(--hm-text)]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {['all', 'personal', 'work', 'finance', 'social', 'education', 'health', 'other'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              categoryFilter === cat
                ? 'text-white shadow-sm'
                : 'bg-[var(--hm-soft)] text-[var(--hm-muted)] hover:bg-[var(--hm-border)]'
            }`}
            style={{
              background:
                categoryFilter === cat
                  ? cat === 'all'
                    ? 'var(--hm-accent)'
                    : NOTE_CATEGORY_COLORS[cat as keyof typeof NOTE_CATEGORY_COLORS]
                  : undefined,
            }}
          >
            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Notes Grid / List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-[var(--hm-muted)] text-sm">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </p>
            <button
              onClick={() => setAddModalOpen(true)}
              className="mt-3 px-4 py-2 rounded-xl bg-[var(--hm-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Create your first note
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((note) => {
              const icon = getNoteIcon(note)
              const isPasswordVisible = showPasswords.has(note.id)
              const noteColor = NOTE_CATEGORY_COLORS[note.category]

              return (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="hm-note-card"
                  onClick={() => setSelectedNote(note)}
                >
                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                        style={{ background: icon.bg }}
                      >
                        {icon.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-[var(--hm-text)] truncate">
                            {note.title}
                          </span>
                          {note.pinned && <Pin size={12} className="text-[var(--hm-accent)] flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{
                              background: `${noteColor}20`,
                              color: noteColor,
                            }}
                          >
                            {note.type.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-[var(--hm-muted)]">
                            {new Date(note.updatedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview / Content */}
                  {note.type === 'text' && (
                    <p className="note-preview mt-2">{getPreview(note)}</p>
                  )}

                  {note.type === 'link' && (
                    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <LinkIcon size={12} className="text-[var(--hm-muted)] flex-shrink-0" />
                        <span className="text-xs text-[var(--hm-muted)] truncate flex-1">
                          {(note as any).url}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleCopy((note as any).url, `copy_${note.id}`)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--hm-soft)] text-xs text-[var(--hm-muted)] hover:text-[var(--hm-accent)] transition-colors"
                        >
                          <Copy size={11} />
                          {copiedId === `copy_${note.id}` ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          onClick={() => handleOpenLink((note as any).url)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--hm-soft)] text-xs text-[var(--hm-muted)] hover:text-[var(--hm-green)] transition-colors"
                        >
                          <ExternalLink size={11} />
                          Open
                        </button>
                      </div>
                    </div>
                  )}

                  {note.type === 'password' && (
                    <div className="mt-2 space-y-1" onClick={(e) => e.stopPropagation()}>
                      <div className="text-xs text-[var(--hm-muted)]">
                        Username: {(note as any).username || 'Not set'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--hm-muted)]">Password:</span>
                        <span className="text-xs font-mono text-[var(--hm-text)]">
                          {isPasswordVisible ? (note as any).password : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(note.id)}
                          className="text-[var(--hm-muted)] hover:text-[var(--hm-accent)] transition-colors"
                        >
                          {isPasswordVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        {(note as any).password && (
                          <button
                            onClick={() => handleCopy((note as any).password, `pass_${note.id}`)}
                            className="text-[var(--hm-muted)] hover:text-[var(--hm-accent)] transition-colors"
                          >
                            <Copy size={11} />
                          </button>
                        )}
                      </div>
                      {(note as any).url && (
                        <div className="flex items-center gap-2 pt-1">
                          <LinkIcon size={11} className="text-[var(--hm-muted)]" />
                          <span className="text-xs text-[var(--hm-muted)] truncate flex-1">
                            {(note as any).url}
                          </span>
                          <button
                            onClick={() => handleCopy((note as any).url, `url_${note.id}`)}
                            className="text-[var(--hm-muted)] hover:text-[var(--hm-accent)] transition-colors"
                          >
                            <Copy size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {note.type === 'image' && (
                    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                      {(note as any).dataUrl && (
                        <img
                          src={(note as any).dataUrl}
                          alt={(note as any).caption || 'Image'}
                          className="w-full h-32 object-cover rounded-lg mb-1"
                        />
                      )}
                      {(note as any).caption && (
                        <p className="text-xs text-[var(--hm-muted)]">{getPreview(note)}</p>
                      )}
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="flex items-center justify-end gap-1 mt-2 pt-1.5 border-t border-[var(--hm-border)]" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => togglePin(note.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        note.pinned
                          ? 'text-[var(--hm-accent)] bg-[var(--hm-accent-soft)]'
                          : 'text-[var(--hm-muted)] hover:bg-[var(--hm-soft)]'
                      }`}
                    >
                      <Pin size={13} />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-1.5 rounded-lg text-[var(--hm-muted)] hover:bg-[var(--hm-soft)] hover:text-[var(--hm-red)] transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* FAB - Add Note */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setAddModalOpen(true)}
        className="w-12 h-12 rounded-2xl bg-[var(--hm-accent)] text-white shadow-lg shadow-[var(--hm-accent)]/30 flex items-center justify-center ml-auto"
      >
        <Plus size={20} strokeWidth={2.5} />
      </motion.button>

      {/* Add Note Modal */}
      <AddNoteModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </div>
  )
}