<script setup>
import { computed } from 'vue'
import Avatar from './Avatar.vue'
import { ZERO_STATS } from '../utils/playerStats'
import './PlayerCard.css'

// Stats already shown on every card — no need to repeat them as the active sort.
const BASE_STATS = new Set(['ppg', 'rpg', 'apg'])

const props = defineProps({
  player: { type: Object, required: true },
  stats: { type: Object, default: () => ZERO_STATS },
  statKey: { type: String, default: null },
  statLabel: { type: String, default: null },
})

const showActive = computed(() => props.statKey && !BASE_STATS.has(props.statKey))
</script>

<template>
  <router-link :to="`/players/${player.id}`" class="card player-card">
    <div class="player-card-top">
      <Avatar :name="player.name" :pic="player.pic" :size="52" />
      <div>
        <div class="player-card-name">{{ player.name }}</div>
        <div class="player-card-meta">
          {{ player.teamName }}
          <span v-if="stats.gp > 0" class="player-card-gp"> &middot; {{ stats.gp }} GP</span>
        </div>
      </div>
    </div>
    <div class="player-card-stats">
      <div>
        <span class="stat-value">{{ stats.gp ? stats.ppg : '—' }}</span>
        <span class="stat-label">PPG</span>
      </div>
      <div>
        <span class="stat-value">{{ stats.gp ? stats.rpg : '—' }}</span>
        <span class="stat-label">RPG</span>
      </div>
      <div>
        <span class="stat-value">{{ stats.gp ? stats.apg : '—' }}</span>
        <span class="stat-label">APG</span>
      </div>
      <div v-if="showActive" class="stat-active">
        <span class="stat-value">{{ stats.gp ? stats[statKey] : '—' }}</span>
        <span class="stat-label">{{ statLabel }}</span>
      </div>
    </div>
  </router-link>
</template>
