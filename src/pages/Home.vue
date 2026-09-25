<script setup>
import { computed } from 'vue'
import teams from '../data/teams.json'
import TeamBadge from '../components/TeamBadge.vue'
import Avatar from '../components/Avatar.vue'
import MatchupCard from '../components/MatchupCard.vue'
import { cachedJson } from '../data/apiCache'
import { buildLeaders, MIN_GP, REBOUND_MIN_GP } from '../utils/leaders'
import { formatDate as formatDateLong, formatDateShort as formatDate } from '../utils/date'
import './Home.css'

const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61562394387119'
const FACEBOOK_ICON =
  'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'

const teamById = Object.fromEntries(teams.map((t) => [t.id, t]))

const LEADER_CATS = [
  { key: 'ppg', label: 'Points', fmt: (p) => p.value.toFixed(1) },
  { key: 'rpg', label: 'Rebounds', fmt: (p) => p.value.toFixed(1), minGp: REBOUND_MIN_GP },
  { key: 'apg', label: 'Assists', fmt: (p) => p.value.toFixed(1) },
  { key: 'tpm', label: 'Threes', fmt: (p) => String(p.value) },
]

// Local date (not UTC), so games don't roll over at 8am Philippine time.
const now = new Date()
const todayStr = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
  .map((n) => String(n).padStart(2, '0'))
  .join('-')

const gamesEntry = cachedJson('/api/games', [])
const standingsEntry = cachedJson('/api/standings', [])
const playersEntry = cachedJson('/api/players', [])
const statsEntry = cachedJson('/api/player-stats', {})

const schedule = gamesEntry.data
const standings = standingsEntry.data
const players = playersEntry.data
const playerStats = statsEntry.data

const loading = computed(
  () => !gamesEntry.loaded.value || !standingsEntry.loaded.value || !playersEntry.loaded.value || !statsEntry.loaded.value
)

// The next date that still has an unplayed game. All of that day's games
// are shown, so finished ones flip to their score while the day is ongoing.
const gameDay = computed(() => {
  const next = schedule.value.find((g) => g.status === 'scheduled' && g.date >= todayStr)
  if (!next) return null
  const games = schedule.value.filter((g) => g.date === next.date && g.status !== 'cancelled')
  return {
    date: next.date,
    isToday: next.date === todayStr,
    venue: next.venue,
    games,
  }
})

const gameDayLabel = computed(() => {
  const d = gameDay.value
  if (!d) return ''
  const date = formatDateLong(d.date, { weekday: 'short', month: 'short', day: 'numeric' })
  const count = `${d.games.length} ${d.games.length === 1 ? 'game' : 'games'}`
  return [date, count, d.venue].filter(Boolean).join(' · ')
})

// Latest finals, each as two lines with the winner on top.
const recent = computed(() =>
  schedule.value
    .filter((g) => g.status === 'final')
    .slice(-3)
    .reverse()
    .map((g) => {
      const home = { id: g.home, name: g.homeName, score: g.homeScore }
      const away = { id: g.away, name: g.awayName, score: g.awayScore }
      const homeWon = g.homeScore >= g.awayScore
      return {
        id: g.id,
        date: g.date,
        winner: homeWon ? home : away,
        loser: homeWon ? away : home,
      }
    })
)

const topStandings = computed(() => standings.value.slice(0, 5))

const leaderRows = computed(() =>
  LEADER_CATS
    .map((c) => ({ ...c, top: buildLeaders(players.value, playerStats.value, c.key, 3, c.minGp ?? MIN_GP) }))
    .filter((c) => c.top.length > 0)
)
</script>

<template>
  <div class="home-banner">
    <img src="/banner/banner-1.jpg" alt="CGYBallers" />
  </div>

  <div class="container">
    <section class="hero">
      <span class="eyebrow">Season 4 Amlans Cup</span>
      <h1 class="sr-only">CGYBallers</h1>
      <p class="hero-sub">
        Twelve teams. One league. Follow every score, stat line, and standings shift from the
        CGYBallers season.
      </p>
      <div class="hero-actions">
        <router-link to="/standings" class="btn btn-primary">View Standings</router-link>
        <router-link to="/schedule" class="btn">See Schedule</router-link>
        <a class="btn btn-fb" :href="FACEBOOK_URL" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path :d="FACEBOOK_ICON" />
          </svg>
          Follow on Facebook
        </a>
      </div>
    </section>

    <div v-if="loading" class="empty-state card">Loading&hellip;</div>

    <template v-else>
    <section class="gameday">
      <div class="gameday-header">
        <div>
          <div class="section-title">{{ gameDay?.isToday ? 'Game Day' : 'Next Game Day' }}</div>
          <div v-if="gameDay" class="section-sub">{{ gameDayLabel }}</div>
        </div>
        <router-link to="/schedule" class="see-all">Full schedule &rarr;</router-link>
      </div>
      <div
        v-if="gameDay"
        class="matchup-grid"
        :class="{ 'matchup-grid-4': gameDay.games.length >= 4 }"
        :style="{ '--count': Math.min(gameDay.games.length, 4) }"
      >
        <MatchupCard
          v-for="g in gameDay.games"
          :key="g.id"
          :game="g"
          :home="teamById[g.home]"
          :away="teamById[g.away]"
        />
      </div>
      <div v-else class="card gameday-soon">
        <div class="gameday-soon-title">Next schedule coming soon</div>
        <p class="gameday-soon-sub">Follow us on Facebook for updates on the next games.</p>
        <a class="btn btn-fb" :href="FACEBOOK_URL" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path :d="FACEBOOK_ICON" />
          </svg>
          Follow on Facebook
        </a>
      </div>
    </section>

    <section class="home-grid">
      <div class="card home-block">
        <div class="section-title">Recent Results</div>
        <div class="section-sub">Latest final scores</div>
        <p v-if="recent.length === 0" style="color: var(--text-muted)">No final scores yet.</p>
        <ul class="result-list">
          <li v-for="g in recent" :key="g.id">
            <router-link :to="`/games/${g.id}`" class="result-row">
              <span class="result-date">{{ formatDate(g.date) }}</span>
              <span class="result-teams">
                <span
                  v-for="(t, i) in [g.winner, g.loser]"
                  :key="t.id"
                  class="result-team"
                  :class="{ won: i === 0 }"
                >
                  <TeamBadge :team="teamById[t.id]" :size="24" />
                  <span class="result-name">{{ t.name }}</span>
                  <span class="result-score">{{ t.score }}</span>
                </span>
              </span>
              <span class="result-arrow" aria-hidden="true">&rsaquo;</span>
            </router-link>
          </li>
        </ul>
        <router-link to="/schedule" class="see-all">See full schedule &rarr;</router-link>
      </div>

      <div class="card home-block">
        <div class="section-title">Standings</div>
        <div class="section-sub">Top of the table</div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Team</th>
                <th>W</th>
                <th>L</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in topStandings" :key="row.team">
                <td>{{ row.rank }}</td>
                <td>
                  <router-link
                    :to="`/teams/${row.team}`"
                    style="display: flex; align-items: center; gap: 8px; font-weight: 700"
                  >
                    <TeamBadge :team="teamById[row.team]" :size="22" />
                    {{ row.name }}
                  </router-link>
                </td>
                <td>{{ row.wins }}</td>
                <td>{{ row.losses }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <router-link to="/standings" class="see-all">Full standings &rarr;</router-link>
      </div>
    </section>

    <section v-if="leaderRows.length > 0" style="margin-bottom: 20px">
      <div class="card home-block">
        <div class="section-title">League Leaders</div>
        <div class="section-sub">Season leaders &middot; qualified players only</div>
        <div class="leader-list">
          <div v-for="c in leaderRows" :key="c.key" class="leader-group">
            <div class="leader-cat">{{ c.label }}</div>
            <ol class="leader-ranks">
              <li v-for="(p, i) in c.top" :key="p.id" class="leader-rank-row">
                <span class="leader-rank">{{ i + 1 }}</span>
                <router-link :to="`/players/${p.id}`" class="leader-player">
                  <Avatar :name="p.name" :pic="p.pic" :size="28" />
                  <span class="leader-name">{{ p.name }}</span>
                  <span class="leader-team">{{ p.teamName }}</span>
                </router-link>
                <span class="leader-value">{{ c.fmt(p) }}</span>
              </li>
            </ol>
          </div>
        </div>
        <router-link to="/players" class="see-all">See all players &rarr;</router-link>
      </div>
    </section>
    </template>
  </div>
</template>
