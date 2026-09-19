<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const teams = ref([])

const date = ref('')
const time = ref('')
const venue = ref('I.S. Covered Court')
const home = ref('')
const away = ref('')
const saving = ref(false)
const error = ref('')

onMounted(async () => {
  const res = await fetch('/api/teams')
  teams.value = await res.json()
})

async function submit() {
  saving.value = true
  error.value = ''
  try {
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        date: date.value,
        time: time.value,
        venue: venue.value,
        home: home.value,
        away: away.value,
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
    <router-link to="/admin">&larr; Back to Dashboard</router-link>
    <h1 class="section-title" style="font-size: 24px; margin-top: 12px">Add Game</h1>

    <form @submit.prevent="submit" class="card" style="padding: 24px; display: grid; gap: 12px; margin-top: 16px">
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
        <select v-model="home" required>
          <option value="" disabled>Select team...</option>
          <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </label>
      <label>
        Away team
        <select v-model="away" required>
          <option value="" disabled>Select team...</option>
          <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </label>

      <p v-if="error" style="color: var(--loss, red)">{{ error }}</p>
      <button type="submit" class="btn btn-primary" :disabled="saving">
        {{ saving ? 'Saving...' : 'Add Game' }}
      </button>
    </form>
  </div>
</template>
