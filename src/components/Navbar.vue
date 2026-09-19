<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from '../utils/useTheme'
import './Navbar.css'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  // { to: '/news', label: 'News' }, // hidden for now — pending league sign-off
  { to: '/schedule', label: 'Schedule' },
  { to: '/standings', label: 'Standings' },
  { to: '/players', label: 'Players' },
  { to: '/teams', label: 'Teams' },
]

const open = ref(false)
const { theme, toggleTheme } = useTheme()
const route = useRoute()

function isActive(link) {
  return link.end ? route.path === link.to : route.path.startsWith(link.to)
}

function closeMenu() {
  open.value = false
}

function toggleMenu() {
  open.value = !open.value
}
</script>

<template>
  <header class="navbar">
    <div class="container navbar-inner">
      <router-link to="/" class="brand" @click="closeMenu">
        <img
          src="/logos/cgyballers_transparent.png"
          alt="CGY Ballers"
          class="brand-logo"
        />
      </router-link>

      <div class="navbar-right">
        <nav :class="['nav-links', { 'is-open': open }]">
          <router-link
            v-for="link in LINKS"
            :key="link.to"
            :to="link.to"
            :class="['nav-link', { 'is-active': isActive(link) }]"
            @click="closeMenu"
          >
            {{ link.label }}
          </router-link>
        </nav>

        <button
          class="theme-toggle"
          :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleTheme"
        >
          <svg
            v-if="theme === 'dark'"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>

        <button
          class="nav-toggle"
          aria-label="Toggle navigation"
          :aria-expanded="open"
          @click="toggleMenu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </div>
  </header>
</template>
