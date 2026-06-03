import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ maxWidth: 360, textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>Page not found</p>
        <h1 style={{ margin: '8px 0 12px', fontSize: 28, color: '#0f172a' }}>SelfSync</h1>
        <Link href="/" style={{ color: '#059669', fontWeight: 700, textDecoration: 'none' }}>
          Back to app
        </Link>
      </div>
    </main>
  );
}
