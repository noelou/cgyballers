<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const gameId = route.params.gameId

const game = ref(null)
const status = ref('scheduled')
const homeScore = ref(0)
const awayScore = ref(0)
const winner = ref('')
const saving = ref(false)
const error = ref('')

onMounted(async () => {
  const res = await fetch('/api/games')
  const games = await res.json()
  game.value = games.find((g) => g.id === gameId)
  if (!game.value) {
    error.value = 'Game not found'
    return
  }
  status.value = game.value.status
  homeScore.value = game.value.homeScore ?? 0
  awayScore.value = game.value.awayScore ?? 0
  winner.value = game.value.winner ?? ''
})

const showScores = computed(() => status.value === 'final')
const showWinner = computed(() => status.value === 'forfeit')

async function submit() {
  saving.value = true
  error.value = ''
  try {
    const res = await fetch(`/api/games/${gameId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        status: status.value,
        homeScore: Number(homeScore.value),
        awayScore: Number(awayScore.value),
        winner: winner.value || null,
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

    <div v-if="error" class="empty-state card">{{ error }}</div>

    <template v-if="game">
      <h1 class="section-title" style="font-size: 24px; margin-top: 12px">
        {{ game.homeName }} vs {{ game.awayName }}
      </h1>
      <p class="section-sub">{{ game.date }}</p>

      <form @submit.prevent="submit" class="card" style="padding: 24px; display: grid; gap: 12px; margin-top: 16px">
        <label>
          Status
          <select v-model="status">
            <option value="scheduled">Upcoming</option>
            <option value="final">Final</option>
            <option value="forfeit">Forfeit</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>

        <template v-if="showScores">
          <label>
            {{ game.homeName }} score
            <input type="number" min="0" v-model.number="homeScore" />
          </label>
          <label>
            {{ game.awayName }} score
            <input type="number" min="0" v-model.number="awayScore" />
          </label>
        </template>

        <label v-if="showWinner">
          Winner (by forfeit)
          <select v-model="winner">
            <option value="">Select winner...</option>
            <option :value="game.home">{{ game.homeName }}</option>
            <option :value="game.away">{{ game.awayName }}</option>
          </select>
        </label>

        <p v-if="error" style="color: var(--loss, red)">{{ error }}</p>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </form>
    </template>
  </div>
</template>
