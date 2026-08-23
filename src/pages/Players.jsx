import { useMemo, useState } from 'react'
import players from '../data/players.json'
import teams from '../data/teams.json'
import PlayerCard from '../components/PlayerCard'
import './Players.css'

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C']

export default function Players() {
  const [query, setQuery] = useState('')
  const [teamFilter, setTeamFilter] = useState('all')
  const [posFilter, setPosFilter] = useState('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return players
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .filter((p) => (teamFilter === 'all' ? true : p.team === teamFilter))
      .filter((p) => (posFilter === 'all' ? true : p.position === posFilter))
      .sort((a, b) => b.ppg - a.ppg)
  }, [query, teamFilter, posFilter])

  return (
    <div className="container">
      <span className="eyebrow">Rosters</span>
      <h1 className="section-title" style={{ fontSize: 28, marginTop: 8 }}>Players</h1>
      <p className="section-sub">{players.length} players across 12 teams. Sorted by points per game.</p>

      <div className="players-filters">
        <input
          type="text"
          placeholder="Search player name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
          <option value="all">All Teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select value={posFilter} onChange={(e) => setPosFilter(e.target.value)}>
          <option value="all">All Positions</option>
          {POSITIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">No players match your filters.</div>
      ) : (
        <div className="grid players-grid">
          {filtered.map((p) => (
            <PlayerCard key={p.id} player={p} />
          ))}
        </div>
      )}
    </div>
  )
}
