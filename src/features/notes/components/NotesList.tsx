'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
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
  LayoutGrid,
  List,
  Sparkles,
  PenSquare,
  KeyRound,
  Globe,
  ImagePlus,
  Type,
  ArrowUpDown,
  Archive,
  RotateCcw,
  BarChart3,
  Bell,
  Filter,
  ChevronDown,
} from 'lucide-react'
import { useNotesStore } from '../store/notesStore'
import { Note, NOTE_CATEGORY_COLORS, NOTE_CATEGORIES, NoteCategory, NoteType, NoteSortKey, NoteFilterStatus } from '../types'
import AddNoteModal from './AddNoteModal'
import NoteReaderModal from './NoteReaderModal'
import NoteTemplates from './NoteTemplates'
import NoteAnalytics from './NoteAnalytics'
import QuickNoteWidget from './QuickNoteWidget'

type ViewMode = 'list' | 'grid'

function getNoteTypeDetails(type: string) {
  switch (type) {
    case 'text': return { icon: FileText, label: 'Text', quickIcon: Type }
    case 'link': return { icon: LinkIcon, label: 'Link', quickIcon: Globe }
    case 'password': return { icon: Lock, label: 'Password', quickIcon: KeyRound }
    case 'image': return { icon: ImageIcon, label: 'Image', quickIcon: ImagePlus }
    default: return { icon: FileText, label: 'Text', quickIcon: Type }
  }
}

function getPreview(note: Note): string {
  switch (note.type) {
    case 'text': return (note as any).body?.slice(0, 80) || 'No content'
    case 'link': return (note as any).url || 'No URL'
    case 'password': return `Username: ${(note as any).username || 'Not set'}`
    case 'image': return (note as any).caption || 'No caption'
  }
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function asArray<T>(value: T[] | unknown): T[] {
  return Array.isArray(value) ? value : []
}

const CATEGORY_LIST = ['all', 'personal', 'work', 'finance', 'social', 'education', 'health', 'other'] as const

function getCategoryEmoji(cat: string): string {
  const found = NOTE_CATEGORIES.find((c) => c.value === cat)
  return found?.emoji || '📌'
}

const QUICK_TYPES: { type: NoteType; icon: any; label: string; color: string }[] = [
  { type: 'text', icon: Type, label: 'Text', color: '#6366f1' },
  { type: 'link', icon: Globe, label: 'Link', color: '#3b82f6' },
  { type: 'password', icon: KeyRound, label: 'Password', color: '#10b981' },
  { type: 'image', icon: ImagePlus, label: 'Image', color: '#ec4899' },
]

export default function NotesList() {
  const notes = useNotesStore((s) => asArray(s.notes))
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
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    let result = getFilteredNotes()
    if (categoryFilter !== 'all') {
      result = result.filter((n) => n.category === categoryFilter)
    }
    return result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return b.updatedAt - a.updatedAt
    })
  }, [getFilteredNotes, categoryFilter])

  const totalCount = notes.length
  const hasSearchResults = searchQuery.trim().length > 0 && filtered.length > 0
  const isSearching = searchQuery.trim().length > 0

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
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

  const handleQuickCreate = (type: NoteType) => {
    setAddModalOpen(true)
  }

  const renderCardContent = (note: Note) => {
    const noteColor = NOTE_CATEGORY_COLORS[note.category]
    const { icon: TypeIcon } = getNoteTypeDetails(note.type)
    const isGrid = viewMode === 'grid'

    return (
      <>
        <div className="hm-note-accent" style={{ background: noteColor }} />
        <div className="hm-note-card-inner">
          <div className="hm-note-top-row">
            <div className="hm-note-type-icon" style={{ background: `${noteColor}14`, color: noteColor }}>
              <TypeIcon size={isGrid ? 16 : 14} />
            </div>
            <div className="hm-note-type-label" style={{ color: noteColor }}>
              {note.type}
            </div>
            {note.pinned && (
              <div className="hm-note-pin-badge" style={{ background: `${noteColor}14`, color: noteColor }}>
                <Pin size={10} />
              </div>
            )}
            <span className="hm-note-time">{formatRelativeTime(note.updatedAt)}</span>
          </div>
          <h3 className="hm-note-title">{note.title}</h3>
          {!isGrid && note.type === 'text' && <p className="hm-note-preview">{getPreview(note)}</p>}
          {!isGrid && note.type === 'link' && <p className="hm-note-preview hm-note-url-text">{(note as any).url}</p>}
          {!isGrid && note.type === 'password' && <p className="hm-note-preview">Username: {(note as any).username || 'Not set'}</p>}
          {!isGrid && note.type === 'image' && (note as any).caption && <p className="hm-note-preview">{(note as any).caption}</p>}
          {!isGrid && note.tags.length > 0 && (
            <div className="hm-note-tags">
              {note.tags.slice(0, 3).map((tag) => <span key={tag} className="hm-note-tag">#{tag}</span>)}
              {note.tags.length > 3 && <span className="hm-note-tag-more">+{note.tags.length - 3}</span>}
            </div>
          )}
        </div>
      </>
    )
  }

  const renderNoteCard = (note: Note) => {
    const noteColor = NOTE_CATEGORY_COLORS[note.category]
    return (
      <motion.div
        key={note.id}
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`hm-note-card ${viewMode === 'grid' ? 'hm-note-card-grid' : ''}`}
        style={{ borderLeftColor: noteColor }}
        onClick={() => setSelectedNote(note)}
      >
        {renderCardContent(note)}
      </motion.div>
    )
  }

  return (
    <div className="notes-list-root">
      {/* ===== PREMIUM SEARCH BAR + QUICK ACTIONS TOOLBAR ===== */}
      <div className="hm-search-container">
        <div className={`hm-search-bar ${isSearching ? 'has-results' : ''}`}>
          <div className="hm-search-icon-wrap">
            <Search size={15} className="hm-search-icon" />
          </div>
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search notes...'
            className="hm-search-input"
            autoComplete="off"
          />
          {isSearching && (
            <button onClick={() => setSearchQuery('')} className="hm-search-clear">
              <X size={14} />
            </button>
          )}
          {hasSearchResults && (
            <div className="hm-search-count">
              <span className="hm-search-count-dot" />
              {filtered.length}
            </div>
          )}
        </div>
        {isSearching && hasSearchResults && (
          <div className="hm-search-hint">
            Found in {filtered.length} note{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
        {isSearching && !hasSearchResults && (
          <div className="hm-search-hint no-results">
            No notes found matching &ldquo;{searchQuery}&rdquo;
          </div>
        )}
      </div>

      {/* ===== FLOATING + BUTTON (below notifications in header) ===== */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setAddModalOpen(true)}
        className="hm-notes-float-add"
        title="Create note"
      >
        <Plus size={16} strokeWidth={2.5} />
      </motion.button>

      {/* ===== QUICK CREATE STRIP (below search, with space) ===== */}
      <div className="hm-quick-strip">
        <div className="hm-quick-strip-label">Quick create</div>
        <div className="hm-quick-strip-actions">
          {QUICK_TYPES.map(({ type, icon: Icon, label, color }) => (
            <button
              key={type}
              onClick={() => handleQuickCreate(type)}
              className="hm-quick-strip-btn"
              title={`Create ${label} note`}
              style={{ '--btn-color': color } as React.CSSProperties}
            >
              <div className="hm-quick-strip-icon" style={{ background: `${color}14`, color }}>
                <Icon size={14} />
              </div>
              <span className="hm-quick-strip-label-text">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== CATEGORY FILTER + VIEW TOGGLE ===== */}
      <div className="hm-notes-toolbar">
        <div className="hm-category-scroll">
          {CATEGORY_LIST.map((cat) => {
            const isActive = categoryFilter === cat
            const color = cat === 'all' ? 'var(--hm-accent)' : NOTE_CATEGORY_COLORS[cat as NoteCategory]
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`hm-cat-chip ${isActive ? 'active' : ''}`}
                style={isActive ? { background: color, color: '#fff' } : undefined}
              >
                {cat !== 'all' && <span className="hm-cat-emoji">{getCategoryEmoji(cat)}</span>}
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                {isActive && filtered.length > 0 && (
                  <span className="hm-cat-count">{filtered.length}</span>
                )}
              </button>
            )
          })}
        </div>
        <div className="hm-view-toggle">
          <button onClick={() => setViewMode('list')} className={`hm-view-btn ${viewMode === 'list' ? 'active' : ''}`} title="List view">
            <List size={14} />
          </button>
          <button onClick={() => setViewMode('grid')} className={`hm-view-btn ${viewMode === 'grid' ? 'active' : ''}`} title="Grid view">
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      {/* ===== NOTES LIST / GRID ===== */}
      <div className={`${viewMode === 'grid' ? 'hm-notes-grid' : 'hm-notes-list'} hm-notes-scroll`}>
        <AnimatePresence>
          {filtered.map(renderNoteCard)}
        </AnimatePresence>

        {/* Empty State */}
        {filtered.length === 0 && !searchQuery && (
          <motion.div className="hm-notes-empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="hm-notes-empty-icon">
              <Sparkles size={32} strokeWidth={1.2} />
              <div className="hm-notes-empty-emoji">📝</div>
            </div>
            <h3 className="hm-notes-empty-title">No notes yet</h3>
            <p className="hm-notes-empty-desc">Tap the button below to create your first note</p>
            <button onClick={() => setAddModalOpen(true)} className="hm-notes-empty-btn">
              <Plus size={16} /> Create Note
            </button>
          </motion.div>
        )}

        {/* Empty Search */}
        {filtered.length === 0 && searchQuery && (
          <motion.div className="hm-notes-empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="hm-notes-empty-icon">
              <Search size={28} strokeWidth={1.2} className="hm-search-noresult" />
            </div>
            <h3 className="hm-notes-empty-title">No results found</h3>
            <p className="hm-notes-empty-desc">No notes match &ldquo;{searchQuery}&rdquo;</p>
            <button onClick={() => setSearchQuery('')} className="hm-notes-empty-btn secondary">Clear search</button>
          </motion.div>
        )}
      </div>

      {/* ===== MODALS ===== */}
      <AddNoteModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
      <NoteReaderModal noteId={selectedNote?.id ?? null} onClose={() => setSelectedNote(null)} />
    </div>
  )
}