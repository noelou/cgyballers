<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const gameId = route.params.gameId

const STAT_FIELDS = ['pts', 'reb', 'ast', 'blk', 'stl', 'tpa', 'tpm', 'fta', 'ftm']
const emptyLine = () => Object.fromEntries(STAT_FIELDS.map((f) => [f, 0]))

const game = ref(null)
const homeRoster = ref([])
const awayRoster = ref([])
const lines = ref({})
const saving = ref(false)
const error = ref('')

onMounted(async () => {
  const res = await fetch(`/api/games/${gameId}/boxscore`)
  if (!res.ok) {
    error.value = 'Game not found'
    return
  }
  const data = await res.json()
  game.value = data.game
  homeRoster.value = data.homeRoster
  awayRoster.value = data.awayRoster

  const allPlayers = [...data.homeRoster, ...data.awayRoster]
  lines.value = Object.fromEntries(allPlayers.map((p) => [p.id, { ...emptyLine(), ...data.lines[p.id] }]))
})

async function submit() {
  saving.value = true
  error.value = ''
  try {
    const res = await fetch(`/api/games/${gameId}/boxscore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ lines: lines.value }),
    })
    if (!res.ok) {
      error.value = (await res.json()).error ?? 'Failed to save'
      return
    }
    router.push('/admin')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="container">
    <router-link to="/admin">&larr; Back to Dashboard</router-link>

    <div v-if="error" class="empty-state card">{{ error }}</div>

    <template v-if="game">
      <h1 class="section-title" style="font-size: 24px">{{ game.homeName }} vs {{ game.awayName }}</h1>
      <p class="section-sub">{{ game.date }}</p>

      <form @submit.prevent="submit">
        <h2 class="section-title" style="font-size: 16px; margin-top: 24px">{{ game.homeName }}</h2>
        <div class="card table-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th v-for="f in STAT_FIELDS" :key="f">{{ f.toUpperCase() }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in homeRoster" :key="p.id">
                <td>{{ p.number }}</td>
                <td>{{ p.name }}</td>
                <td v-for="f in STAT_FIELDS" :key="f">
                  <input type="number" min="0" v-model.number="lines[p.id][f]" style="width: 48px" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 class="section-title" style="font-size: 16px; margin-top: 24px">{{ game.awayName }}</h2>
        <div class="card table-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th v-for="f in STAT_FIELDS" :key="f">{{ f.toUpperCase() }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in awayRoster" :key="p.id">
                <td>{{ p.number }}</td>
                <td>{{ p.name }}</td>
                <td v-for="f in STAT_FIELDS" :key="f">
                  <input type="number" min="0" v-model.number="lines[p.id][f]" style="width: 48px" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="error" style="color: var(--loss, red)">{{ error }}</p>
        <button type="submit" class="btn btn-primary" style="margin-top: 16px" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Box Score' }}
        </button>
      </form>
    </template>
  </div>
</template>
