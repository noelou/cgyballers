<script setup>
import { ref, onMounted } from 'vue'
import teams from '../data/teams.json'
import TeamBadge from '../components/TeamBadge.vue'

const standings = ref([])

onMounted(async () => {
  const res = await fetch('/api/standings')
  standings.value = await res.json()
})
</script>

<template>
  <div class="container">
    <span class="eyebrow">Season 4 Amlans Cup</span>
    <h1 class="section-title" style="font-size: 28px; margin-top: 8px">Standings</h1>
    <p class="section-sub">League table.</p>

    <div class="card table-scroll">
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
                {{ row.name }}
              </router-link>
            </td>
            <td>{{ row.gp }}</td>
            <td>{{ row.wins }}</td>
            <td>{{ row.losses }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
