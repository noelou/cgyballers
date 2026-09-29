<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
// undefined when adding a new team. Set after the first save, so a retry
// (e.g. the photo upload failed) edits that team instead of adding a duplicate.
const teamId = ref(route.params.teamId)
const isEdit = computed(() => !!teamId.value)

const name = ref('')
const color = ref('#3dff9e')
const logo = ref('')
const venue = ref('I.S. Covered Court')
const featuredPhoto = ref('')
const photoFile = ref(null) // new photo chosen, uploaded on Save
const photoPreview = ref('')
const removePhoto = ref(false)
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const saving = ref(false)
const error = ref('')

onMounted(async () => {
  if (!isEdit.value) return
  const res = await fetch('/api/teams')
  const teams = await res.json()
  const t = teams.find((team) => team.id === teamId.value)
  if (!t) {
    error.value = 'Team not found'
    return
  }
  name.value = t.name
  color.value = t.color ?? '#3dff9e'
  logo.value = t.logo ?? ''
  venue.value = t.venue ?? ''
  featuredPhoto.value = t.featuredPhoto ?? ''
})

// What the preview shows: the newly chosen file, else the saved photo.
const shownPhoto = computed(() => photoPreview.value || (removePhoto.value ? '' : featuredPhoto.value))

function choosePhoto(e) {
  const file = e.target.files[0]
  e.target.value = '' // allow re-choosing the same file
  if (!file) return
  if (!PHOTO_TYPES.includes(file.type)) {
    error.value = 'Photo must be a JPG, PNG or WebP image'
    return
  }
  if (file.size > MAX_PHOTO_BYTES) {
    error.value = 'Photo must be 5 MB or smaller'
    return
  }
  error.value = ''
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
  removePhoto.value = false
}

function clearPhoto() {
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoFile.value = null
  photoPreview.value = ''
  removePhoto.value = !!featuredPhoto.value
}

// Runs after the team itself is saved, so new teams already have an id.
async function savePhoto(id) {
  if (photoFile.value) {
    const body = new FormData()
    body.append('photo', photoFile.value)
    return fetch(`/api/teams/${id}/featured-photo`, { method: 'POST', credentials: 'include', body })
  }
  if (removePhoto.value) {
    return fetch(`/api/teams/${id}/featured-photo`, { method: 'DELETE', credentials: 'include' })
  }
  return null
}

async function submit() {
  saving.value = true
  error.value = ''
  const payload = { name: name.value, color: color.value, logo: logo.value, venue: venue.value }
  try {
    const res = await fetch(isEdit.value ? `/api/teams/${teamId.value}` : '/api/teams', {
      method: isEdit.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      error.value = (await res.json()).error ?? 'Failed to save'
      return
    }
    teamId.value = (await res.json()).id

    const photoRes = await savePhoto(teamId.value)
    if (photoRes && !photoRes.ok) {
      const msg = (await photoRes.json().catch(() => ({}))).error ?? 'upload failed'
      error.value = `Team saved, but the featured photo wasn't: ${msg}`
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
      <div>
        Featured player photo (optional)
        <div style="display: flex; align-items: center; gap: 12px; margin-top: 6px">
          <div
            :style="{
              width: '72px',
              height: '72px',
              borderRadius: '8px',
              overflow: 'hidden',
              flexShrink: 0,
              background: color,
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontSize: '11px',
            }"
          >
            <img v-if="shownPhoto" :src="shownPhoto" alt="" style="width: 100%; height: 100%; object-fit: cover" />
            <span v-else>Logo</span>
          </div>
          <label class="btn" style="cursor: pointer">
            {{ shownPhoto ? 'Change photo' : 'Choose photo' }}
            <input type="file" accept="image/jpeg,image/png,image/webp" @change="choosePhoto" hidden />
          </label>
          <button v-if="shownPhoto" type="button" class="btn" @click="clearPhoto">Remove</button>
        </div>
        <small style="color: var(--text-muted)">
          Shown on the home page matchup cards. JPG, PNG or WebP, up to 5 MB, cropped to a square
          automatically. Without one, the card shows the team logo.
          {{ photoFile ? 'Click Save to upload.' : removePhoto ? 'Click Save to remove.' : '' }}
        </small>
      </div>

      <p v-if="error" style="color: var(--loss, red)">{{ error }}</p>
      <button type="submit" class="btn btn-primary" :disabled="saving">
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </form>
  </div>
</template>
