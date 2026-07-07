'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Type, Lock, Image as ImageIcon, Link, Plus, Upload, Save, Bell, Clock } from 'lucide-react'
import { useNotesStore } from '../store/notesStore'
import { NoteType, NoteCategory, Note, NOTE_CATEGORIES, NOTE_CATEGORY_COLORS, NOTE_TEMPLATES, NoteTemplate } from '../types'
import MarkdownEditor from './MarkdownEditor'
import NoteTemplates from './NoteTemplates'

interface AddNoteModalProps {
  open: boolean
  onClose: () => void
  editNote?: Note | null
}

export default function AddNoteModal({ open, onClose, editNote }: AddNoteModalProps) {
  const addNote = useNotesStore((s) => s.addNote)
  const updateNote = useNotesStore((s) => s.updateNote)
  const isEditing = !!editNote

  const [step, setStep] = useState<'choose' | 'fill' | 'template'>(editNote ? 'fill' : 'choose')
  const [selectedType, setSelectedType] = useState<NoteType>(editNote?.type || 'text')
  const [title, setTitle] = useState(editNote?.title || '')
  const [category, setCategory] = useState<NoteCategory>(editNote?.category || 'personal')
  const [tags, setTags] = useState(editNote?.tags?.join(', ') || '')
  const [body, setBody] = useState(editNote?.type === 'text' ? (editNote as any).body || '' : '')
  const [username, setUsername] = useState(editNote?.type === 'password' ? (editNote as any).username || '' : '')
  const [password, setPassword] = useState(editNote?.type === 'password' ? (editNote as any).password || '' : '')
  const [url, setUrl] = useState(
    editNote?.type === 'password' ? (editNote as any).url || '' :
    editNote?.type === 'link' ? (editNote as any).url || '' : ''
  )
  const [description, setDescription] = useState(editNote?.type === 'link' ? (editNote as any).description || '' : '')
  const [caption, setCaption] = useState(editNote?.type === 'image' ? (editNote as any).caption || '' : '')
  const [imageDataUrl, setImageDataUrl] = useState(editNote?.type === 'image' ? (editNote as any).dataUrl || '' : '')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageFileName, setImageFileName] = useState('')
  const [templateId, setTemplateId] = useState(editNote?.templateId || '')
  // Reminder
  const [reminderDate, setReminderDate] = useState('')
  const [reminderTime, setReminderTime] = useState('')

  const resetForm = () => {
    setStep('choose')
    setSelectedType('text')
    setTitle('')
    setCategory('personal')
    setTags('')
    setBody('')
    setUsername('')
    setPassword('')
    setUrl('')
    setDescription('')
    setCaption('')
    setImageDataUrl('')
    setImageFileName('')
    setTemplateId('')
    setReminderDate('')
    setReminderTime('')
  }

  const handleClose = () => {
    if (!isEditing) resetForm()
    onClose()
  }

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      if (dataUrl) {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          const MAX = 800
          if (width > MAX || height > MAX) {
            if (width > height) {
              height = (height / width) * MAX
              width = MAX
            } else {
              width = (width / height) * MAX
              height = MAX
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0, width, height)
          setImageDataUrl(canvas.toDataURL('image/jpeg', 0.7))
        }
        img.src = dataUrl
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const handleTemplateSelect = useCallback((template: NoteTemplate) => {
    setSelectedType(template.type)
    setCategory(template.category)
    if (template.presetBody) setBody(template.presetBody)
    if (template.presetTags) setTags(template.presetTags.join(', '))
    setTemplateId(template.id)
    setStep('fill')
  }, [])

  const handleSubmit = () => {
    if (!title.trim()) return

    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    // Calculate reminder timestamp
    let reminderAt: number | undefined
    if (reminderDate) {
      const dateStr = reminderTime ? `${reminderDate}T${reminderTime}` : `${reminderDate}T09:00`
      const parsed = Date.parse(dateStr)
      if (!isNaN(parsed)) reminderAt = parsed
    }

    if (isEditing && editNote) {
      const updates: any = {
        title: title.trim(),
        category,
        tags: tagList,
        type: selectedType,
        templateId: templateId || undefined,
        reminderAt,
      }
      if (selectedType === 'text') updates.body = body
      if (selectedType === 'password') { updates.username = username; updates.password = password; updates.url = url }
      if (selectedType === 'image') { updates.dataUrl = imageDataUrl; updates.caption = caption }
      if (selectedType === 'link') { updates.url = url; updates.description = description }
      updateNote(editNote.id, updates)
    } else {
      addNote(selectedType, {
        title: title.trim(),
        category,
        tags: tagList,
        templateId: templateId || undefined,
        ...(selectedType === 'text' && { body }),
        ...(selectedType === 'password' && { username, password, url }),
        ...(selectedType === 'image' && { dataUrl: imageDataUrl, caption }),
        ...(selectedType === 'link' && { url, description }),
      })
      // Set reminder if provided
      if (reminderAt) {
        const notes = useNotesStore.getState().notes
        const newNote = notes[0]
        if (newNote) {
          useNotesStore.getState().setReminder(newNote.id, reminderAt)
        }
      }
    }

    handleClose()
  }

  const typeOptions: { type: NoteType; icon: typeof Type; label: string; color: string }[] = [
    { type: 'text', icon: Type, label: 'Text', color: '#6366f1' },
    { type: 'password', icon: Lock, label: 'Password', color: '#10b981' },
    { type: 'image', icon: ImageIcon, label: 'Image', color: '#ec4899' },
    { type: 'link', icon: Link, label: 'Link', color: '#3b82f6' },
  ]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="hm-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="hm-modal-popup"
            initial={{ scale: 0.92, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[var(--hm-text)]">
                {isEditing
                  ? `Edit Note`
                  : step === 'choose'
                    ? 'New Note'
                    : step === 'template'
                      ? 'Choose a Template'
                      : `New Note`}
              </h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-[var(--hm-soft)] flex items-center justify-center text-[var(--hm-muted)] hover:bg-[var(--hm-border)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {step === 'choose' && !isEditing && (
              <div className="hm-modal-body space-y-4">
                {/* Quick type selection */}
                <div className="grid grid-cols-2 gap-3">
                  {typeOptions.map(({ type, icon: Icon, label, color }) => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedType(type)
                        setStep('fill')
                      }}
                      className="hm-action-btn py-6"
                    >
                      <div className="icon-wrapper" style={{ background: `${color}20`, color }}>
                        <Icon size={20} />
                      </div>
                      <span className="font-medium text-sm text-[var(--hm-text)]">{label}</span>
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[var(--hm-border)]" />
                  <span className="text-xs text-[var(--hm-muted)] font-medium">OR USE A TEMPLATE</span>
                  <div className="flex-1 h-px bg-[var(--hm-border)]" />
                </div>

                {/* Templates */}
                <div className="hm-templates-scroll">
                  <NoteTemplates onSelect={handleTemplateSelect} />
                </div>
              </div>
            )}

            {step === 'fill' && (
              <div className="hm-modal-with-footer">
                <div className="hm-modal-body space-y-4">
                  {/* Title */}
                  <div>
                    <label className="text-xs font-semibold text-[var(--hm-muted)] uppercase tracking-wider mb-1.5 block">
                      Title
                    </label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter title..."
                      className="w-full bg-[var(--hm-soft)] border border-[var(--hm-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--hm-text)] placeholder:text-[var(--hm-muted)] outline-none focus:border-[var(--hm-accent)] transition-colors"
                      autoFocus
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-xs font-semibold text-[var(--hm-muted)] uppercase tracking-wider mb-1.5 block">
                      Category
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {NOTE_CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => setCategory(cat.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            category === cat.value
                              ? 'text-white shadow-sm'
                              : 'bg-[var(--hm-soft)] text-[var(--hm-muted)] hover:bg-[var(--hm-border)]'
                          }`}
                          style={{
                            background: category === cat.value ? NOTE_CATEGORY_COLORS[cat.value] : undefined,
                          }}
                        >
                          {cat.emoji} {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="text-xs font-semibold text-[var(--hm-muted)] uppercase tracking-wider mb-1.5 block">
                      Tags (comma separated)
                    </label>
                    <input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="e.g. work, important, ideas"
                      className="w-full bg-[var(--hm-soft)] border border-[var(--hm-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--hm-text)] placeholder:text-[var(--hm-muted)] outline-none focus:border-[var(--hm-accent)] transition-colors"
                    />
                  </div>

                  {/* Type-specific fields */}
                  {selectedType === 'text' && (
                    <div>
                      <label className="text-xs font-semibold text-[var(--hm-muted)] uppercase tracking-wider mb-1.5 block">
                        Body <span className="text-[var(--hm-muted)] font-normal normal-case">(Markdown supported)</span>
                      </label>
                      <MarkdownEditor value={body} onChange={setBody} minRows={8} />
                    </div>
                  )}

                  {selectedType === 'password' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-[var(--hm-muted)] uppercase tracking-wider mb-1.5 block">
                          Username / Email
                        </label>
                        <input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="username@example.com"
                          className="w-full bg-[var(--hm-soft)] border border-[var(--hm-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--hm-text)] placeholder:text-[var(--hm-muted)] outline-none focus:border-[var(--hm-accent)] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[var(--hm-muted)] uppercase tracking-wider mb-1.5 block">
                          Password
                        </label>
                        <input
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          type="text"
                          className="w-full bg-[var(--hm-soft)] border border-[var(--hm-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--hm-text)] placeholder:text-[var(--hm-muted)] outline-none focus:border-[var(--hm-accent)] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[var(--hm-muted)] uppercase tracking-wider mb-1.5 block">
                          URL (optional)
                        </label>
                        <input
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="w-full bg-[var(--hm-soft)] border border-[var(--hm-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--hm-text)] placeholder:text-[var(--hm-muted)] outline-none focus:border-[var(--hm-accent)] transition-colors"
                        />
                      </div>
                    </>
                  )}

                  {selectedType === 'image' && (
                    <>
                      <div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-8 rounded-xl border-2 border-dashed border-[var(--hm-border)] bg-[var(--hm-soft)] hover:border-[var(--hm-accent)] transition-colors flex flex-col items-center justify-center gap-2 text-[var(--hm-muted)]"
                        >
                          <Upload size={24} />
                          <span className="text-sm font-medium">
                            {imageFileName || 'Tap to upload image'}
                          </span>
                          {imageDataUrl && (
                            <img src={imageDataUrl} alt="Preview" className="w-20 h-20 object-cover rounded-lg mt-2" />
                          )}
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[var(--hm-muted)] uppercase tracking-wider mb-1.5 block">
                          Caption
                        </label>
                        <input
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          placeholder="Add a caption..."
                          className="w-full bg-[var(--hm-soft)] border border-[var(--hm-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--hm-text)] placeholder:text-[var(--hm-muted)] outline-none focus:border-[var(--hm-accent)] transition-colors"
                        />
                      </div>
                    </>
                  )}

                  {selectedType === 'link' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-[var(--hm-muted)] uppercase tracking-wider mb-1.5 block">
                          URL
                        </label>
                        <input
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="w-full bg-[var(--hm-soft)] border border-[var(--hm-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--hm-text)] placeholder:text-[var(--hm-muted)] outline-none focus:border-[var(--hm-accent)] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[var(--hm-muted)] uppercase tracking-wider mb-1.5 block">
                          Description
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Brief description..."
                          rows={2}
                          className="w-full bg-[var(--hm-soft)] border border-[var(--hm-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--hm-text)] placeholder:text-[var(--hm-muted)] outline-none focus:border-[var(--hm-accent)] transition-colors resize-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Reminder */}
                  <div>
                    <label className="text-xs font-semibold text-[var(--hm-muted)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Bell size={12} /> Reminder (optional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={reminderDate}
                        onChange={(e) => setReminderDate(e.target.value)}
                        className="flex-1 bg-[var(--hm-soft)] border border-[var(--hm-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--hm-text)] outline-none focus:border-[var(--hm-accent)] transition-colors"
                      />
                      <input
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="flex-shrink-0 bg-[var(--hm-soft)] border border-[var(--hm-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--hm-text)] outline-none focus:border-[var(--hm-accent)] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions - Sticky Footer */}
                <div className="hm-modal-footer flex gap-3 pt-3">
                  {!isEditing && (
                    <button
                      onClick={() => setStep('choose')}
                      className="flex-1 py-2.5 rounded-xl bg-[var(--hm-soft)] text-[var(--hm-muted)] font-medium text-sm hover:bg-[var(--hm-border)] transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={!title.trim()}
                    className={`py-2.5 rounded-xl bg-[var(--hm-accent)] text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 ${
                      isEditing ? 'flex-1' : ''
                    }`}
                  >
                    {isEditing ? (
                      <><Save size={16} className="inline mr-1" /> Save Changes</>
                    ) : (
                      <><Plus size={16} className="inline mr-1" /> Create</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
