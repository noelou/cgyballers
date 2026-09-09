// Season stat leaders, computed from the box-score-derived player stats.
// A player must have played at least MIN_GP games to be ranked.

import players from '../data/players.json'
import { getPlayerStats } from './playerStats'

export const MIN_GP = 5

// Rebounds averages need a bit more sample before the ranking is meaningful.
export const REBOUND_MIN_GP = 6

// Returns the top `count` qualified players for a stat key (e.g. 'ppg', 'tpm'),
// each as { id, name, teamName, pic, value, gp }, sorted highest first.
export function leaders(statKey, count = 1, minGp = MIN_GP) {
  return players
    .map((p) => ({ p, s: getPlayerStats(p.id) }))
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
