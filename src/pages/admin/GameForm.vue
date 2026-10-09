<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { STAGE_LABELS } from '../../utils/playoffs'
import './admin.css'

const route = useRoute()
const router = useRouter()
// undefined when adding a new game.
const gameId = route.params.gameId
const isEdit = !!gameId
const teams = ref([])
// Teams can't change once a box score exists (the server rejects it too).
const hasBoxscore = ref(false)

const date = ref('')
const time = ref('')
const venue = ref('I.S. Covered Court')
const home = ref('')
const away = ref('')
const stage = ref('elimination')
const saving = ref(false)
const error = ref('')

onMounted(async () => {
  const [teamsRes, gamesRes] = await Promise.all([fetch('/api/teams'), isEdit ? fetch('/api/games') : null])
  teams.value = await teamsRes.json()
  if (!isEdit) return

  const g = (await gamesRes.json()).find((game) => game.id === gameId)
  if (!g) {
    error.value = 'Game not found'
    return
  }
  date.value = g.date
  time.value = g.time?.slice(0, 5) ?? ''
  venue.value = g.venue ?? ''
  home.value = g.home
  away.value = g.away
  stage.value = g.stage ?? 'elimination'
  hasBoxscore.value = g.hasBoxscore
})

async function submit() {
  saving.value = true
  error.value = ''
  try {
    const res = await fetch(isEdit ? `/api/games/${gameId}` : '/api/games', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        date: date.value,
        time: time.value,
        venue: venue.value,
        home: home.value,
        away: away.value,
        stage: stage.value,
      }),
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
  <div class="container" style="max-width: 420px">
    <router-link to="/admin" class="admin-back">&larr; Back to Dashboard</router-link>
    <h1 class="admin-title">{{ isEdit ? 'Edit Game' : 'Add Game' }}</h1>

    <form @submit.prevent="submit" class="card admin-form">
      <label>
        Stage
        <select v-model="stage">
          <option v-for="(label, key) in STAGE_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
      </label>
      <label>
        Date
        <input type="date" v-model="date" required />
      </label>
      <label>
        Time
        <input type="time" v-model="time" required />
      </label>
      <label>
        Venue
        <input type="text" v-model="venue" />
      </label>
      <label>
        Home team
        <select v-model="home" required :disabled="hasBoxscore">
          <option value="" disabled>Select team...</option>
          <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </label>
      <label>
        Away team
        <select v-model="away" required :disabled="hasBoxscore">
          <option value="" disabled>Select team...</option>
          <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </label>
      <p v-if="hasBoxscore" class="admin-hint">Teams are locked because this game already has a box score.</p>

      <p v-if="error" class="admin-error">{{ error }}</p>
      <button type="submit" class="btn btn-primary" :disabled="saving">
        {{ saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Game' }}
      </button>
    </form>
  </div>
</template>
