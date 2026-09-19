<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // let the browser store the login cookie
      body: JSON.stringify({ username: username.value, password: password.value }),
    })
    if (!res.ok) {
      const data = await res.json()
      error.value = data.error ?? 'Login failed'
      return
    }
    router.push('/admin')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container" style="max-width: 360px; margin-top: 64px">
    <h1 class="section-title" style="font-size: 24px">Admin Login</h1>
    <form @submit.prevent="submit" class="card" style="padding: 24px; display: grid; gap: 12px; margin-top: 16px">
      <input type="text" placeholder="Username" v-model="username" autocomplete="username" />
      <input type="password" placeholder="Password" v-model="password" autocomplete="current-password" />
      <p v-if="error" style="color: var(--loss, red); font-size: 13px">{{ error }}</p>
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Logging in...' : 'Log in' }}
      </button>
    </form>
  </div>
</template>
