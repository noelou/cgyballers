import { Link, useParams } from 'react-router-dom'
import players from '../data/players.json'
import teams from '../data/teams.json'
import Avatar from '../components/Avatar'
import { formatDate } from '../utils/date'
import './PlayerDetail.css'

const teamById = Object.fromEntries(teams.map((t) => [t.id, t]))

export default function PlayerDetail() {
  const { playerId } = useParams()
  const player = players.find((p) => p.id === playerId)

  if (!player) {
    return (
      <div className="container">
        <div className="empty-state card">
          <p>Player not found.</p>
          <Link to="/players" className="btn">Back to Players</Link>
        </div>
      </div>
    )
  }

  const team = teamById[player.team]

  return (
    <div className="container">
      <Link to="/players" style={{ color: 'var(--accent-strong)', fontWeight: 700, fontSize: 13 }}>
        &larr; Back to Players
      </Link>

      <div className="card player-detail-header">
        <Avatar name={player.name} size={88} />
        <div>
          <div className="player-detail-team">
            <span style={{ background: team?.color }} className="team-dot" />
            <Link to={`/teams/${player.team}`}>{player.teamName}</Link>
          </div>
          <h1 className="player-detail-name">{player.name}</h1>
          <p className="player-detail-sub">
            #{player.number} &middot; {player.positionLabel} ({player.position})
          </p>
        </div>
      </div>

      <div className="player-stat-strip">
        <StatBlock label="PPG" value={player.ppg} />
        <StatBlock label="RPG" value={player.rpg} />
        <StatBlock label="APG" value={player.apg} />
      </div>

      <div className="card player-bio">
        <div className="section-title" style={{ fontSize: 16 }}>Bio</div>
        <dl className="bio-grid">
          <BioRow label="Height" value={`${player.heightDisplay} (${player.heightCm} cm)`} />
          <BioRow label="Weight" value={`${player.weightKg} kg`} />
          <BioRow label="Country" value={player.country} />
          <BioRow label="Age" value={player.age} />
          <BioRow label="Birthdate" value={formatDate(player.birthdate)} />
          <BioRow label="Experience" value={player.experience} />
          <BioRow label="Draft" value={player.draft} />
          <BioRow label="Last Team" value={player.lastTeam} />
        </dl>
      </div>
    </div>
  )
}

function StatBlock({ label, value }) {
  return (
    <div className="card player-stat-block">
      <span className="player-stat-value">{value}</span>
      <span className="player-stat-label">{label}</span>
    </div>
  )
}

function BioRow({ label, value }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  )
}
