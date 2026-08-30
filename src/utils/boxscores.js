// Loads every per-game box score in src/data/boxscores/*.json once, at load
// time. Add a file (see an existing one for the shape) and it flows through to
// player stats (src/utils/playerStats.js) and the game page automatically.
//
// Box-score line fields (raw counting stats, blanks in the record = 0):
//   pts, reb, ast, blk, stl, tpa (3PT att), tpm (3PT made), fta, ftm

const files = import.meta.glob('../data/boxscores/*.json', { eager: true })

const boxscores = Object.values(files).map((m) => m.default ?? m)

export const boxscoreByGame = Object.fromEntries(boxscores.map((b) => [b.gameId, b]))

export function getBoxscore(gameId) {
  return boxscoreByGame[gameId] ?? null
}

export function hasBoxscore(gameId) {
  return Object.prototype.hasOwnProperty.call(boxscoreByGame, gameId)
}

// Sum a set of box-score lines into a single totals line.
export function sumLines(lines) {
  const t = { pts: 0, reb: 0, ast: 0, blk: 0, stl: 0, tpa: 0, tpm: 0, fta: 0, ftm: 0 }
  for (const l of lines) {
    for (const k of Object.keys(t)) t[k] += l[k] ?? 0
  }
  return t
}

export default boxscores
