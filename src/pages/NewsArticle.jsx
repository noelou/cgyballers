import { Link, useParams } from 'react-router-dom'
import news from '../data/news.json'
import { formatDate } from '../utils/date'

export default function NewsArticle() {
  const { newsId } = useParams()
  const article = news.find((n) => n.id === newsId)

  if (!article) {
    return (
      <div className="container">
        <div className="empty-state card">
          <p>Article not found.</p>
          <Link to="/news" className="btn">Back to News</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <Link to="/news" className="see-all" style={{ color: 'var(--accent-strong)', fontWeight: 700, fontSize: 13 }}>
        &larr; Back to News
      </Link>
      <div style={{ marginTop: 16, marginBottom: 8 }}>
        <span className="badge">{article.tag}</span>
      </div>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>{article.title}</h1>
      <p style={{ color: 'var(--text-dim)', fontSize: 13, fontWeight: 700, marginBottom: 24 }}>
        {formatDate(article.date)}
      </p>
      <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7 }}>{article.body}</p>
    </div>
  )
}
