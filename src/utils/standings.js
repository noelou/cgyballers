// Pure function: given a list of games and teams (same shape whether they
// come from schedule.json/teams.json or a Postgres query), compute the
// standings table. Shared by the API server (server/index.mjs) so the
// ranking/tiebreak rules only live in one place.
export function buildStandings(schedule, teams) {
  const table = {}
  teams.forEach((t) => {
    table[t.id] = {
      team: t.id,
      name: t.name,
      color: t.color,
      wins: 0,
      losses: 0,
      pf: 0,
      pa: 0,
      streak: 0,
      streakType: null,
    }
  })

  schedule
    .filter((g) => g.status === 'final' && typeof g.homeScore === 'number' && typeof g.awayScore === 'number')
    .forEach((g) => {
      const h = table[g.home]
      const a = table[g.away]
      if (!h || !a) return
      h.pf += g.homeScore
      h.pa += g.awayScore
      a.pf += g.awayScore
      a.pa += g.homeScore
      if (g.homeScore > g.awayScore) {
        h.wins++
        a.losses++
      } else {
        a.wins++
        h.losses++
      }
    })

  // Forfeits count as a win/loss but carry no score, so PF/PA are untouched.
  schedule
    .filter((g) => g.status === 'forfeit' && g.winner)
    .forEach((g) => {
      const winner = table[g.winner]
      const loserId = g.winner === g.home ? g.away : g.home
      const loser = table[loserId]
      if (!winner || !loser) return
      winner.wins++
      loser.losses++
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

  // Match the league's official standings graphic: rank by wins, then by
  // fewest losses. (Not win %, so a 4-1 team ranks above a 3-0 team.)
  // Point differential is only a last-resort tiebreak for teams level on W-L.
  rows.sort((a, b) => b.wins - a.wins || a.losses - b.losses || b.diff - a.diff)

  const leaderWins = rows[0]?.wins ?? 0
  const leaderLosses = rows[0]?.losses ?? 0
  rows.forEach((r, i) => {
    r.rank = i + 1
    r.gb = i === 0 ? 0 : +(((leaderWins - r.wins) + (r.losses - leaderLosses)) / 2).toFixed(1)
  })

  return rows
}
