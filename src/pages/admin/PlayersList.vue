<script setup>
import { ref, computed, onMounted } from 'vue'

const teams = ref([])
const players = ref([])

onMounted(async () => {
  const [teamsRes, playersRes] = await Promise.all([fetch('/api/teams'), fetch('/api/players')])
  teams.value = await teamsRes.json()
  players.value = await playersRes.json()
})

const playersByTeam = computed(() => {
  const map = {}
  for (const t of teams.value) map[t.id] = []
  for (const p of players.value) (map[p.team] ??= []).push(p)
  return map
})
</script>

<template>
  <div class="container">
    <router-link to="/admin">&larr; Back to Dashboard</router-link>
    <h1 class="section-title" style="font-size: 24px; margin-top: 12px">Players</h1>

    <div v-for="t in teams" :key="t.id" style="margin-top: 24px">
      <div style="display: flex; justify-content: space-between; align-items: center">
        <h2 class="section-title" style="font-size: 16px">{{ t.name }}</h2>
        <router-link :to="`/admin/players/new?team=${t.id}`" class="btn">Add Player</router-link>
      </div>
      <div class="card table-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Position</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in playersByTeam[t.id]" :key="p.id">
              <td>{{ p.number }}</td>
              <td>{{ p.name }}</td>
              <td>{{ p.position }}</td>
              <td>
                <router-link :to="`/admin/players/${p.id}/edit`" class="btn">Edit</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
