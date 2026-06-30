'use client'

import { useState, useCallback, useRef, useEffect, memo } from 'react'
import { Plus, StickyNote, X } from 'lucide-react'
import { useNotesStore } from '../store/notesStore'
import { NOTE_CATEGORY_COLORS } from '../types'

export default function QuickNoteWidget() {
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const addNote = useNotesStore((s) => s.addNote)
  const notes = useNotesStore((s) => s.notes)
  const analytics = useNotesStore((s) => s.analytics)

  // Recent 3 active notes (non-trashed, non-archived)
  const recentNotes = notes
    .filter((n) => !n.trashedAt && !n.archivedAt)
    .slice(0, 3)

  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [expanded])

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed) return
    addNote('text', {
      title: trimmed.length > 60 ? trimmed.slice(0, 60) + '...' : trimmed,
      body: trimmed,
      category: 'personal',
    })
    setText('')
    setExpanded(false)
  }, [text, addNote])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      setExpanded(false)
      setText('')
    }
  }

  return (
    <div className="hm-quick-widget">
      {/* Quick Capture */}
      <div className={`hm-quick-capture ${expanded ? 'expanded' : ''}`}>
        {expanded ? (
          <div className="hm-quick-capture-form">
            <div className="flex items-center gap-2">
              <StickyNote size={16} className="text-[var(--hm-accent)] flex-shrink-0" />
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Quick note... (Enter to save, Esc to cancel)"
                className="hm-quick-capture-input"
                autoComplete="off"
              />
              <button onClick={() => { setExpanded(false); setText('') }} className="hm-quick-capture-close">
                <X size={14} />
              </button>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => { setExpanded(false); setText('') }} className="text-xs text-[var(--hm-muted)] px-2 py-1">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!text.trim()}
                className="text-xs font-semibold text-white px-3 py-1 rounded-lg bg-[var(--hm-accent)] disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setExpanded(true)} className="hm-quick-capture-btn">
            <Plus size={16} />
            <span>Quick Capture</span>
          </button>
        )}
      </div>

      {/* Recent Notes */}
      <div className="space-y-1.5">
        {recentNotes.map((note) => (
          <div key={note.id} className="hm-quick-note-item">
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: NOTE_CATEGORY_COLORS[note.category] }}
            />
            <span className="hm-quick-note-title">{note.title}</span>
          </div>
        ))}
        {recentNotes.length === 0 && !expanded && (
          <div className="text-xs text-[var(--hm-muted)] text-center py-2">
            No notes yet. Tap above to create one!
          </div>
        )}
      </div>
    </div>
  )
}
