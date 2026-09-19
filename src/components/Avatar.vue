<script setup>
import { computed } from 'vue'
import { colorFromString, initials } from '../utils/avatarColor'

const props = defineProps({
  name: { type: String, required: true },
  pic: { type: String, default: null },
  size: { type: Number, default: 48 },
  square: { type: Boolean, default: false },
})

const borderRadius = computed(() => (props.square ? 'var(--radius-md)' : '50%'))

const imgStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderRadius: borderRadius.value,
  objectFit: 'cover',
  flexShrink: 0,
  display: 'block',
}))

const fallbackStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderRadius: borderRadius.value,
  background: `linear-gradient(155deg, ${bg.value}, ${bg.value}99)`,
  color: '#0b0d10',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: `${props.size * 0.38}px`,
  flexShrink: 0,
  userSelect: 'none',
}))

const bg = computed(() => colorFromString(props.name))
const initialsText = computed(() => initials(props.name))
</script>

<template>
  <img
    v-if="pic"
    class="avatar"
    :src="pic"
    :alt="name"
    :width="size"
    :height="size"
    loading="lazy"
    :style="imgStyle"
  />
  <div v-else class="avatar" :style="fallbackStyle" aria-hidden="true">
    {{ initialsText }}
  </div>
</template>
