<script setup>
import { computed } from 'vue'
import teams from '../data/teams.json'
import TeamBadge from '../components/TeamBadge.vue'
import { cachedJson } from '../data/apiCache'

const standingsEntry = cachedJson('/api/standings', [])
const standings = standingsEntry.data
const loading = computed(() => !standingsEntry.loaded.value)
// Teams the league ruled to the bottom (admin: Edit Team > Rank last).
const rankedLast = computed(() => standings.value.filter((r) => r.rankedLast))
</script>

<template>
  <div class="container">
    <span class="eyebrow">Season 4 Amlans Cup</span>
    <h1 class="section-title" style="font-size: 28px; margin-top: 8px">Standings</h1>
    <p class="section-sub">League table.</p>

    <div v-if="loading" class="empty-state card">Loading&hellip;</div>

    <div v-else class="card table-scroll">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>GP</th>
            <th>W</th>
            <th>L</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in standings" :key="row.team">
            <td>{{ row.rank }}</td>
            <td>
              <router-link
                :to="`/teams/${row.team}`"
                style="display: flex; align-items: center; gap: 8px; font-weight: 700"
              >
                <TeamBadge :team="teams.find((t) => t.id === row.team)" :size="24" />
                {{ row.name }}<span v-if="row.rankedLast" style="color: var(--text-muted)">*</span>
              </router-link>
            </td>
            <td>{{ row.gp }}</td>
            <td>{{ row.wins }}</td>
            <td>{{ row.losses }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="!loading && rankedLast.length" class="section-sub" style="margin-top: 12px">
      * {{ rankedLast.map((r) => r.name).join(', ') }}
      {{ rankedLast.length === 1 ? 'is' : 'are' }} ranked last by league ruling for backing out,
      regardless of win&ndash;loss record.
    </p>
  </div>
</template>
