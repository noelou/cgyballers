<script setup>
import { computed } from 'vue'
import PlayoffBracket from '../components/PlayoffBracket.vue'
import { cachedJson } from '../data/apiCache'

const bracketEntry = cachedJson('/api/playoffs', { projected: true, ready: false, series: [] })
const bracket = bracketEntry.data
const loading = computed(() => !bracketEntry.loaded.value)
</script>

<template>
  <div class="container">
    <h1 class="section-title" style="font-size: 34px">Playoffs</h1>

    <div v-if="loading" class="empty-state card">Loading&hellip;</div>
    <div v-else-if="!bracket.ready" class="empty-state card">The bracket needs all 12 teams in the standings.</div>

    <template v-else>
      <p v-if="bracket.projected" class="badge" style="margin-bottom: 20px">
        Projected — seeds follow the current standings until the elimination round ends
      </p>
      <PlayoffBracket :series="bracket.series" />
    </template>

    <div class="card" style="padding: 20px; margin-top: 24px; max-width: 720px">
      <h2 style="font-size: 16px; font-weight: 800; margin: 0 0 12px">Playoff Rules</h2>
      <ul style="margin: 0; padding-left: 20px; color: var(--text-muted); font-size: 15px; line-height: 1.8">
        <li><b>Seeding</b>: the top 4 go straight to the Quarterfinals. Seeds 5–8 face seeds 9–12 in the Play-In.</li>
        <li><b>Twice-to-beat</b> (<b>2×</b>, Play-In and Quarterfinals): the higher seed advances with one win. The lower seed has to win twice, so a series is never more than 2 games.</li>
        <li><b>Best of 3</b> (Semifinals and Finals): the first team to 2 wins advances.</li>
        <li><b>Playoff stat leaders</b>: per-game averages count once a player has played at least half as many playoff games as the team that has played the most, rounded up. Totals like 3-pointers made only need one game. Everyone's playoff stats are still shown on the Players page.</li>
      </ul>
    </div>
  </div>
</template>
