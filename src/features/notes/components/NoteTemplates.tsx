'use client'

import { memo, useCallback } from 'react'
import { NOTE_TEMPLATES, NoteTemplate, NoteCategory, NoteType } from '../types'
import { NOTE_CATEGORY_COLORS } from '../types'

interface NoteTemplatesProps {
  onSelect: (template: NoteTemplate) => void
}

const TemplateCard = memo(function TemplateCard({
  template,
  onClick,
}: {
  template: NoteTemplate
  onClick: () => void
}) {
  const catColor = NOTE_CATEGORY_COLORS[template.category as NoteCategory] || '#6366f1'

  return (
    <button
      onClick={onClick}
      className="hm-template-card"
      style={{ '--tmpl-color': catColor } as React.CSSProperties}
    >
      <div className="hm-template-emoji">{template.emoji}</div>
      <div className="hm-template-info">
        <span className="hm-template-name">{template.name}</span>
        <span className="hm-template-desc">{template.description}</span>
      </div>
      <div className="hm-template-badge" style={{ background: `${catColor}18`, color: catColor }}>
        {template.type}
      </div>
    </button>
  )
})

export default function NoteTemplates({ onSelect }: NoteTemplatesProps) {
  return (
    <div className="hm-templates-grid">
      {NOTE_TEMPLATES.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onClick={() => onSelect(template)}
        />
      ))}
    </div>
  )
}
