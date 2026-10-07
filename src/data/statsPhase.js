// Player stats for the Elimination Round and the Playoffs (play-in included),
// plus which of the two is being shown. The choice is shared by every page
// for the rest of the visit; until someone picks, it follows the season:
// Playoffs once any playoff box score exists, otherwise Elimination Round.
import { computed, ref } from 'vue'
import { cachedJson } from './apiCache'

const chosen = ref(null)

export function useStatsPhase() {
  const elimination = cachedJson('/api/player-stats?phase=elimination', {})
  const playoffs = cachedJson('/api/player-stats?phase=playoffs', {})

  const hasPlayoffs = computed(() => Object.keys(playoffs.data.value).length > 0)
  const phase = computed({
    get: () => chosen.value ?? (hasPlayoffs.value ? 'playoffs' : 'elimination'),
    set: (value) => (chosen.value = value),
  })

  return {
    phase,
    hasPlayoffs,
    stats: computed(() => (phase.value === 'playoffs' ? playoffs : elimination).data.value),
    eliminationStats: elimination.data,
    loaded: computed(() => elimination.loaded.value && playoffs.loaded.value),
  }
}
