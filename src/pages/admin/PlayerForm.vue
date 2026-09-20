<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const playerId = route.params.playerId // undefined when adding a new player
const isEdit = computed(() => !!playerId)

const POSITIONS = [
  { key: 'PG', label: 'Point Guard' },
  { key: 'SG', label: 'Shooting Guard' },
  { key: 'SF', label: 'Small Forward' },
  { key: 'PF', label: 'Power Forward' },
  { key: 'C', label: 'Center' },
]

const teams = ref([])
const team = ref(route.query.team ?? '')
const name = ref('')
const number = ref(null)
const position = ref('')
const positionLabel = ref('')
const heightCm = ref(null)
const heightDisplay = ref('')
const weightKg = ref(null)
const age = ref(null)
const experience = ref('')
const pic = ref('')
const saving = ref(false)
const error = ref('')

// Picking a position also fills in its full label automatically.
watch(position, (key) => {
  positionLabel.value = POSITIONS.find((p) => p.key === key)?.label ?? ''
})

onMounted(async () => {
  const teamsRes = await fetch('/api/teams')
  teams.value = await teamsRes.json()

  if (isEdit.value) {
    const res = await fetch('/api/players')
    const players = await res.json()
    const p = players.find((pl) => pl.id === playerId)
    if (!p) {
      error.value = 'Player not found'
      return
    }
    team.value = p.team
    name.value = p.name
    number.value = p.number
    position.value = p.position ?? ''
    positionLabel.value = p.positionLabel ?? ''
    heightCm.value = p.heightCm
    heightDisplay.value = p.heightDisplay ?? ''
    weightKg.value = p.weightKg
    age.value = p.age
    experience.value = p.experience ?? ''
    pic.value = p.pic ?? ''
  }
})

async function submit() {
  saving.value = true
  error.value = ''
  const payload = {
    team: team.value,
    name: name.value,
    number: number.value,
    position: position.value,
    positionLabel: positionLabel.value,
    heightCm: heightCm.value,
    heightDisplay: heightDisplay.value,
    weightKg: weightKg.value,
    age: age.value,
    experience: experience.value,
    pic: pic.value,
  }
  try {
    const res = await fetch(isEdit.value ? `/api/players/${playerId}` : '/api/players', {
      method: isEdit.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      error.value = (await res.json()).error ?? 'Failed to save'
      return
    }
    router.push('/admin/players')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="container" style="max-width: 420px">
    <router-link to="/admin/players">&larr; Back to Players</router-link>
    <h1 class="section-title" style="font-size: 24px; margin-top: 12px">
      {{ isEdit ? 'Edit Player' : 'Add Player' }}
    </h1>

    <form @submit.prevent="submit" class="card" style="padding: 24px; display: grid; gap: 12px; margin-top: 16px">
      <label>
        Team
        <select v-model="team" required>
          <option value="" disabled>Select team...</option>
          <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </label>
      <label>
        Name
        <input type="text" v-model="name" required />
      </label>
      <label>
        Number
        <input type="number" min="0" v-model.number="number" />
      </label>
      <label>
        Position
        <select v-model="position">
          <option value="" disabled>Select position...</option>
          <option v-for="p in POSITIONS" :key="p.key" :value="p.key">{{ p.label }}</option>
        </select>
      </label>
      <label>
        Height (cm)
        <input type="number" min="0" v-model.number="heightCm" />
      </label>
      <label>
        Height (display, e.g. 5'7")
        <input type="text" v-model="heightDisplay" />
      </label>
      <label>
        Weight (kg)
        <input type="number" min="0" v-model.number="weightKg" />
      </label>
      <label>
        Age
        <input type="number" min="0" v-model.number="age" />
      </label>
      <label>
        Experience (e.g. "4 yrs" or "Rookie")
        <input type="text" v-model="experience" />
      </label>
      <label>
        Photo path (optional)
        <input type="text" v-model="pic" placeholder="/player-photos/team-name.png" />
      </label>

      <p v-if="error" style="color: var(--loss, red)">{{ error }}</p>
      <button type="submit" class="btn btn-primary" :disabled="saving">
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </form>
  </div>
</template>
