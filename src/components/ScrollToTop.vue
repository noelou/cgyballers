<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'

// Reset scroll position to the top whenever the route changes.
const route = useRoute()

watch(
  () => route.path,
  () => window.scrollTo(0, 0)
)
</script>

<template></template>
