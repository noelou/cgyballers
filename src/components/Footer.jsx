export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '28px 0', marginTop: 'auto' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>
          &copy; {new Date().getFullYear()} CGYBallers League
        </span>
        <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>
          Built for hoopers, by hoopers.
        </span>
      </div>
    </footer>
  )
}
