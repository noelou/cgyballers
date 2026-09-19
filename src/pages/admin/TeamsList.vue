<script setup>
import { ref, onMounted } from 'vue'

const teams = ref([])

onMounted(async () => {
  const res = await fetch('/api/teams')
  teams.value = await res.json()
})
</script>

<template>
  <div class="container">
    <router-link to="/admin">&larr; Back to Dashboard</router-link>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px">
      <h1 class="section-title" style="font-size: 24px">Teams</h1>
      <router-link to="/admin/teams/new" class="btn btn-primary">Add Team</router-link>
    </div>

    <div class="card table-scroll">
      <table>
        <thead>
          <tr>
            <th>Team</th>
            <th>Venue</th>
            <th>Players</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in teams" :key="t.id">
            <td style="display: flex; align-items: center; gap: 8px">
              <span :style="{ background: t.color, width: '14px', height: '14px', borderRadius: '50%', display: 'inline-block' }" />
              {{ t.name }}
            </td>
            <td>{{ t.venue }}</td>
            <td>{{ t.playerIds.length }}</td>
            <td>
              <router-link :to="`/admin/teams/${t.id}/edit`" class="btn">Edit</router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
