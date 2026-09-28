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
    <span class="eyebrow">Season 4 Amlans Cup</span>
    <h1 class="section-title" style="font-size: 28px; margin-top: 8px">Playoffs</h1>
    <p class="section-sub">
      Top 4 go straight to the Quarterfinals. Seeds 5–8 face seeds 9–12 in the Play-In. The higher seed is
      twice-to-beat (<b>2×</b>) in both rounds. Semifinals and Finals are best of 3.
    </p>

    <div v-if="loading" class="empty-state card">Loading&hellip;</div>
    <div v-else-if="!bracket.ready" class="empty-state card">The bracket needs all 12 teams in the standings.</div>

    <template v-else>
      <p v-if="bracket.projected" class="badge" style="margin-bottom: 20px">
        Projected — seeds follow the current standings until the elimination round ends
      </p>
      <PlayoffBracket :series="bracket.series" />
    </template>
  </div>
</template>
