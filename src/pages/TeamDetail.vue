<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import teams from '../data/teams.json'
import Avatar from '../components/Avatar.vue'
import TeamBadge from '../components/TeamBadge.vue'
import { cachedJson } from '../data/apiCache'
import { getStats } from '../utils/playerStats'
import { formatDateShort, formatTime } from '../utils/date'
import './TeamDetail.css'

const route = useRoute()
const team = computed(() => teams.find((t) => t.id === route.params.teamId))

const standingsEntry = cachedJson('/api/standings', [])
const gamesEntry = cachedJson('/api/games', [])
const playersEntry = cachedJson('/api/players', [])
const statsEntry = cachedJson('/api/player-stats', {})
const standings = standingsEntry.data
const schedule = gamesEntry.data
const players = playersEntry.data
const playerStats = statsEntry.data
const loading = computed(
  () => !standingsEntry.loaded.value || !gamesEntry.loaded.value || !playersEntry.loaded.value || !statsEntry.loaded.value
)

const roster = computed(() => {
  if (!team.value) return []
  return players.value
    .filter((p) => p.team === team.value.id)
    .sort((a, b) => (a.number ?? 999) - (b.number ?? 999))
})

const record = computed(() => (team.value ? standings.value.find((s) => s.team === team.value.id) : null))

const games = computed(() => {
  if (!team.value) return []
  return schedule.value
    .filter((g) => g.home === team.value.id || g.away === team.value.id)
    .sort((a, b) => a.date.localeCompare(b.date))
})

function rosterStats(playerId) {
  return getStats(playerStats.value, playerId)
}

function gameRow(g) {
  const isHome = g.home === team.value.id
  const opponent = isHome ? g.awayName : g.homeName
  const teamScore = isHome ? g.homeScore : g.awayScore
  const oppScore = isHome ? g.awayScore : g.homeScore
  const won = (g.status === 'final' && teamScore > oppScore) || (g.status === 'forfeit' && g.winner === team.value.id)
  return { isHome, opponent, teamScore, oppScore, won }
}
</script>

<template>
  <div v-if="!team" class="container">
    <div class="empty-state card">
      <p>Team not found.</p>
      <router-link to="/teams" class="btn">Back to Teams</router-link>
    </div>
  </div>

  <div v-else class="container">
    <router-link to="/teams" style="color: var(--accent-strong); font-weight: 700; font-size: 13px">
      &larr; Back to Teams
    </router-link>

    <div class="card team-detail-header">
      <TeamBadge :team="team" :size="64" />
      <div>
        <h1 class="team-detail-name">{{ team.name }}</h1>
        <p v-if="record" class="team-detail-sub">
          {{ record.wins }}-{{ record.losses }} &middot; Rank #{{ record.rank }} &middot; {{ record.pf }} PF / {{ record.pa }} PA
        </p>
        <p class="team-detail-sub">Home court: {{ team.venue }}</p>
      </div>
    </div>

    <div class="section-title" style="font-size: 18px; margin-top: 32px">Games</div>
    <div v-if="loading" class="empty-state card">Loading&hellip;</div>
    <div v-else class="card table-scroll">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Matchup</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in games" :key="g.id">
            <td>{{ formatDateShort(g.date) }}</td>
            <td>{{ formatTime(g.time) }}</td>
            <td>{{ gameRow(g).isHome ? 'vs' : '@' }} {{ gameRow(g).opponent }}</td>
            <td>
              <router-link
                v-if="g.status === 'final' && g.hasBoxscore"
                :to="`/games/${g.id}`"
                :style="{ color: gameRow(g).won ? 'var(--win)' : 'var(--loss)', fontWeight: 700 }"
                title="View box score"
              >
                {{ gameRow(g).won ? 'W' : 'L' }} {{ gameRow(g).teamScore }}-{{ gameRow(g).oppScore }}
              </router-link>
              <span
                v-else-if="g.status === 'final'"
                :style="{ color: gameRow(g).won ? 'var(--win)' : 'var(--loss)', fontWeight: 700 }"
              >
                {{ gameRow(g).won ? 'W' : 'L' }} {{ gameRow(g).teamScore }}-{{ gameRow(g).oppScore }}
              </span>
              <span
                v-else-if="g.status === 'forfeit'"
                :style="{ color: gameRow(g).won ? 'var(--win)' : 'var(--loss)', fontWeight: 700 }"
              >
                {{ gameRow(g).won ? 'W' : 'L' }} (Forfeit)
              </span>
              <span v-else-if="g.status === 'cancelled'" style="color: var(--text-dim)">Cancelled</span>
              <span v-else style="color: var(--text-dim)">Upcoming</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section-title" style="font-size: 18px; margin-top: 32px">Roster</div>
    <div v-if="loading" class="empty-state card">Loading&hellip;</div>
    <div v-else class="grid team-roster-grid">
      <router-link v-for="p in roster" :key="p.id" :to="`/players/${p.id}`" class="card roster-row">
        <Avatar :name="p.name" :pic="p.pic" :size="44" />
        <div>
          <div class="roster-name">{{ p.name }}</div>
          <div class="roster-meta">
            {{ rosterStats(p.id).gp ? `${rosterStats(p.id).ppg} PPG` : 'No games' }}
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>
