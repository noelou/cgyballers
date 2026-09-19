<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  team: { type: Object, default: null },
  size: { type: Number, default: 40 },
})

const imgFailed = ref(false)

// Reset the failed-image fallback if a different team is passed in.
watch(() => props.team, () => {
  imgFailed.value = false
})

const teamInitials = computed(() => {
  if (!props.team) return ''
  return props.team.name
    .split(/\s+/)
    .filter((w) => !['x', 'the'].includes(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
})

const imgStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderRadius: 'var(--radius-md)',
  objectFit: 'contain',
  flexShrink: 0,
}))

const fallbackStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: `${props.size * 0.36}px`,
  flexShrink: 0,
  color: 'var(--text-muted)',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-strong)',
}))
</script>

<template>
  <img
    v-if="team && team.logo && !imgFailed"
    :src="team.logo"
    :alt="`${team.name} logo`"
    :width="size"
    :height="size"
    :style="imgStyle"
    @error="imgFailed = true"
  />
  <div v-else-if="team" :style="fallbackStyle" aria-hidden="true">
    {{ teamInitials }}
  </div>
</template>
