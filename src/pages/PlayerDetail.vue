<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import players from '../data/players.json'
import teams from '../data/teams.json'
import Avatar from '../components/Avatar.vue'
import { cachedJson } from '../data/apiCache'
import { getStats } from '../utils/playerStats'
import './PlayerDetail.css'

const teamById = Object.fromEntries(teams.map((t) => [t.id, t]))

const route = useRoute()
const player = computed(() => players.find((p) => p.id === route.params.playerId))
const team = computed(() => (player.value ? teamById[player.value.team] : null))

const statsEntry = cachedJson('/api/player-stats', {})
const playerStats = statsEntry.data
const loading = computed(() => !statsEntry.loaded.value)
const stats = computed(() => (player.value ? getStats(playerStats.value, player.value.id) : null))

const dash = (v) => (stats.value.gp ? v : '—')
const pctText = (v) => (v == null ? '—' : `${v}%`)

const statBlocks = computed(() => {
  if (!stats.value) return []
  const s = stats.value
  return [
    { label: 'GP', value: s.gp },
    { label: 'PPG', value: dash(s.ppg) },
    { label: 'RPG', value: dash(s.rpg) },
    { label: 'APG', value: dash(s.apg) },
    { label: 'BPG', value: dash(s.bpg) },
    { label: 'SPG', value: dash(s.spg) },
    { label: '3P%', value: pctText(s.tpPct) },
    { label: 'FT%', value: pctText(s.ftPct) },
  ]
})
</script>

<template>
  <div v-if="!player" class="container">
    <div class="empty-state card">
      <p>Player not found.</p>
      <router-link to="/players" class="btn">Back to Players</router-link>
    </div>
  </div>

  <div v-else class="container">
    <router-link to="/players" style="color: var(--accent-strong); font-weight: 700; font-size: 13px">
      &larr; Back to Players
    </router-link>

    <div class="card player-detail-header">
      <Avatar :name="player.name" :pic="player.pic" :size="88" />
      <div>
        <div class="player-detail-team">
          <span :style="{ background: team?.color }" class="team-dot" />
          <router-link :to="`/teams/${player.team}`">{{ player.teamName }}</router-link>
        </div>
        <h1 class="player-detail-name">{{ player.name }}</h1>
      </div>
    </div>

    <div v-if="loading" class="empty-state card">Loading&hellip;</div>
    <template v-else>
      <div class="player-stat-strip">
        <div v-for="block in statBlocks" :key="block.label" class="card player-stat-block">
          <span class="player-stat-value">{{ block.value }}</span>
          <span class="player-stat-label">{{ block.label }}</span>
        </div>
      </div>
      <p class="player-stat-note">
        {{
          stats.gp
            ? `Season averages from ${stats.gp} game${stats.gp > 1 ? 's' : ''}.`
            : 'No games recorded yet this season.'
        }}
      </p>
    </template>
  </div>
</template>
