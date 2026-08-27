import { readFileSync, writeFileSync } from 'node:fs'

const schedule = JSON.parse(readFileSync('src/data/schedule.json', 'utf8'))
const teams = JSON.parse(readFileSync('src/data/teams.json', 'utf8'))

const stats = new Map(
  teams.map((t) => [
    t.id,
    { team: t.id, name: t.name, color: t.color, wins: 0, losses: 0, pf: 0, pa: 0, results: [] },
  ])
)

const flagged = []

for (const g of schedule) {
  const played = g.status === 'final' && typeof g.homeScore === 'number' && typeof g.awayScore === 'number'
  if (g.status === 'final' && !played) {
    flagged.push(g.id)
    continue
  }
  if (!played) continue

  const home = stats.get(g.home)
  const away = stats.get(g.away)
  home.pf += g.homeScore
  home.pa += g.awayScore
  away.pf += g.awayScore
  away.pa += g.homeScore

  if (g.homeScore > g.awayScore) {
    home.wins++
    away.losses++
    home.results.push('W')
    away.results.push('L')
  } else {
    away.wins++
    home.losses++
    away.results.push('W')
    home.results.push('L')
  }
}

const rows = [...stats.values()].map((s) => {
  const gp = s.wins + s.losses
  const winPct = gp ? +(s.wins / gp).toFixed(3) : 0
  const diff = s.pf - s.pa
  let streak = 0
  let streakType = null
  for (let i = s.results.length - 1; i >= 0; i--) {
    if (i === s.results.length - 1) {
      streakType = s.results[i]
      streak = 1
    } else if (s.results[i] === streakType) {
      streak++
    } else break
  }
  return {
    team: s.team,
    name: s.name,
    color: s.color,
    wins: s.wins,
    losses: s.losses,
    pf: s.pf,
    pa: s.pa,
    streak,
    streakType,
    gp,
    winPct,
    diff,
  }
})

rows.sort((a, b) => b.winPct - a.winPct || b.diff - a.diff)

const leader = rows[0]
rows.forEach((r, i) => {
  r.rank = i + 1
  r.gb = Math.max(0, +(((leader.wins - r.wins) + (r.losses - leader.losses)) / 2).toFixed(1))
})

writeFileSync('src/data/standings.json', JSON.stringify(rows, null, 2) + '\n')

if (flagged.length) {
  console.log('WARNING: games marked final with missing scores, skipped:', flagged.join(', '))
}
console.log('standings.json updated from', schedule.filter(g => g.status === 'final' && typeof g.homeScore === 'number').length, 'completed games')
