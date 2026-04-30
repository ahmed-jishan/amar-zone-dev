interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="text-5xl mb-4" style={{ color: 'rgb(var(--muted))' }}>{icon}</div>
      <h3 className="font-semibold mb-1" style={{ color: 'rgb(var(--fg))' }}>{title}</h3>
      {description && (
        <p className="text-sm mb-4" style={{ color: 'rgb(var(--muted))' }}>{description}</p>
      )}
      {action}
    </div>
  )
}
