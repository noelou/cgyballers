import { useMemo, useState } from 'react'
import players from '../data/players.json'
import teams from '../data/teams.json'
import PlayerCard from '../components/PlayerCard'
import { getPlayerStats } from '../utils/playerStats'
import { MIN_GP, REBOUND_MIN_GP } from '../utils/leaders'
import './Players.css'

const SORTS = {
  best5pts: { label: 'Points', short: 'PTS·5', desc: 'total points across each player’s 5 best games' },
  rpg: { label: 'Rebounds', short: 'RPG', desc: 'rebounds per game', minGp: REBOUND_MIN_GP },
  apg: { label: 'Assists', short: 'APG', desc: 'assists per game' },
  spg: { label: 'Steals', short: 'SPG', desc: 'steals per game' },
  bpg: { label: 'Blocks', short: 'BPG', desc: 'blocks per game' },
  tpm: { label: '3-Pointers Made', short: '3PM', desc: 'three-pointers made (season total)' },
}

export default function Players() {
  const [query, setQuery] = useState('')
  const [teamFilter, setTeamFilter] = useState('all')
  const [sortKey, setSortKey] = useState('best5pts')

  const minGp = SORTS[sortKey].minGp ?? MIN_GP

  const { qualified, unqualified } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const bySort = (a, b) => {
      const sa = getPlayerStats(a.id)
      const sb = getPlayerStats(b.id)
      return sb[sortKey] - sa[sortKey] || sb.ppg - sa.ppg
    }
    const matches = players
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .filter((p) => (teamFilter === 'all' ? true : p.team === teamFilter))

    return {
      qualified: matches.filter((p) => getPlayerStats(p.id).gp >= minGp).sort(bySort),
      unqualified: matches.filter((p) => getPlayerStats(p.id).gp < minGp).sort(bySort),
    }
  }, [query, teamFilter, sortKey, minGp])

  const sort = SORTS[sortKey]
  const total = qualified.length + unqualified.length

  return (
    <div className="container">
      <span className="eyebrow">Rosters</span>
      <h1 className="section-title" style={{ fontSize: 28, marginTop: 8 }}>Players</h1>
      <p className="section-sub">
        {players.length} players across 12 teams. Leaders ranked by {sort.desc} &middot; min. {minGp} games played.
      </p>

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
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>Sort: {s.label}</option>
          ))}
        </select>
      </div>

      {total === 0 ? (
        <div className="empty-state card">No players match your filters.</div>
      ) : (
        <>
          {qualified.length > 0 && (
            <div className="grid players-grid">
              {qualified.map((p) => (
                <PlayerCard key={p.id} player={p} statKey={sortKey} statLabel={sort.short} />
              ))}
            </div>
          )}

          {unqualified.length > 0 && (
            <>
              <div className="players-section-label">Not yet qualified &middot; under {minGp} games</div>
              <div className="grid players-grid players-grid-dim">
                {unqualified.map((p) => (
                  <PlayerCard key={p.id} player={p} statKey={sortKey} statLabel={sort.short} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
