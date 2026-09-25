<script setup>
import { computed } from 'vue'
import TeamBadge from './TeamBadge.vue'
import { featuredPhotos } from '../data/featuredPlayers'
import { formatTime } from '../utils/date'

const props = defineProps({
  game: { type: Object, required: true },
  home: { type: Object, default: null },
  away: { type: Object, default: null },
})

const isFinal = computed(() => props.game.status === 'final' || props.game.status === 'forfeit')

// `winner` is only stored for forfeits; regular finals are decided by score.
const winnerId = computed(() => {
  const g = props.game
  if (g.winner) return g.winner
  if (g.status !== 'final' || g.homeScore == null || g.awayScore == null) return null
  return g.homeScore > g.awayScore ? g.home : g.away
})

const sides = computed(() => [
  { key: 'home', team: props.home, name: props.game.homeName, score: props.game.homeScore },
  { key: 'away', team: props.away, name: props.game.awayName, score: props.game.awayScore },
].map((s) => ({
  ...s,
  photo: s.team ? featuredPhotos[s.team.id] : null,
  won: isFinal.value && winnerId.value === props.game[s.key],
})))
</script>

<template>
  <router-link :to="`/games/${game.id}`" class="matchup-card card">
    <div class="matchup-head">
      <span v-if="isFinal" class="matchup-final">{{ game.status === 'forfeit' ? 'Forfeit' : 'Final' }}</span>
      <span v-else>{{ formatTime(game.time) }}</span>
    </div>

    <div class="matchup-photos">
      <div
        v-for="s in sides"
        :key="s.key"
        class="matchup-photo"
        :style="{ '--team-color': s.team?.color || 'var(--accent)' }"
      >
        <img v-if="s.photo" :src="s.photo" :alt="`${s.name} featured player`" loading="lazy" />
        <div v-else class="matchup-photo-fallback">
          <TeamBadge :team="s.team" :size="64" />
        </div>
      </div>
      <span class="matchup-vs">VS</span>
    </div>

    <div class="matchup-teams">
      <div v-for="s in sides" :key="s.key" class="matchup-team" :class="{ lost: isFinal && !s.won }">
        <TeamBadge :team="s.team" :size="28" />
        <span class="matchup-name">{{ s.name }}</span>
        <span v-if="isFinal && game.status === 'final'" class="matchup-score">{{ s.score }}</span>
      </div>
    </div>
  </router-link>
</template>
