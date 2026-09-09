import { Link } from 'react-router-dom'
import Avatar from './Avatar'
import { getPlayerStats } from '../utils/playerStats'
import './PlayerCard.css'

// Stats already shown on every card — no need to repeat them as the active sort.
const BASE_STATS = new Set(['ppg', 'rpg', 'apg'])

export default function PlayerCard({ player, statKey, statLabel }) {
  const stats = getPlayerStats(player.id)
  const showActive = statKey && !BASE_STATS.has(statKey)

  return (
    <Link to={`/players/${player.id}`} className="card player-card">
      <div className="player-card-top">
        <Avatar name={player.name} pic={player.pic} size={52} />
        <div>
          <div className="player-card-name">{player.name}</div>
          <div className="player-card-meta">
            {player.teamName}
            {stats.gp > 0 && <span className="player-card-gp"> &middot; {stats.gp} GP</span>}
          </div>
        </div>
      </div>
      <div className="player-card-stats">
        <div>
          <span className="stat-value">{stats.gp ? stats.ppg : '—'}</span>
          <span className="stat-label">PPG</span>
        </div>
        <div>
          <span className="stat-value">{stats.gp ? stats.rpg : '—'}</span>
          <span className="stat-label">RPG</span>
        </div>
        <div>
          <span className="stat-value">{stats.gp ? stats.apg : '—'}</span>
          <span className="stat-label">APG</span>
        </div>
        {showActive && (
          <div className="stat-active">
            <span className="stat-value">{stats.gp ? stats[statKey] : '—'}</span>
            <span className="stat-label">{statLabel}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
