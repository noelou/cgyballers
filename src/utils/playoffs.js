// Pure function: given the standings (from buildStandings) and every game,
// work out the whole playoff bracket. Seeds come from the standings; who
// advances comes from games tagged with a playoff `stage`. Shared by the API
// server (server/routes/public.mjs), like standings.js.

export const STAGE_LABELS = {
  elimination: 'Elimination Round',
  playin: 'Play-In',
  qf: 'Quarterfinals',
  sf: 'Semifinals',
  final: 'Finals',
}

export const STAGES = Object.keys(STAGE_LABELS)

// How many wins each side needs. Twice-to-beat: the higher seed (always the
// `top` side) advances with one win; the lower seed has to win twice.
const FORMATS = {
  'twice-to-beat': { label: 'Twice-to-beat', topNeeds: 1, bottomNeeds: 2 },
  bo3: { label: 'Best of 3', topNeeds: 2, bottomNeeds: 2 },
}

// The fixed 12-team bracket, top to bottom as it's drawn. A side is either a
// seed straight from the standings or the winner of an earlier series.
// Play-In series sit next to the Quarterfinal they feed.
export const BRACKET = [
  { id: 'P1', stage: 'playin', format: 'twice-to-beat', top: { seed: 8 }, bottom: { seed: 9 } },
  { id: 'P2', stage: 'playin', format: 'twice-to-beat', top: { seed: 5 }, bottom: { seed: 12 } },
  { id: 'P3', stage: 'playin', format: 'twice-to-beat', top: { seed: 7 }, bottom: { seed: 10 } },
  { id: 'P4', stage: 'playin', format: 'twice-to-beat', top: { seed: 6 }, bottom: { seed: 11 } },
  { id: 'Q1', stage: 'qf', format: 'twice-to-beat', top: { seed: 1 }, bottom: { winnerOf: 'P1' } },
  { id: 'Q2', stage: 'qf', format: 'twice-to-beat', top: { seed: 4 }, bottom: { winnerOf: 'P2' } },
  { id: 'Q3', stage: 'qf', format: 'twice-to-beat', top: { seed: 2 }, bottom: { winnerOf: 'P3' } },
  { id: 'Q4', stage: 'qf', format: 'twice-to-beat', top: { seed: 3 }, bottom: { winnerOf: 'P4' } },
  { id: 'S1', stage: 'sf', format: 'bo3', top: { winnerOf: 'Q1' }, bottom: { winnerOf: 'Q2' } },
  { id: 'S2', stage: 'sf', format: 'bo3', top: { winnerOf: 'Q3' }, bottom: { winnerOf: 'Q4' } },
  { id: 'F', stage: 'final', format: 'bo3', top: { winnerOf: 'S1' }, bottom: { winnerOf: 'S2' } },
]

function gameWinner(g) {
  if (g.status === 'forfeit') return g.winner ?? null
  if (g.status === 'final' && typeof g.homeScore === 'number' && typeof g.awayScore === 'number') {
    return g.homeScore > g.awayScore ? g.home : g.away
  }
  return null
}

export function buildBracket(standings, games) {
  const bySeed = Object.fromEntries(standings.map((r) => [r.rank, r]))
  const teamSeed = Object.fromEntries(standings.map((r) => [r.team, r.rank]))

  // Seeds are "projected" until every team has finished its round robin
  // (played everyone else once), or playoff games have started.
  const roundRobinDone = standings.length > 1 && standings.every((r) => r.gp >= standings.length - 1)
  const playoffsStarted = games.some((g) => (g.stage ?? 'elimination') !== 'elimination')
  const projected = !(roundRobinDone || playoffsStarted)

  if (standings.length !== 12) {
    return { projected, ready: false, series: [] }
  }

  const done = {}

  function resolveSide(side) {
    const teamId = side.seed ? bySeed[side.seed]?.team : done[side.winnerOf]?.winner
    if (!teamId) return { team: null, seed: null, from: side.winnerOf ?? null }
    const row = standings.find((r) => r.team === teamId)
    return {
      team: teamId,
      name: row?.name ?? teamId,
      seed: teamSeed[teamId],
      from: side.winnerOf ?? null,
      backedOut: !!row?.rankedLast,
    }
  }

  const series = BRACKET.map((def) => {
    const format = FORMATS[def.format]
    const top = { ...resolveSide(def.top), wins: 0, needs: format.topNeeds }
    const bottom = { ...resolveSide(def.bottom), wins: 0, needs: format.bottomNeeds }

    const seriesGames =
      top.team && bottom.team
        ? games
            .filter(
              (g) =>
                g.stage === def.stage &&
                g.status !== 'cancelled' &&
                ((g.home === top.team && g.away === bottom.team) || (g.home === bottom.team && g.away === top.team))
            )
            .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
        : []

    // A team the league ruled out for backing out (Admin > Edit Team > Rank
    // last) forfeits any series it's in: the opponent advances automatically.
    let winner = null
    let walkover = false
    if (top.team && bottom.team && top.backedOut !== bottom.backedOut) {
      winner = top.backedOut ? bottom.team : top.team
      walkover = true
    }
    for (const g of seriesGames) {
      if (winner) break
      const w = gameWinner(g)
      if (w === top.team) top.wins++
      else if (w === bottom.team) bottom.wins++
      if (top.wins >= top.needs) winner = top.team
      else if (bottom.wins >= bottom.needs) winner = bottom.team
    }

    const result = {
      id: def.id,
      stage: def.stage,
      format: def.format,
      formatLabel: format.label,
      top,
      bottom,
      winner,
      walkover,
      games: seriesGames.map((g, i) => ({
        id: g.id,
        number: i + 1,
        date: g.date,
        time: g.time,
        status: g.status,
        home: g.home,
        away: g.away,
        homeScore: g.homeScore,
        awayScore: g.awayScore,
        winner: gameWinner(g),
      })),
    }
    done[def.id] = result
    return result
  })

  return { projected, ready: true, series }
}
