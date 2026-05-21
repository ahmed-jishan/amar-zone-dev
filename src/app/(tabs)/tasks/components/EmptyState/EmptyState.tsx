interface Props { message?: string; }
export default function EmptyState({ message }: Props) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', textAlign:'center' }}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ color:'var(--az-text-3)', opacity:.4, marginBottom:16 }}>
        <rect x="8" y="12" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16 12V10a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M17 22h14M17 28h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <p style={{ fontSize:15, fontWeight:600, color:'var(--az-text-2)', margin:'0 0 6px' }}>{message ?? 'No tasks here'}</p>
      <p style={{ fontSize:13, color:'var(--az-text-3)', margin:0 }}>Add a task above to get started</p>
    </div>
  );
}
