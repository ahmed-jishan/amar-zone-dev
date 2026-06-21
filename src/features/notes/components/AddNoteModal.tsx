'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Type, Lock, Image as ImageIcon, Link, Plus, Upload } from 'lucide-react'
import { useNotesStore } from '../store/notesStore'
import { NoteType, NoteCategory, NOTE_CATEGORIES, NOTE_CATEGORY_COLORS } from '../types'

interface AddNoteModalProps {
  open: boolean
  onClose: () => void
}

export default function AddNoteModal({ open, onClose }: AddNoteModalProps) {
  const addNote = useNotesStore((s) => s.addNote)

  const [step, setStep] = useState<'choose' | 'fill'>('choose')
  const [selectedType, setSelectedType] = useState<NoteType>('text')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<NoteCategory>('personal')
  const [tags, setTags] = useState('')
  const [body, setBody] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [caption, setCaption] = useState('')
  const [imageDataUrl, setImageDataUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageFileName, setImageFileName] = useState('')

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
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFileName(file.name)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      // Compress by reducing quality for large images
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

  const handleSubmit = () => {
    if (!title.trim()) return

    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    addNote(selectedType, {
      title: title.trim(),
      category,
      tags: tagList,
      ...(selectedType === 'text' && { body }),
      ...(selectedType === 'password' && { username, password, url }),
      ...(selectedType === 'image' && { dataUrl: imageDataUrl, caption }),
      ...(selectedType === 'link' && { url, description }),
    })

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
                {step === 'choose' ? 'New Note' : `New ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Note`}
              </h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-[var(--hm-soft)] flex items-center justify-center text-[var(--hm-muted)] hover:bg-[var(--hm-border)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {step === 'choose' ? (
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
                    <div
                      className="icon-wrapper"
                      style={{ background: `${color}20`, color }}
                    >
                      <Icon size={20} />
                    </div>
                    <span className="font-medium text-sm text-[var(--hm-text)]">{label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
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
                      Body
                    </label>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Write your note here..."
                      rows={4}
                      className="w-full bg-[var(--hm-soft)] border border-[var(--hm-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--hm-text)] placeholder:text-[var(--hm-muted)] outline-none focus:border-[var(--hm-accent)] transition-colors resize-none"
                    />
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
                          <img
                            src={imageDataUrl}
                            alt="Preview"
                            className="w-20 h-20 object-cover rounded-lg mt-2"
                          />
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
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

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep('choose')}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--hm-soft)] text-[var(--hm-muted)] font-medium text-sm hover:bg-[var(--hm-border)] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!title.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--hm-accent)] text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    <Plus size={16} className="inline mr-1" />
                    Create
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