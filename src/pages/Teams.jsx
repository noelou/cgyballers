import { Link } from 'react-router-dom'
import teams from '../data/teams.json'
import standings from '../data/standings.json'
import TeamBadge from '../components/TeamBadge'
import './Teams.css'

const standingsByTeam = Object.fromEntries(standings.map((s) => [s.team, s]))

export default function Teams() {
  return (
    <div className="container">
      <span className="eyebrow">League</span>
      <h1 className="section-title" style={{ fontSize: 28, marginTop: 8 }}>Teams</h1>
      <p className="section-sub">All 12 teams competing this season.</p>

      <div className="grid teams-grid">
        {teams.map((t) => {
          const record = standingsByTeam[t.id]
          return (
            <Link key={t.id} to={`/teams/${t.id}`} className="card team-card">
              <TeamBadge team={t} size={48} />
              <div>
                <div className="team-card-name">{t.name}</div>
                <div className="team-card-meta">
                  {record ? `${record.wins}-${record.losses}` : '0-0'} &middot; {t.playerIds.length} players
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
