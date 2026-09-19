<script setup>
import { computed, ref, onMounted } from 'vue'
import teams from '../data/teams.json'
import TeamBadge from '../components/TeamBadge.vue'
import Avatar from '../components/Avatar.vue'
import { buildLeaders, MIN_GP, REBOUND_MIN_GP } from '../utils/leaders'
import { formatDateShort as formatDate, formatTime } from '../utils/date'
import './Home.css'

const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61562394387119'

const teamById = Object.fromEntries(teams.map((t) => [t.id, t]))

// Points is ranked on each player's 5 best games (see playerStats.best5pts) so
// extra games don't inflate the total, but the number shown is plain PPG.
const LEADER_CATS = [
  { key: 'best5pts', label: 'Points', fmt: (p) => p.ppg.toFixed(1) },
  { key: 'rpg', label: 'Rebounds', fmt: (p) => p.value.toFixed(1), minGp: REBOUND_MIN_GP },
  { key: 'apg', label: 'Assists', fmt: (p) => p.value.toFixed(1) },
  { key: 'tpm', label: 'Threes', fmt: (p) => String(p.value) },
]

const todayStr = new Date().toISOString().slice(0, 10)

const schedule = ref([])
const standings = ref([])
const players = ref([])
const playerStats = ref({})

onMounted(async () => {
  const [gamesRes, standingsRes, playersRes, statsRes] = await Promise.all([
    fetch('/api/games'),
    fetch('/api/standings'),
    fetch('/api/players'),
    fetch('/api/player-stats'),
  ])
  schedule.value = await gamesRes.json()
  standings.value = await standingsRes.json()
  players.value = await playersRes.json()
  playerStats.value = await statsRes.json()
})

const upcoming = computed(() =>
  schedule.value.filter((g) => g.status === 'scheduled' && g.date >= todayStr).slice(0, 3)
)

const recent = computed(() => schedule.value.filter((g) => g.status === 'final').slice(-3).reverse())

const topStandings = computed(() => standings.value.slice(0, 5))

const leaderRows = computed(() =>
  LEADER_CATS
    .map((c) => ({ ...c, top: buildLeaders(players.value, playerStats.value, c.key, 3, c.minGp ?? MIN_GP) }))
    .filter((c) => c.top.length > 0)
)
</script>

<template>
  <div class="container">
    <section class="hero">
      <span class="eyebrow">Season 4 Amlans Cup</span>
      <h1 class="hero-title">
        CGY<span style="color: var(--accent)">Ballers</span>
      </h1>
      <p class="hero-sub">
        Twelve teams. One league. Follow every score, stat line, and standings shift from the
        CGYBallers season.
      </p>
      <div class="hero-actions">
        <router-link to="/standings" class="btn btn-primary">View Standings</router-link>
        <router-link to="/schedule" class="btn">See Schedule</router-link>
        <a class="btn btn-fb" :href="FACEBOOK_URL" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Follow on Facebook
        </a>
      </div>
    </section>

    <section class="home-grid">
      <div class="card home-block">
        <div class="section-title">Upcoming Games</div>
        <div class="section-sub">Next matchups on the schedule</div>
        <p v-if="upcoming.length === 0" style="color: var(--text-muted)">No games scheduled.</p>
        <ul class="game-list">
          <li v-for="g in upcoming" :key="g.id" class="game-row">
            <span class="game-date">{{ formatDate(g.date) }}<br />{{ formatTime(g.time) }}</span>
            <span class="game-teams">
              <TeamBadge :team="teamById[g.home]" :size="28" /> {{ g.homeName }}
              <span class="game-at">@</span>
              {{ g.awayName }} <TeamBadge :team="teamById[g.away]" :size="28" />
            </span>
          </li>
        </ul>
        <router-link to="/schedule" class="see-all">See full schedule &rarr;</router-link>
      </div>

      <div class="card home-block">
        <div class="section-title">Recent Results</div>
        <div class="section-sub">Latest final scores</div>
        <p v-if="recent.length === 0" style="color: var(--text-muted)">No final scores yet.</p>
        <ul class="game-list">
          <li v-for="g in recent" :key="g.id" class="game-row">
            <span class="game-date">{{ formatDate(g.date) }}</span>
            <span class="game-teams score">
              {{ g.homeName }} <b>{{ g.homeScore }}</b>
              <span class="game-at">@</span>
              <b>{{ g.awayScore }}</b> {{ g.awayName }}
            </span>
          </li>
        </ul>
        <router-link to="/schedule" class="see-all">See full schedule &rarr;</router-link>
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

    <section style="margin-bottom: 20px">
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
  </div>
</template>
