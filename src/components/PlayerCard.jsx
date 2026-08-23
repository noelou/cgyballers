import { Link } from 'react-router-dom'
import Avatar from './Avatar'
import './PlayerCard.css'

export default function PlayerCard({ player }) {
  return (
    <Link to={`/players/${player.id}`} className="card player-card">
      <div className="player-card-top">
        <Avatar name={player.name} size={52} />
        <div>
          <div className="player-card-name">{player.name}</div>
          <div className="player-card-meta">
            #{player.number} &middot; {player.position} &middot; {player.teamName}
          </div>
        </div>
      </div>
      <div className="player-card-stats">
        <div>
          <span className="stat-value">{player.ppg}</span>
          <span className="stat-label">PPG</span>
        </div>
        <div>
          <span className="stat-value">{player.rpg}</span>
          <span className="stat-label">RPG</span>
        </div>
        <div>
          <span className="stat-value">{player.apg}</span>
          <span className="stat-label">APG</span>
        </div>
      </div>
    </Link>
  )
}
