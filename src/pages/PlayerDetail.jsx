import { Link, useParams } from 'react-router-dom'
import players from '../data/players.json'
import teams from '../data/teams.json'
import Avatar from '../components/Avatar'
import { getPlayerStats } from '../utils/playerStats'
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
  const stats = getPlayerStats(player.id)
  const dash = (v) => (stats.gp ? v : '—')
  const pctText = (v) => (v == null ? '—' : `${v}%`)

  return (
    <div className="container">
      <Link to="/players" style={{ color: 'var(--accent-strong)', fontWeight: 700, fontSize: 13 }}>
        &larr; Back to Players
      </Link>

      <div className="card player-detail-header">
        <Avatar name={player.name} pic={player.pic} size={88} />
        <div>
          <div className="player-detail-team">
            <span style={{ background: team?.color }} className="team-dot" />
            <Link to={`/teams/${player.team}`}>{player.teamName}</Link>
          </div>
          <h1 className="player-detail-name">{player.name}</h1>
          <p className="player-detail-sub">
            {player.number != null && <>#{player.number} &middot; </>}
            {player.positionLabel
              ? <>{player.positionLabel} ({player.position})</>
              : 'Position not listed'}
          </p>
        </div>
      </div>

      <div className="player-stat-strip">
        <StatBlock label="GP" value={stats.gp} />
        <StatBlock label="PPG" value={dash(stats.ppg)} />
        <StatBlock label="RPG" value={dash(stats.rpg)} />
        <StatBlock label="APG" value={dash(stats.apg)} />
        <StatBlock label="BPG" value={dash(stats.bpg)} />
        <StatBlock label="SPG" value={dash(stats.spg)} />
        <StatBlock label="3P%" value={pctText(stats.tpPct)} />
        <StatBlock label="FT%" value={pctText(stats.ftPct)} />
      </div>
      <p className="player-stat-note">
        {stats.gp
          ? `Season averages from ${stats.gp} game${stats.gp > 1 ? 's' : ''}.`
          : 'No games recorded yet this season.'}
      </p>

      <div className="card player-bio">
        <div className="section-title" style={{ fontSize: 16 }}>Bio</div>
        <dl className="bio-grid">
          <BioRow label="Height" value={player.heightDisplay ? `${player.heightDisplay} (${player.heightCm} cm)` : '—'} />
          <BioRow label="Weight" value={player.weightKg ? `${player.weightKg} kg` : '—'} />
          <BioRow label="Age" value={player.age ?? '—'} />
          <BioRow label="Experience" value={player.experience || '—'} />
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
