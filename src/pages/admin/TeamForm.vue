<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const teamId = route.params.teamId // undefined when adding a new team
const isEdit = computed(() => !!teamId)

const name = ref('')
const color = ref('#3dff9e')
const logo = ref('')
const venue = ref('I.S. Covered Court')
const saving = ref(false)
const error = ref('')

onMounted(async () => {
  if (!isEdit.value) return
  const res = await fetch('/api/teams')
  const teams = await res.json()
  const t = teams.find((team) => team.id === teamId)
  if (!t) {
    error.value = 'Team not found'
    return
  }
  name.value = t.name
  color.value = t.color ?? '#3dff9e'
  logo.value = t.logo ?? ''
  venue.value = t.venue ?? ''
})

async function submit() {
  saving.value = true
  error.value = ''
  const payload = { name: name.value, color: color.value, logo: logo.value, venue: venue.value }
  try {
    const res = await fetch(isEdit.value ? `/api/teams/${teamId}` : '/api/teams', {
      method: isEdit.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      error.value = (await res.json()).error ?? 'Failed to save'
      return
    }
    router.push('/admin/teams')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="container" style="max-width: 420px">
    <router-link to="/admin/teams">&larr; Back to Teams</router-link>
    <h1 class="section-title" style="font-size: 24px; margin-top: 12px">
      {{ isEdit ? 'Edit Team' : 'Add Team' }}
    </h1>

    <form @submit.prevent="submit" class="card" style="padding: 24px; display: grid; gap: 12px; margin-top: 16px">
      <label>
        Name
        <input type="text" v-model="name" required />
      </label>
      <label>
        Color
        <input type="color" v-model="color" style="height: 36px; padding: 2px" />
      </label>
      <label>
        Logo path
        <input type="text" v-model="logo" placeholder="/logos/team-name.png" />
      </label>
      <label>
        Venue
        <input type="text" v-model="venue" />
      </label>

      <p v-if="error" style="color: var(--loss, red)">{{ error }}</p>
      <button type="submit" class="btn btn-primary" :disabled="saving">
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </form>
  </div>
</template>
