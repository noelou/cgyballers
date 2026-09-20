<script setup>
import { computed } from 'vue'
import TeamBadge from '../components/TeamBadge.vue'
import { cachedJson } from '../data/apiCache'
import './Teams.css'

const teamsEntry = cachedJson('/api/teams', [])
const standingsEntry = cachedJson('/api/standings', [])
const teams = teamsEntry.data
const standings = standingsEntry.data
const standingsByTeam = computed(() => Object.fromEntries(standings.value.map((s) => [s.team, s])))
const loading = computed(() => !teamsEntry.loaded.value || !standingsEntry.loaded.value)
</script>

<template>
  <div class="container">
    <span class="eyebrow">League</span>
    <h1 class="section-title" style="font-size: 28px; margin-top: 8px">Teams</h1>
    <p class="section-sub">All 12 teams competing this season.</p>

    <div v-if="loading" class="empty-state card">Loading&hellip;</div>

    <div v-else class="grid teams-grid">
      <router-link
        v-for="t in teams"
        :key="t.id"
        :to="`/teams/${t.id}`"
        class="card team-card"
      >
        <TeamBadge :team="t" :size="48" />
        <div>
          <div class="team-card-name">{{ t.name }}</div>
          <div class="team-card-meta">
            {{ standingsByTeam[t.id] ? `${standingsByTeam[t.id].wins}-${standingsByTeam[t.id].losses}` : '0-0' }}
            &middot; {{ t.playerIds.length }} players
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>
