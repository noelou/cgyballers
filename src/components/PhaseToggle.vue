<script setup>
// Switches player stats between the Elimination Round and the Playoffs.
import './PhaseToggle.css'

const phase = defineModel({ type: String, required: true })

const OPTIONS = [
  { key: 'elimination', label: 'Elimination Round' },
  { key: 'playoffs', label: 'Playoffs' },
]
</script>

<template>
  <div class="phase-toggle" role="tablist" aria-label="Stats for">
    <button
      v-for="o in OPTIONS"
      :key="o.key"
      type="button"
      role="tab"
      :aria-selected="phase === o.key"
      :class="['phase-tab', { active: phase === o.key }]"
      @click="phase = o.key"
    >
      {{ o.label }}
    </button>
  </div>
</template>
