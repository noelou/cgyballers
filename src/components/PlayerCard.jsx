import { Link } from 'react-router-dom'
import Avatar from './Avatar'
import { getPlayerStats } from '../utils/playerStats'
import './PlayerCard.css'

export default function PlayerCard({ player }) {
  const stats = getPlayerStats(player.id)
  return (
    <Link to={`/players/${player.id}`} className="card player-card">
      <div className="player-card-top">
        <Avatar name={player.name} pic={player.pic} size={52} />
        <div>
          <div className="player-card-name">{player.name}</div>
          <div className="player-card-meta">
            {player.number != null && `#${player.number} · `}
            {player.position && `${player.position} · `}
            {player.teamName}
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
      </div>
    </Link>
  )
}
