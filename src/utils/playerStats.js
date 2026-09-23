// Pure function: given a flat list of box-score lines (same shape as rows
// from the `boxscore_lines` table — { playerId, pts, reb, ast, blk, stl,
// tpa, tpm, fta, ftm }), compute each player's season averages. Shared by
// the API server (server/index.mjs) so this logic only lives in one place.

function emptyLine() {
  return { gp: 0, pts: 0, reb: 0, ast: 0, blk: 0, stl: 0, tpa: 0, tpm: 0, fta: 0, ftm: 0 }
}

const avg = (sum, gp) => (gp ? +(sum / gp).toFixed(1) : 0)
const pct = (made, att) => (att ? +((made / att) * 100).toFixed(1) : null)

export const ZERO_STATS = {
  gp: 0, ppg: 0, rpg: 0, apg: 0, bpg: 0, spg: 0, tpm: 0, tpPct: null, ftPct: null, totals: emptyLine(),
}

// { playerId: { gp, ppg, rpg, apg, bpg, spg, tpm, tpPct, ftPct, totals } }
export function buildPlayerStats(lines) {
  const totals = {}

  for (const line of lines) {
    const t = (totals[line.playerId] ??= emptyLine())
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

  return Object.fromEntries(
    Object.entries(totals).map(([id, t]) => [
      id,
      {
        gp: t.gp,
        ppg: avg(t.pts, t.gp),
        rpg: avg(t.reb, t.gp),
        apg: avg(t.ast, t.gp),
        bpg: avg(t.blk, t.gp),
        spg: avg(t.stl, t.gp),
        tpm: t.tpm,
        tpPct: pct(t.tpm, t.tpa),
        ftPct: pct(t.ftm, t.fta),
        totals: { ...t },
      },
    ])
  )
}

export function getStats(statsByPlayer, playerId) {
  return statsByPlayer[playerId] ?? ZERO_STATS
}
