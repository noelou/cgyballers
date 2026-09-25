<script setup>
import { computed, ref } from 'vue'
import teams from '../data/teams.json'
import TeamBadge from '../components/TeamBadge.vue'
import { cachedJson } from '../data/apiCache'
import { formatDate, formatTime } from '../utils/date'
import './Schedule.css'

const teamById = Object.fromEntries(teams.map((t) => [t.id, t]))

const gamesEntry = cachedJson('/api/games', [])
const schedule = gamesEntry.data
const loading = computed(() => !gamesEntry.loaded.value)
const teamFilter = ref('all')
const statusFilter = ref('all')

const filtered = computed(() => {
  return schedule.value
    .filter((g) => teamFilter.value === 'all' || g.home === teamFilter.value || g.away === teamFilter.value)
    .filter((g) => statusFilter.value === 'all' || g.status === statusFilter.value)
    .sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time))
})

const grouped = computed(() => {
  const map = new Map()
  filtered.value.forEach((g) => {
    if (!map.has(g.date)) map.set(g.date, [])
    map.get(g.date).push(g)
  })
  return [...map.entries()]
})
</script>

<template>
  <div class="container">
    <span class="eyebrow">Season 4 Amlans Cup</span>
    <h1 class="section-title" style="font-size: 28px; margin-top: 8px">Schedule</h1>
    <p class="section-sub">Every matchup on the CGYBallers calendar.</p>

    <div class="schedule-filters">
      <select v-model="teamFilter">
        <option value="all">All Teams</option>
        <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
      <select v-model="statusFilter">
        <option value="all">All Games</option>
        <option value="scheduled">Upcoming</option>
        <option value="final">Final</option>
        <option value="forfeit">Forfeit</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    <div v-if="loading" class="empty-state card">Loading&hellip;</div>
    <div v-else-if="grouped.length === 0" class="empty-state card">No games match these filters.</div>

    <div v-else class="schedule-list">
      <div v-for="[date, games] in grouped" :key="date" class="schedule-day">
        <div class="schedule-date">{{ formatDate(date, { weekday: 'long', month: 'short', day: 'numeric' }) }}</div>
        <div
          v-for="g in games"
          :key="g.id"
          :data-status="g.status"
          :class="['card schedule-row', g.status === 'cancelled' ? 'schedule-row-cancelled' : '']"
        >
          <div class="schedule-time">{{ formatTime(g.time) }}</div>
          <div class="schedule-team">
            <TeamBadge :team="teamById[g.home]" :size="32" />
            <router-link :to="`/teams/${g.home}`">{{ g.homeName }}</router-link>
            <span
              :class="[
                'schedule-team-score',
                (g.status === 'final' && g.homeScore > g.awayScore) || (g.status === 'forfeit' && g.winner === g.home) ? 'win' : '',
              ]"
            >
              {{
                g.status === 'final'
                  ? g.homeScore
                  : g.status === 'forfeit' && g.winner === g.home
                  ? 'FF'
                  : g.status === 'scheduled'
                  ? formatTime(g.time)
                  : ''
              }}
            </span>
          </div>
          <div class="schedule-result">
            <router-link
              v-if="g.status === 'final' && g.hasBoxscore"
              :to="`/games/${g.id}`"
              class="schedule-score schedule-score-link"
              title="View box score"
            >
              <b :class="g.homeScore > g.awayScore ? 'win' : ''">{{ g.homeScore }}</b>
              {{ ' – ' }}
              <b :class="g.awayScore > g.homeScore ? 'win' : ''">{{ g.awayScore }}</b>
            </router-link>
            <span v-else-if="g.status === 'final'" class="schedule-score">
              <b :class="g.homeScore > g.awayScore ? 'win' : ''">{{ g.homeScore }}</b>
              {{ ' – ' }}
              <b :class="g.awayScore > g.homeScore ? 'win' : ''">{{ g.awayScore }}</b>
            </span>
            <span v-else-if="g.status === 'forfeit'" class="schedule-vs">FF</span>
            <span v-else-if="g.status === 'cancelled'" class="schedule-vs">–</span>
            <span v-else class="schedule-vs">@</span>
          </div>
          <div class="schedule-team schedule-team-right">
            <TeamBadge :team="teamById[g.away]" :size="32" />
            <router-link :to="`/teams/${g.away}`">{{ g.awayName }}</router-link>
            <span
              :class="[
                'schedule-team-score',
                (g.status === 'final' && g.awayScore > g.homeScore) || (g.status === 'forfeit' && g.winner === g.away) ? 'win' : '',
              ]"
            >
              {{ g.status === 'final' ? g.awayScore : g.status === 'forfeit' && g.winner === g.away ? 'FF' : '' }}
            </span>
          </div>
          <div class="schedule-footer">
            <div class="schedule-venue">{{ g.venue }}</div>
            <span
              :class="[
                'badge schedule-status',
                g.status === 'final' ? 'status-final' : '',
                g.status === 'forfeit' ? 'status-forfeit' : '',
                g.status === 'cancelled' ? 'status-cancelled' : '',
              ]"
            >
              {{ g.status === 'final' ? 'Final' : g.status === 'forfeit' ? 'Forfeit' : g.status === 'cancelled' ? 'Cancelled' : 'Upcoming' }}
            </span>
          </div>
          <router-link
            v-if="g.status === 'final' && g.hasBoxscore"
            :to="`/games/${g.id}`"
            class="schedule-boxscore-btn"
          >
            View Box Score
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
