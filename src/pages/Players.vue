<script setup>
import { computed, ref } from 'vue'
import teams from '../data/teams.json'
import PlayerCard from '../components/PlayerCard.vue'
import { cachedJson } from '../data/apiCache'
import { getStats, ZERO_STATS } from '../utils/playerStats'
import { MIN_GP, REBOUND_MIN_GP } from '../utils/leaders'
import './Players.css'

const SORTS = {
  ppg: { label: 'Points', short: 'PPG', desc: 'points per game' },
  rpg: { label: 'Rebounds', short: 'RPG', desc: 'rebounds per game', minGp: REBOUND_MIN_GP },
  apg: { label: 'Assists', short: 'APG', desc: 'assists per game' },
  spg: { label: 'Steals', short: 'SPG', desc: 'steals per game' },
  bpg: { label: 'Blocks', short: 'BPG', desc: 'blocks per game' },
  tpm: { label: '3-Pointers Made', short: '3PM', desc: 'three-pointers made (season total)' },
}

const playersEntry = cachedJson('/api/players', [])
const statsEntry = cachedJson('/api/player-stats', {})
const players = playersEntry.data
const playerStats = statsEntry.data
const loading = computed(() => !playersEntry.loaded.value || !statsEntry.loaded.value)

const query = ref('')
const teamFilter = ref('all')
const sortKey = ref('ppg')

const sort = computed(() => SORTS[sortKey.value])
const minGp = computed(() => sort.value.minGp ?? MIN_GP)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const bySort = (a, b) => {
    const sa = getStats(playerStats.value, a.id)
    const sb = getStats(playerStats.value, b.id)
    return sb[sortKey.value] - sa[sortKey.value] || sb.ppg - sa.ppg
  }
  const matches = players.value
    .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
    .filter((p) => (teamFilter.value === 'all' ? true : p.team === teamFilter.value))

  return {
    qualified: matches.filter((p) => getStats(playerStats.value, p.id).gp >= minGp.value).sort(bySort),
    unqualified: matches.filter((p) => getStats(playerStats.value, p.id).gp < minGp.value).sort(bySort),
  }
})

const total = computed(() => filtered.value.qualified.length + filtered.value.unqualified.length)
</script>

<template>
  <div class="container">
    <span class="eyebrow">Rosters</span>
    <h1 class="section-title" style="font-size: 28px; margin-top: 8px">Players</h1>
    <p class="section-sub">
      {{ players.length }} players across 12 teams. Leaders ranked by {{ sort.desc }} &middot; min. {{ minGp }} games played.
    </p>

    <div class="players-filters">
      <input type="text" placeholder="Search player name..." v-model="query" />
      <select v-model="teamFilter">
        <option value="all">All Teams</option>
        <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
      <select v-model="sortKey">
        <option v-for="(s, key) in SORTS" :key="key" :value="key">Sort: {{ s.label }}</option>
      </select>
    </div>

    <div v-if="loading" class="empty-state card">Loading&hellip;</div>
    <div v-else-if="total === 0" class="empty-state card">No players match your filters.</div>
    <template v-else>
      <div v-if="filtered.qualified.length > 0" class="grid players-grid">
        <PlayerCard
          v-for="p in filtered.qualified"
          :key="p.id"
          :player="p"
          :stats="getStats(playerStats, p.id)"
          :statKey="sortKey"
          :statLabel="sort.short"
        />
      </div>

      <template v-if="filtered.unqualified.length > 0">
        <div class="players-section-label">Not yet qualified &middot; under {{ minGp }} games</div>
        <div class="grid players-grid players-grid-dim">
          <PlayerCard
            v-for="p in filtered.unqualified"
            :key="p.id"
            :player="p"
            :stats="getStats(playerStats, p.id)"
            :statKey="sortKey"
            :statLabel="sort.short"
          />
        </div>
      </template>
    </template>
  </div>
</template>
