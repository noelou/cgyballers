import { Link, useParams } from 'react-router-dom'
import teams from '../data/teams.json'
import players from '../data/players.json'
import standings from '../data/standings.json'
import schedule from '../data/schedule.json'
import Avatar from '../components/Avatar'
import TeamBadge from '../components/TeamBadge'
import { formatDateShort, formatTime } from '../utils/date'
import './TeamDetail.css'

export default function TeamDetail() {
  const { teamId } = useParams()
  const team = teams.find((t) => t.id === teamId)

  if (!team) {
    return (
      <div className="container">
        <div className="empty-state card">
          <p>Team not found.</p>
          <Link to="/teams" className="btn">Back to Teams</Link>
        </div>
      </div>
    )
  }

  const roster = players.filter((p) => p.team === team.id).sort((a, b) => a.number - b.number)
  const record = standings.find((s) => s.team === team.id)
  const games = schedule
    .filter((g) => g.home === team.id || g.away === team.id)
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="container">
      <Link to="/teams" style={{ color: 'var(--accent-strong)', fontWeight: 700, fontSize: 13 }}>
        &larr; Back to Teams
      </Link>

      <div className="card team-detail-header">
        <TeamBadge team={team} size={64} />
        <div>
          <h1 className="team-detail-name">{team.name}</h1>
          {record && (
            <p className="team-detail-sub">
              {record.wins}-{record.losses} &middot; Rank #{record.rank} &middot; {record.pf} PF / {record.pa} PA
            </p>
          )}
          <p className="team-detail-sub">Home court: {team.venue}</p>
        </div>
      </div>

      <div className="section-title" style={{ fontSize: 18, marginTop: 32 }}>Roster</div>
      <div className="grid team-roster-grid">
        {roster.map((p) => (
          <Link key={p.id} to={`/players/${p.id}`} className="card roster-row">
            <Avatar name={p.name} size={44} />
            <div>
              <div className="roster-name">{p.name}</div>
              <div className="roster-meta">#{p.number} &middot; {p.position} &middot; {p.ppg} PPG</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="section-title" style={{ fontSize: 18, marginTop: 32 }}>Games</div>
      <div className="card table-scroll">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Matchup</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => {
              const isHome = g.home === team.id
              const opponent = isHome ? g.awayName : g.homeName
              const teamScore = isHome ? g.homeScore : g.awayScore
              const oppScore = isHome ? g.awayScore : g.homeScore
              const won = g.status === 'final' && teamScore > oppScore
              return (
                <tr key={g.id}>
                  <td>{formatDateShort(g.date)}</td>
                  <td>{formatTime(g.time)}</td>
                  <td>{isHome ? 'vs' : '@'} {opponent}</td>
                  <td>
                    {g.status === 'final'
                      ? <span style={{ color: won ? 'var(--win)' : 'var(--loss)', fontWeight: 700 }}>
                          {won ? 'W' : 'L'} {teamScore}-{oppScore}
                        </span>
                      : g.status === 'cancelled'
                        ? <span style={{ color: 'var(--text-dim)' }}>Cancelled</span>
                        : <span style={{ color: 'var(--text-dim)' }}>Upcoming</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
