'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Pin,
  Trash2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Edit3,
  Share2,
  Check,
  Clock,
  Tag,
  Link as LinkIcon,
  FileText,
  Lock,
  Image as ImageIcon,
  Calendar,
  ChevronLeft,
} from 'lucide-react'
import { Note, NOTE_CATEGORY_COLORS, NOTE_CATEGORIES, NoteCategory } from '../types'
import { useNotesStore } from '../store/notesStore'
import AddNoteModal from './AddNoteModal'

interface NoteReaderModalProps {
  noteId: string | null
  onClose: () => void
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)

  if (days === 0) {
    const hrs = Math.floor(diff / 3600000)
    if (hrs === 0) {
      const mins = Math.floor(diff / 60000)
      return `${mins} min${mins !== 1 ? 's' : ''} ago`
    }
    return `${hrs} hr${hrs !== 1 ? 's' : ''} ago`
  }
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function getCategoryInfo(cat: NoteCategory) {
  return NOTE_CATEGORIES.find((c) => c.value === cat) || { label: cat, emoji: '📌' }
}

function noteTypeIcon(type: string) {
  switch (type) {
    case 'text': return FileText
    case 'password': return Lock
    case 'image': return ImageIcon
    case 'link': return LinkIcon
    default: return FileText
  }
}

export default function NoteReaderModal({ noteId, onClose }: NoteReaderModalProps) {
  const notes = useNotesStore((s) => s.notes)
  const deleteNote = useNotesStore((s) => s.deleteNote)
  const togglePin = useNotesStore((s) => s.togglePin)

  // Always get fresh note from store by ID - solves stale data after edit
  const note = noteId ? notes.find((n) => n.id === noteId) ?? null : null

  const [copied, setCopied] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Reset states when note changes
  useEffect(() => {
    setCopied(false)
    setPasswordVisible(false)
    setShowDeleteConfirm(false)
  }, [noteId])

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [])

  const handleShare = useCallback(async () => {
    if (!note) return
    let shareText = `${note.title}\n`
    if (note.type === 'text') shareText += (note as any).body || ''
    else if (note.type === 'link') shareText += (note as any).url || ''
    else if (note.type === 'password') shareText += `Username: ${(note as any).username || ''}`
    else if (note.type === 'image') shareText += (note as any).caption || ''

    if (navigator.share) {
      try {
        await navigator.share({ title: note.title, text: shareText })
      } catch { /* user cancelled */ }
    } else {
      handleCopy(shareText)
    }
  }, [note, handleCopy])

  const handleDelete = useCallback(() => {
    if (!note) return
    deleteNote(note.id)
    onClose()
  }, [note, deleteNote, onClose])

  const handleEditClosed = useCallback(() => {
    setShowEditModal(false)
  }, [])

  if (!note) return null

  const categoryInfo = getCategoryInfo(note.category)
  const noteColor = NOTE_CATEGORY_COLORS[note.category]
  const TypeIcon = noteTypeIcon(note.type)
  const bodyContent = (note as any).body || ''

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="hm-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="notes-reader-modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="notes-reader-header" style={{ borderBottomColor: `${noteColor}30` }}>
              <div className="notes-reader-header-top">
                <button
                  onClick={onClose}
                  className="notes-reader-btn"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="notes-reader-header-actions">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="notes-reader-btn"
                    title="Edit"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="notes-reader-btn"
                    title="Share"
                  >
                    <Share2 size={15} />
                  </button>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`notes-reader-btn ${note.pinned ? 'active' : ''}`}
                    title={note.pinned ? 'Unpin' : 'Pin'}
                    style={note.pinned ? { color: noteColor } : undefined}
                  >
                    <Pin size={15} />
                  </button>
                  {showDeleteConfirm ? (
                    <div className="notes-reader-delete-confirm">
                      <span className="text-xs font-medium text-[var(--hm-red)]">Delete?</span>
                      <button
                        onClick={handleDelete}
                        className="notes-reader-btn danger"
                        title="Confirm delete"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="notes-reader-btn"
                        title="Cancel"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="notes-reader-btn"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="notes-reader-title-section">
                <div className="notes-reader-title-row">
                  <div
                    className="notes-reader-type-badge"
                    style={{ background: `${noteColor}18`, color: noteColor }}
                  >
                    <TypeIcon size={13} />
                    <span>{note.type.toUpperCase()}</span>
                  </div>
                  <span className="notes-reader-category-badge">
                    {categoryInfo.emoji} {categoryInfo.label}
                  </span>
                </div>
                <h2 className="notes-reader-title">{note.title}</h2>
                <div className="notes-reader-meta-row">
                  <span className="notes-reader-meta-item">
                    <Calendar size={11} />
                    Created {formatDate(note.createdAt)}
                  </span>
                  {note.updatedAt !== note.createdAt && (
                    <span className="notes-reader-meta-item">
                      <Clock size={11} />
                      Updated {formatDate(note.updatedAt)}
                    </span>
                  )}
                  {copied && (
                    <span className="notes-reader-meta-item copied">
                      <Check size={11} />
                      Copied!
                    </span>
                  )}
                </div>
                {note.tags.length > 0 && (
                  <div className="notes-reader-tags">
                    <Tag size={11} className="text-[var(--hm-muted)] flex-shrink-0" />
                    {note.tags.map((tag: string) => (
                      <span key={tag} className="notes-reader-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="notes-reader-content" ref={contentRef}>
              {/* TEXT NOTE */}
              {note.type === 'text' && (
                <div className="notes-reader-text-content">
                  {bodyContent ? (
                    <div className="notes-reader-body">{bodyContent}</div>
                  ) : (
                    <p className="notes-reader-empty">No content</p>
                  )}
                  <button
                    onClick={() => handleCopy(bodyContent)}
                    className="notes-reader-copy-btn"
                  >
                    <Copy size={13} />
                    Copy full text
                  </button>
                </div>
              )}

              {/* LINK NOTE */}
              {note.type === 'link' && (
                <div className="notes-reader-link-content">
                  <div className="notes-reader-link-card">
                    <div className="notes-reader-link-icon">
                      <LinkIcon size={20} />
                    </div>
                    <div className="notes-reader-link-details">
                      <span className="notes-reader-link-url">{(note as any).url}</span>
                      {(note as any).description && (
                        <p className="notes-reader-link-desc">{(note as any).description}</p>
                      )}
                    </div>
                  </div>
                  <div className="notes-reader-link-actions">
                    <button
                      onClick={() => {
                        const url = (note as any).url
                        if (url) {
                          window.open(
                            url.startsWith('http') ? url : `https://${url}`,
                            '_blank',
                            'noopener,noreferrer'
                          )
                        }
                      }}
                      className="notes-reader-action-btn primary"
                    >
                      <ExternalLink size={14} />
                      Open Link
                    </button>
                    <button
                      onClick={() => handleCopy((note as any).url)}
                      className="notes-reader-action-btn"
                    >
                      <Copy size={14} />
                      {copied ? 'Copied!' : 'Copy URL'}
                    </button>
                  </div>
                </div>
              )}

              {/* PASSWORD NOTE */}
              {note.type === 'password' && (
                <div className="notes-reader-password-content">
                  <div className="notes-reader-password-field">
                    <label>Username / Email</label>
                    <div className="notes-reader-password-value">
                      <span>{(note as any).username || 'Not set'}</span>
                      {(note as any).username && (
                        <button onClick={() => handleCopy((note as any).username)}>
                          <Copy size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="notes-reader-password-field">
                    <label>Password</label>
                    <div className="notes-reader-password-value">
                      <span className="font-mono">
                        {passwordVisible ? (note as any).password : '••••••••'}
                      </span>
                      <button onClick={() => setPasswordVisible(!passwordVisible)}>
                        {passwordVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      {(note as any).password && (
                        <button onClick={() => handleCopy((note as any).password)}>
                          <Copy size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  {(note as any).url && (
                    <div className="notes-reader-password-field">
                      <label>URL</label>
                      <div className="notes-reader-password-value">
                        <span>{(note as any).url}</span>
                        <button onClick={() => handleCopy((note as any).url)}>
                          <Copy size={12} />
                        </button>
                        <button
                          onClick={() => {
                            const url = (note as any).url
                            if (url) {
                              window.open(
                                url.startsWith('http') ? url : `https://${url}`,
                                '_blank',
                                'noopener,noreferrer'
                              )
                            }
                          }}
                        >
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* IMAGE NOTE */}
              {note.type === 'image' && (
                <div className="notes-reader-image-content">
                  {(note as any).dataUrl && (
                    <div className="notes-reader-image-wrapper">
                      <img
                        src={(note as any).dataUrl}
                        alt={(note as any).caption || 'Image'}
                        className="notes-reader-image"
                        onClick={() => {
                          window.open((note as any).dataUrl, '_blank')
                        }}
                      />
                      <div className="notes-reader-image-hint">
                        Tap to view full size
                      </div>
                    </div>
                  )}
                  {(note as any).caption && (
                    <p className="notes-reader-image-caption">{(note as any).caption}</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="notes-reader-footer" style={{ borderTopColor: `${noteColor}15` }}>
              <span className="notes-reader-footer-text">
                {note.type === 'text' && `${bodyContent.length} characters`}
                {note.type === 'link' && 'Link saved'}
                {note.type === 'password' && 'Credentials saved'}
                {note.type === 'image' && 'Image saved'}
              </span>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Edit Modal - Gets fresh note data from store after edit */}
      {showEditModal && note && (
        <AddNoteModal
          open={showEditModal}
          onClose={handleEditClosed}
          editNote={note}
        />
      )}
    </>
  )
}