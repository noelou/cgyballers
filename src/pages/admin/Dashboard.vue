<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const games = ref([])

onMounted(async () => {
  const meRes = await fetch('/api/me', { credentials: 'include' })
  if (!meRes.ok) {
    router.push('/admin/login')
    return
  }
  username.value = (await meRes.json()).username

  const gamesRes = await fetch('/api/games')
  games.value = await gamesRes.json()
})

// Most recently played/scheduled first, so today's game is easy to find.
const sortedGames = computed(() =>
  [...games.value].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
)

async function logout() {
  await fetch('/api/logout', { method: 'POST', credentials: 'include' })
  router.push('/admin/login')
}
</script>

<template>
  <div class="container">
    <div style="display: flex; justify-content: space-between; align-items: center">
      <h1 class="section-title" style="font-size: 24px">Dashboard</h1>
      <button class="btn" @click="logout">Log out</button>
    </div>
    <p v-if="username">Logged in as <b>{{ username }}</b>.</p>

    <div style="display: flex; gap: 8px">
      <router-link to="/admin/players" class="btn btn-primary">Manage Players</router-link>
      <router-link to="/admin/teams" class="btn btn-primary">Manage Teams</router-link>
      <router-link to="/admin/games/new" class="btn btn-primary">Add Game</router-link>
    </div>

    <h2 class="section-title" style="font-size: 18px; margin-top: 24px">Enter / Edit Box Score</h2>
    <div class="card table-scroll">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Matchup</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in sortedGames" :key="g.id">
            <td>{{ g.date }}</td>
            <td>{{ g.homeName }} vs {{ g.awayName }}</td>
            <td>{{ g.status }}</td>
            <td style="display: flex; gap: 8px">
              <router-link :to="`/admin/games/${g.id}/boxscore`" class="btn">
                {{ g.status === 'final' ? 'Edit' : 'Enter' }} Box Score
              </router-link>
              <router-link :to="`/admin/games/${g.id}/status`" class="btn">Edit Score/Status</router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
