import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import schedule from '../data/schedule.json'
import teams from '../data/teams.json'
import TeamBadge from '../components/TeamBadge'
import { hasBoxscore } from '../utils/boxscores'
import { formatDate, formatTime } from '../utils/date'
import './Schedule.css'

const teamById = Object.fromEntries(teams.map((t) => [t.id, t]))

export default function Schedule() {
  const [teamFilter, setTeamFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return schedule
      .filter((g) => teamFilter === 'all' || g.home === teamFilter || g.away === teamFilter)
      .filter((g) => statusFilter === 'all' || g.status === statusFilter)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  }, [teamFilter, statusFilter])

  const grouped = useMemo(() => {
    const map = new Map()
    filtered.forEach((g) => {
      if (!map.has(g.date)) map.set(g.date, [])
      map.get(g.date).push(g)
    })
    return [...map.entries()]
  }, [filtered])

  return (
    <div className="container">
      <span className="eyebrow">2026 Season</span>
      <h1 className="section-title" style={{ fontSize: 28, marginTop: 8 }}>Schedule</h1>
      <p className="section-sub">Every matchup on the CGYBallers calendar.</p>

      <div className="schedule-filters">
        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
          <option value="all">All Teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Games</option>
          <option value="scheduled">Upcoming</option>
          <option value="final">Final</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {grouped.length === 0 && (
        <div className="empty-state card">No games match these filters.</div>
      )}

      <div className="schedule-list">
        {grouped.map(([date, games]) => (
          <div key={date} className="schedule-day">
            <div className="schedule-date">{formatDate(date, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
            {games.map((g) => (
              <div key={g.id} className={`card schedule-row ${g.status === 'cancelled' ? 'schedule-row-cancelled' : ''}`}>
                <div className="schedule-time">{formatTime(g.time)}</div>
                <div className="schedule-team">
                  <TeamBadge team={teamById[g.home]} size={32} />
                  <Link to={`/teams/${g.home}`}>{g.homeName}</Link>
                </div>
                <div className="schedule-result">
                  {g.status === 'final' ? (
                    hasBoxscore(g.id) ? (
                      <Link to={`/games/${g.id}`} className="schedule-score schedule-score-link" title="View box score">
                        <b className={g.homeScore > g.awayScore ? 'win' : ''}>{g.homeScore}</b>
                        {' – '}
                        <b className={g.awayScore > g.homeScore ? 'win' : ''}>{g.awayScore}</b>
                      </Link>
                    ) : (
                      <span className="schedule-score">
                        <b className={g.homeScore > g.awayScore ? 'win' : ''}>{g.homeScore}</b>
                        {' – '}
                        <b className={g.awayScore > g.homeScore ? 'win' : ''}>{g.awayScore}</b>
                      </span>
                    )
                  ) : g.status === 'cancelled' ? (
                    <span className="schedule-vs">–</span>
                  ) : (
                    <span className="schedule-vs">@</span>
                  )}
                </div>
                <div className="schedule-team schedule-team-right">
                  <Link to={`/teams/${g.away}`}>{g.awayName}</Link>
                  <TeamBadge team={teamById[g.away]} size={32} />
                </div>
                <div className="schedule-venue">{g.venue}</div>
                <span className={`badge schedule-status ${g.status === 'final' ? 'status-final' : ''} ${g.status === 'cancelled' ? 'status-cancelled' : ''}`}>
                  {g.status === 'final' ? 'Final' : g.status === 'cancelled' ? 'Cancelled' : 'Upcoming'}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
