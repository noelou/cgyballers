<script setup>
import { ref, onMounted } from 'vue'
import TeamBadge from '../../components/TeamBadge.vue'
import './admin.css'

const teams = ref([])

onMounted(async () => {
  const res = await fetch('/api/teams')
  teams.value = await res.json()
})
</script>

<template>
  <div class="container">
    <router-link to="/admin" class="admin-back">&larr; Back to Dashboard</router-link>
    <div class="admin-list-head">
      <h1 class="admin-title">Teams</h1>
      <router-link to="/admin/teams/new" class="btn btn-primary">+ Add Team</router-link>
    </div>

    <div class="card table-scroll" style="margin-top: 24px">
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
            <td>
              <div style="display: flex; align-items: center; gap: 10px; font-weight: 700">
                <TeamBadge :team="t" :size="28" />
                {{ t.name }}
                <span :style="{ background: t.color, width: '10px', height: '10px', borderRadius: '50%' }" :title="t.color" />
              </div>
            </td>
            <td>{{ t.venue }}</td>
            <td>{{ t.playerIds.length }}</td>
            <td style="text-align: right">
              <router-link :to="`/admin/teams/${t.id}/edit`" class="btn" style="padding: 6px 12px; font-size: 13px">Edit</router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
