// Pure function: given the full players list and a statsByPlayer map (from
// playerStats.js), return the top `count` qualified players for a stat key
// (e.g. 'ppg', 'tpm'), each as { id, name, teamName, pic, value, gp }.

export const MIN_GP = 5

// Rebounds averages need a bit more sample before the ranking is meaningful.
export const REBOUND_MIN_GP = 6

// Playoff runs differ in length: a play-in team may be out after 1 game while
// a finalist plays 8. So a fixed minimum doesn't work: 1 lets a single big
// game top the averages, a high number leaves nobody qualified early on.
// Instead, a playoff average counts once a player has played at least half
// as many playoff games as the team that has played the most (rounded up).
// It starts at 1 and grows by itself as the playoffs go on.
export function playoffMinGp(games) {
  const played = {}
  for (const g of games) {
    if (!g.stage || g.stage === 'elimination' || g.status !== 'final') continue
    played[g.home] = (played[g.home] ?? 0) + 1
    played[g.away] = (played[g.away] ?? 0) + 1
  }
  const most = Math.max(0, ...Object.values(played))
  return Math.max(1, Math.ceil(most / 2))
}

// The minimum games for one leaderboard. `total` stats (like 3-pointers
// made) already reward playing more games, so in the playoffs they only
// need one appearance.
export const minGpFor = (phase, statMinGp = MIN_GP, { playoffMin = 1, total = false } = {}) =>
  phase === 'playoffs' ? (total ? 1 : playoffMin) : statMinGp

export function buildLeaders(players, statsByPlayer, statKey, count = 1, minGp = MIN_GP) {
  return players
    .map((p) => ({ p, s: statsByPlayer[p.id] ?? { gp: 0 } }))
    .filter((x) => x.s.gp >= minGp)
    .sort((a, b) => b.s[statKey] - a.s[statKey] || b.s.ppg - a.s.ppg)
    .slice(0, count)
    .map((x) => ({
      id: x.p.id,
      name: x.p.name,
      teamName: x.p.teamName,
      pic: x.p.pic,
      value: x.s[statKey],
      ppg: x.s.ppg,
      gp: x.s.gp,
    }))
}
