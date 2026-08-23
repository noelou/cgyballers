import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container">
      <div className="empty-state card" style={{ padding: 64 }}>
        <h1 style={{ fontSize: 40, marginBottom: 8 }}>404</h1>
        <p>This page doesn't exist.</p>
        <Link to="/" className="btn btn-primary">Back Home</Link>
      </div>
    </div>
  )
}
