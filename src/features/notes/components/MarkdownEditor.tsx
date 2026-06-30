'use client'

import { useState, useCallback, useRef, memo } from 'react'
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Code, Eye, Edit3 } from 'lucide-react'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minRows?: number
  maxRows?: number
}

// Ultra-lightweight markdown preview (no external deps)
function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Bold & Italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Checklists
  html = html.replace(/^- \[x\] (.+)$/gm, '<label class="hm-checklist-item"><input type="checkbox" checked disabled><span>$1</span></label>')
  html = html.replace(/^- \[ \] (.+)$/gm, '<label class="hm-checklist-item"><input type="checkbox" disabled><span>$1</span></label>')

  // Unordered list
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')

  // Ordered list
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
    if (match.includes('<ul>')) return match
    return `<ol>${match}</ol>`
  })

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  // Wiki-style links [[Note Title]]
  html = html.replace(/\[\[([^\]]+)\]\]/g, '<span class="hm-wiki-link" data-title="$1">$1</span>')

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr>')

  // Paragraphs (double newline)
  html = html.replace(/\n\n/g, '</p><p>')

  // Single newline
  html = html.replace(/\n/g, '<br>')

  return `<p>${html}</p>`
}

const ToolbarBtn = memo(function ToolbarBtn({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: any
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`hm-md-btn ${active ? 'active' : ''}`}
      title={label}
      type="button"
    >
      <Icon size={15} />
    </button>
  )
})

export default function MarkdownEditor({ value, onChange, placeholder, minRows = 6, maxRows = 20 }: MarkdownEditorProps) {
  const [preview, setPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertMarkdown = useCallback((before: string, after = '') => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.substring(start, end)
    const newText = value.substring(0, start) + before + selected + after + value.substring(end)
    onChange(newText)
    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, start + before.length + selected.length)
    })
  }, [value, onChange])

  const handleBold = () => insertMarkdown('**', '**')
  const handleItalic = () => insertMarkdown('*', '*')
  const handleH1 = () => insertMarkdown('# ', '')
  const handleH2 = () => insertMarkdown('## ', '')
  const handleBulletList = () => insertMarkdown('- ', '')
  const handleNumberedList = () => insertMarkdown('1. ', '')
  const handleCode = () => insertMarkdown('`', '`')

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0
  const charCount = value.length
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div className="hm-md-editor">
      {/* Toolbar */}
      <div className="hm-md-toolbar">
        <div className="hm-md-toolbar-group">
          <ToolbarBtn icon={Bold} label="Bold" onClick={handleBold} />
          <ToolbarBtn icon={Italic} label="Italic" onClick={handleItalic} />
          <ToolbarBtn icon={Heading1} label="Heading 1" onClick={handleH1} />
          <ToolbarBtn icon={Heading2} label="Heading 2" onClick={handleH2} />
          <ToolbarBtn icon={List} label="Bullet List" onClick={handleBulletList} />
          <ToolbarBtn icon={ListOrdered} label="Numbered List" onClick={handleNumberedList} />
          <ToolbarBtn icon={Code} label="Inline Code" onClick={handleCode} />
        </div>
        <button
          onClick={() => setPreview(!preview)}
          className={`hm-md-preview-toggle ${preview ? 'active' : ''}`}
          type="button"
        >
          {preview ? <Edit3 size={14} /> : <Eye size={14} />}
          <span>{preview ? 'Edit' : 'Preview'}</span>
        </button>
      </div>

      {/* Editor / Preview */}
      {preview ? (
        <div
          className="hm-md-preview"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value || '*No content*') }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Write your note here...'}
          className="hm-md-textarea"
          rows={minRows}
          style={{ minHeight: `${minRows * 1.5}rem`, maxHeight: `${maxRows * 1.5}rem` }}
        />
      )}

      {/* Stats */}
      <div className="hm-md-stats">
        <span>{wordCount} words</span>
        <span>{charCount} chars</span>
        <span>{readingTime} min read</span>
      </div>
    </div>
  )
}
