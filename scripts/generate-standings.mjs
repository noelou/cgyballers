// Recomputes src/data/standings.json from the current src/data/schedule.json.
// Safe to run after manually editing scores/status in schedule.json — it only
// reads that file and writes standings.json; it never touches schedule.json,
// teams.json, or anything else.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'src', 'data')

const teams = JSON.parse(readFileSync(join(DATA_DIR, 'teams.json'), 'utf8'))
const schedule = JSON.parse(readFileSync(join(DATA_DIR, 'schedule.json'), 'utf8'))

function buildStandings() {
  const table = {}
  teams.forEach((t) => {
    table[t.id] = { team: t.id, name: t.name, color: t.color, wins: 0, losses: 0, pf: 0, pa: 0, streak: 0, streakType: null }
  })
  schedule.filter((g) => g.status === 'final').forEach((g) => {
    const h = table[g.home]
    const a = table[g.away]
    if (!h || !a) throw new Error(`Unknown team id in game ${g.id}: home=${g.home} away=${g.away}`)
    h.pf += g.homeScore; h.pa += g.awayScore
    a.pf += g.awayScore; a.pa += g.homeScore
    if (g.homeScore > g.awayScore) { h.wins++; a.losses++ } else { a.wins++; h.losses++ }
  })
  const rows = Object.values(table).map((r) => {
    const gp = r.wins + r.losses
    return {
      ...r,
      gp,
      winPct: gp ? +(r.wins / gp).toFixed(3) : 0,
      diff: r.pf - r.pa,
    }
  })
  rows.sort((a, b) => b.winPct - a.winPct || b.diff - a.diff)
  const leaderWins = rows[0]?.wins ?? 0
  const leaderLosses = rows[0]?.losses ?? 0
  rows.forEach((r, i) => {
    r.rank = i + 1
    r.gb = i === 0 ? 0 : +(((leaderWins - r.wins) + (r.losses - leaderLosses)) / 2).toFixed(1)
  })
  return rows
}

const standings = buildStandings()
writeFileSync(join(DATA_DIR, 'standings.json'), JSON.stringify(standings, null, 2))

console.log(`Standings updated from ${schedule.filter((g) => g.status === 'final').length} final games.`)
