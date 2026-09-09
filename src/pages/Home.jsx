import { Link } from 'react-router-dom'
import schedule from '../data/schedule.json'
import standings from '../utils/standings'
import teams from '../data/teams.json'
import TeamBadge from '../components/TeamBadge'
import Avatar from '../components/Avatar'
import { leaders, MIN_GP, REBOUND_MIN_GP } from '../utils/leaders'
import { formatDateShort as formatDate, formatTime } from '../utils/date'
import './Home.css'

const teamById = Object.fromEntries(teams.map((t) => [t.id, t]))

// Points is ranked on each player's 5 best games (see playerStats.best5pts) so
// extra games don't inflate the total, but the number shown is plain PPG.
const LEADER_CATS = [
  { key: 'best5pts', label: 'Points', fmt: (p) => p.ppg.toFixed(1) },
  { key: 'rpg', label: 'Rebounds', fmt: (p) => p.value.toFixed(1), minGp: REBOUND_MIN_GP },
  { key: 'apg', label: 'Assists', fmt: (p) => p.value.toFixed(1) },
  { key: 'tpm', label: 'Threes', fmt: (p) => String(p.value) },
]

export default function Home() {
  const todayStr = new Date().toISOString().slice(0, 10)
  const upcoming = schedule
    .filter((g) => g.status === 'scheduled' && g.date >= todayStr)
    .slice(0, 3)
  const recent = schedule.filter((g) => g.status === 'final').slice(-3).reverse()
  const topStandings = standings.slice(0, 5)
  const leaderRows = LEADER_CATS
    .map((c) => ({ ...c, top: leaders(c.key, 3, c.minGp ?? MIN_GP) }))
    .filter((c) => c.top.length > 0)

  return (
    <div className="container">
      <section className="hero">
        <span className="eyebrow">Season 4 Amlans Cup</span>
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
                  <TeamBadge team={teamById[g.home]} size={28} /> {g.homeName}
                  <span className="game-at">@</span>
                  {g.awayName} <TeamBadge team={teamById[g.away]} size={28} />
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
                  {g.homeName} <b>{g.homeScore}</b>
                  <span className="game-at">@</span>
                  <b>{g.awayScore}</b> {g.awayName}
                </span>
              </li>
            ))}
          </ul>
          <Link to="/schedule" className="see-all">See full schedule &rarr;</Link>
        </div>
      </section>

      {leaderRows.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <div className="card home-block">
            <div className="section-title">League Leaders</div>
            <div className="section-sub">Season leaders &middot; qualified players only</div>
            <div className="leader-list">
              {leaderRows.map((c) => (
                <div key={c.key} className="leader-group">
                  <div className="leader-cat">{c.label}</div>
                  <ol className="leader-ranks">
                    {c.top.map((p, i) => (
                      <li key={p.id} className="leader-rank-row">
                        <span className="leader-rank">{i + 1}</span>
                        <Link to={`/players/${p.id}`} className="leader-player">
                          <Avatar name={p.name} pic={p.pic} size={28} />
                          <span className="leader-name">{p.name}</span>
                          <span className="leader-team">{p.teamName}</span>
                        </Link>
                        <span className="leader-value">{c.fmt(p)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
            <Link to="/players" className="see-all">See all players &rarr;</Link>
          </div>
        </section>
      )}

      <section style={{ marginBottom: 20 }}>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link to="/standings" className="see-all">Full standings &rarr;</Link>
        </div>
      </section>
    </div>
  )
}
