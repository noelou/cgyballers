<script setup>
import { ref, computed, onMounted } from 'vue'
import TeamBadge from '../components/TeamBadge.vue'
import './Teams.css'

const teams = ref([])
const standings = ref([])
const standingsByTeam = computed(() => Object.fromEntries(standings.value.map((s) => [s.team, s])))

onMounted(async () => {
  const [teamsRes, standingsRes] = await Promise.all([fetch('/api/teams'), fetch('/api/standings')])
  teams.value = await teamsRes.json()
  standings.value = await standingsRes.json()
})
</script>

<template>
  <div class="container">
    <span class="eyebrow">League</span>
    <h1 class="section-title" style="font-size: 28px; margin-top: 8px">Teams</h1>
    <p class="section-sub">All 12 teams competing this season.</p>

    <div class="grid teams-grid">
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
