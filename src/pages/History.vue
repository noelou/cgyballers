<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { CHAMPIONS } from '../data/champions'
import './History.css'

const seasons = [...CHAMPIONS].reverse()

// The season whose photo is open in the viewer, or null. Tapping the open
// photo toggles between "fit the screen" and zoomed in (scroll to pan).
const viewing = ref(null)
const zoomed = ref(false)
const viewer = ref(null)

function open(c) {
  viewing.value = c
  zoomed.value = false
}

function close() {
  viewing.value = null
}

// Zoom in on the spot that was tapped: remember where it sits in the photo
// (as a fraction), then scroll the enlarged photo so that spot is centred.
async function toggleZoom(e) {
  if (zoomed.value) {
    zoomed.value = false
    return
  }
  const rect = e.target.getBoundingClientRect()
  const fx = (e.clientX - rect.left) / rect.width
  const fy = (e.clientY - rect.top) / rect.height
  zoomed.value = true
  await nextTick()
  const box = viewer.value
  const img = box.querySelector('img')
  box.scrollLeft = img.offsetLeft + fx * img.offsetWidth - box.clientWidth / 2
  box.scrollTop = img.offsetTop + fy * img.offsetHeight - box.clientHeight / 2
}

function onKey(e) {
  if (e.key === 'Escape') close()
}

watch(viewing, (c) => {
  document.body.style.overflow = c ? 'hidden' : ''
  if (c) window.addEventListener('keydown', onKey)
  else window.removeEventListener('keydown', onKey)
})

// Leaving the page with the viewer open: undo the scroll lock directly,
// since the watcher above no longer runs once the page is gone.
onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="container">
    <h1 class="section-title" style="font-size: 34px">History</h1>
    <p class="section-sub">Champions from every season. Tap a photo to see it up close.</p>

    <div class="grid history-grid">
      <div v-for="c in seasons" :key="c.season" class="card history-card">
        <button
          v-if="c.photo"
          type="button"
          class="history-photo-btn"
          :aria-label="`View the Season ${c.season} champions photo`"
          @click="open(c)"
        >
          <img
            :src="c.photo"
            :alt="`${c.team}, Season ${c.season} champions`"
            class="history-photo"
            :style="c.focus && { objectPosition: c.focus }"
            loading="lazy"
          />
        </button>
        <div class="history-body">
          <div class="history-season">Season {{ c.season }}</div>
          <div class="history-label">
            <svg class="history-trophy" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M7 3h10v2h3a1 1 0 0 1 1 1v2a5 5 0 0 1-4.6 5A5 5 0 0 1 13 15.9V18h3a1 1 0 0 1 1 1v2H7v-2a1 1 0 0 1 1-1h3v-2.1A5 5 0 0 1 7.6 13 5 5 0 0 1 3 8V6a1 1 0 0 1 1-1h3V3Zm0 4H5v1a3 3 0 0 0 2 2.8V7Zm10 0v3.8A3 3 0 0 0 19 8V7h-2Z"
              />
            </svg>
            Champion
          </div>
          <div class="history-team">{{ c.team }}</div>
        </div>
      </div>
    </div>

    <div
      v-if="viewing"
      ref="viewer"
      :class="['history-viewer', { 'is-zoomed': zoomed }]"
      role="dialog"
      aria-modal="true"
      :aria-label="`${viewing.team}, Season ${viewing.season} champions`"
      @click.self="close"
    >
      <button type="button" class="history-viewer-close" aria-label="Close" @click="close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
        </svg>
      </button>
      <img
        :src="viewing.fullPhoto || viewing.photo"
        :alt="`${viewing.team}, Season ${viewing.season} champions`"
        class="history-viewer-img"
        @click="toggleZoom"
      />
      <p class="history-viewer-hint">
        {{ zoomed ? 'Drag or scroll to look around. Tap to zoom out.' : 'Tap the photo to zoom in.' }}
      </p>
    </div>
  </div>
</template>
