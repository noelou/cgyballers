import { Link } from 'react-router-dom'
import schedule from '../data/schedule.json'
import standings from '../data/standings.json'
import news from '../data/news.json'
import teams from '../data/teams.json'
import TeamBadge from '../components/TeamBadge'
import { formatDateShort as formatDate, formatTime } from '../utils/date'
import './Home.css'

const teamById = Object.fromEntries(teams.map((t) => [t.id, t]))

export default function Home() {
  const todayStr = new Date().toISOString().slice(0, 10)
  const upcoming = schedule
    .filter((g) => g.status === 'scheduled' && g.date >= todayStr)
    .slice(0, 3)
  const recent = schedule.filter((g) => g.status === 'final').slice(-3).reverse()
  const topStandings = standings.slice(0, 5)
  const latestNews = news.slice(-3).reverse()

  return (
    <div className="container">
      <section className="hero">
        <span className="eyebrow">2026 Season</span>
        <h1 className="hero-title">
          CGY<span style={{ color: 'var(--accent)' }}>Ballers</span>
        </h1>
        <p className="hero-sub">
          Twelve teams. One league. Follow every score, stat line, and standings shift from the
          CGYBallers season.
        </p>
        <div className="hero-actions">
          <Link to="/standings" className="btn btn-primary">View Standings</Link>
          <Link to="/schedule" className="btn">See Schedule</Link>
        </div>
      </section>

      <section className="home-grid">
        <div className="card home-block">
          <div className="section-title">Upcoming Games</div>
          <div className="section-sub">Next matchups on the schedule</div>
          {upcoming.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No games scheduled.</p>}
          <ul className="game-list">
            {upcoming.map((g) => (
              <li key={g.id} className="game-row">
                <span className="game-date">{formatDate(g.date)}<br />{formatTime(g.time)}</span>
                <span className="game-teams">
                  <TeamBadge team={teamById[g.away]} size={28} /> {g.awayName}
                  <span className="game-at">@</span>
                  {g.homeName} <TeamBadge team={teamById[g.home]} size={28} />
                </span>
              </li>
            ))}
          </ul>
          <Link to="/schedule" className="see-all">See full schedule &rarr;</Link>
        </div>

        <div className="card home-block">
          <div className="section-title">Recent Results</div>
          <div className="section-sub">Latest final scores</div>
          {recent.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No final scores yet.</p>}
          <ul className="game-list">
            {recent.map((g) => (
              <li key={g.id} className="game-row">
                <span className="game-date">{formatDate(g.date)}</span>
                <span className="game-teams score">
                  {g.awayName} <b>{g.awayScore}</b>
                  <span className="game-at">@</span>
                  <b>{g.homeScore}</b> {g.homeName}
                </span>
              </li>
            ))}
          </ul>
          <Link to="/schedule" className="see-all">See full schedule &rarr;</Link>
        </div>
      </section>

      <section className="home-grid">
        <div className="card home-block">
          <div className="section-title">Standings</div>
          <div className="section-sub">Top of the table</div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Team</th>
                  <th>W</th>
                  <th>L</th>
                  <th>PCT</th>
                </tr>
              </thead>
              <tbody>
                {topStandings.map((row) => (
                  <tr key={row.team}>
                    <td>{row.rank}</td>
                    <td>
                      <Link
                        to={`/teams/${row.team}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
                      >
                        <TeamBadge team={teamById[row.team]} size={22} />
                        {row.name}
                      </Link>
                    </td>
                    <td>{row.wins}</td>
                    <td>{row.losses}</td>
                    <td>{row.winPct.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link to="/standings" className="see-all">Full standings &rarr;</Link>
        </div>

        <div className="card home-block">
          <div className="section-title">Latest News</div>
          <div className="section-sub">What's happening around the league</div>
          <ul className="news-list">
            {latestNews.map((n) => (
              <li key={n.id}>
                <Link to={`/news/${n.id}`} className="news-list-item">
                  <span className="badge">{n.tag}</span>
                  <span className="news-list-title">{n.title}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/news" className="see-all">All news &rarr;</Link>
        </div>
      </section>
    </div>
  )
}
