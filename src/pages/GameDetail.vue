<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import teams from '../data/teams.json'
import TeamBadge from '../components/TeamBadge.vue'
import { sumLines } from '../utils/boxscores'
import { formatDate, formatTime } from '../utils/date'
import './GameDetail.css'

const teamById = Object.fromEntries(teams.map((t) => [t.id, t]))

const STAT_COLS = [
  ['pts', 'PTS'],
  ['reb', 'REB'],
  ['ast', 'AST'],
  ['blk', 'BLK'],
  ['stl', 'STL'],
]

const route = useRoute()
const game = ref(null)
const homeRoster = ref([])
const awayRoster = ref([])
const lines = ref({})
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await fetch(`/api/games/${route.params.gameId}/boxscore`)
    if (!res.ok) return
    const data = await res.json()
    if (Object.keys(data.lines).length === 0) return // game exists but no box score entered yet
    game.value = data.game
    homeRoster.value = data.homeRoster
    awayRoster.value = data.awayRoster
    lines.value = data.lines
  } finally {
    loading.value = false
  }
})

const homeWon = computed(() => game.value && game.value.homeScore > game.value.awayScore)

function buildBoxTable(teamName, roster, lines) {
  const rows = roster
    .filter((p) => p.id in lines)
    .map((p) => ({ player: p, line: lines[p.id] }))
    .sort((a, b) => b.line.pts - a.line.pts || a.player.name.localeCompare(b.player.name))

  const totals = sumLines(rows.map((r) => r.line))
  const dnp = roster.filter((p) => !(p.id in lines)).map((p) => p.name)

  return { teamName, rows, totals, dnp }
}

const boxTables = computed(() => {
  if (!game.value) return []
  return [
    buildBoxTable(game.value.homeName, homeRoster.value, lines.value),
    buildBoxTable(game.value.awayName, awayRoster.value, lines.value),
  ]
})
</script>

<template>
  <div v-if="loading" class="container">
    <div class="empty-state card">Loading&hellip;</div>
  </div>

  <div v-else-if="!game" class="container">
    <div class="empty-state card">
      <p>No box score is available for this game.</p>
      <router-link to="/schedule" class="btn">Back to Schedule</router-link>
    </div>
  </div>

  <div v-else class="container">
    <router-link to="/schedule" style="color: var(--accent-strong); font-weight: 700; font-size: 13px">
      &larr; Back to Schedule
    </router-link>

    <div class="card game-detail-header">
      <div class="game-detail-date">
        {{ formatDate(game.date, { weekday: 'long', month: 'long', day: 'numeric' }) }} &middot; {{ formatTime(game.time) }} &middot; {{ game.venue }}
      </div>
      <div class="game-detail-score">
        <div :class="['game-detail-team', homeWon ? 'won' : '']">
          <TeamBadge :team="teamById[game.home]" :size="36" />
          <router-link :to="`/teams/${game.home}`">{{ game.homeName }}</router-link>
          <span class="game-detail-team-score">{{ game.homeScore }}</span>
        </div>
        <div :class="['game-detail-team', !homeWon ? 'won' : '']">
          <TeamBadge :team="teamById[game.away]" :size="36" />
          <router-link :to="`/teams/${game.away}`">{{ game.awayName }}</router-link>
          <span class="game-detail-team-score">{{ game.awayScore }}</span>
        </div>
      </div>
    </div>

    <template v-for="table in boxTables" :key="table.teamName">
      <div class="section-title game-detail-box-title">{{ table.teamName }}</div>
      <div class="card table-scroll">
        <table class="game-detail-box">
          <thead>
            <tr>
              <th>Player</th>
              <th v-for="[key, label] in STAT_COLS" :key="key">{{ label }}</th>
              <th>3PT</th>
              <th>FT</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="{ player, line } in table.rows" :key="player.id">
              <td class="game-detail-name">
                <router-link :to="`/players/${player.id}`">{{ player.name }}</router-link>
                <span class="game-detail-num">#{{ player.number }}</span>
              </td>
              <td v-for="[key] in STAT_COLS" :key="key">{{ line[key] || 0 }}</td>
              <td>{{ line.tpm || 0 }}-{{ line.tpa || 0 }}</td>
              <td>{{ line.ftm || 0 }}-{{ line.fta || 0 }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td v-for="[key] in STAT_COLS" :key="key">{{ table.totals[key] }}</td>
              <td>{{ table.totals.tpm }}-{{ table.totals.tpa }}</td>
              <td>{{ table.totals.ftm }}-{{ table.totals.fta }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p v-if="table.dnp.length > 0" class="game-detail-dnp">
        <span>Did not play</span> {{ table.dnp.join(', ') }}
      </p>
    </template>
  </div>
</template>
