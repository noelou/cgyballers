// Player season stats are computed at load time from the per-game box scores
// in src/data/boxscores/*.json — there is nothing to regenerate. Add a new
// box-score file (see an existing one for the shape) and every player's
// averages, shooting %, and games-played update automatically on reload/build.

import boxscores from './boxscores'

function emptyLine() {
  return { gp: 0, pts: 0, reb: 0, ast: 0, blk: 0, stl: 0, tpa: 0, tpm: 0, fta: 0, ftm: 0 }
}

const totals = {}

for (const game of boxscores) {
  for (const [playerId, line] of Object.entries(game.lines ?? {})) {
    const t = (totals[playerId] ??= emptyLine())
    t.gp += 1
    t.pts += line.pts ?? 0
    t.reb += line.reb ?? 0
    t.ast += line.ast ?? 0
    t.blk += line.blk ?? 0
    t.stl += line.stl ?? 0
    t.tpa += line.tpa ?? 0
    t.tpm += line.tpm ?? 0
    t.fta += line.fta ?? 0
    t.ftm += line.ftm ?? 0
  }
}

const avg = (sum, gp) => (gp ? +(sum / gp).toFixed(1) : 0)
const pct = (made, att) => (att ? +((made / att) * 100).toFixed(1) : null)

// { playerId: { gp, ppg, rpg, apg, bpg, spg, tpPct, ftPct, totals } }
const statsByPlayer = Object.fromEntries(
  Object.entries(totals).map(([id, t]) => [
    id,
    {
      gp: t.gp,
      ppg: avg(t.pts, t.gp),
      rpg: avg(t.reb, t.gp),
      apg: avg(t.ast, t.gp),
      bpg: avg(t.blk, t.gp),
      spg: avg(t.stl, t.gp),
      tpPct: pct(t.tpm, t.tpa),
      ftPct: pct(t.ftm, t.fta),
      totals: { ...t },
    },
  ])
)

const ZERO = { gp: 0, ppg: 0, rpg: 0, apg: 0, bpg: 0, spg: 0, tpPct: null, ftPct: null, totals: emptyLine() }

export function getPlayerStats(playerId) {
  return statsByPlayer[playerId] ?? ZERO
}

export default statsByPlayer
