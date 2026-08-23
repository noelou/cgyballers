import { Link } from 'react-router-dom'
import news from '../data/news.json'
import { formatDate } from '../utils/date'
import './News.css'

export default function News() {
  const sorted = [...news].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="container">
      <span className="eyebrow">League Wire</span>
      <h1 className="section-title" style={{ fontSize: 28, marginTop: 8 }}>News</h1>
      <p className="section-sub">Updates, storylines, and headlines from around CGYBallers.</p>

      <div className="news-grid">
        {sorted.map((n) => (
          <Link key={n.id} to={`/news/${n.id}`} className="card news-card">
            <span className="badge">{n.tag}</span>
            <h2 className="news-card-title">{n.title}</h2>
            <p className="news-card-excerpt">{n.excerpt}</p>
            <span className="news-card-date">{formatDate(n.date)}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
