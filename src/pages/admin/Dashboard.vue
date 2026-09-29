<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TeamBadge from '../../components/TeamBadge.vue'
import { STAGE_LABELS } from '../../utils/playoffs'
import { formatDate, formatTime } from '../../utils/date'
import './Dashboard.css'

const router = useRouter()
const username = ref('')
const games = ref([])
const teams = ref([])
const playerCount = ref(null)
const loaded = ref(false)

// Local date (not UTC), so games don't roll over at 8am Philippine time.
const now = new Date()
const todayStr = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
  .map((n) => String(n).padStart(2, '0'))
  .join('-')

onMounted(async () => {
  const meRes = await fetch('/api/me', { credentials: 'include' })
  if (!meRes.ok) {
    router.push('/admin/login')
    return
  }
  username.value = (await meRes.json()).username

  const [gamesRes, teamsRes, playersRes] = await Promise.all([
    fetch('/api/games'),
    fetch('/api/teams'),
    fetch('/api/players'),
  ])
  games.value = await gamesRes.json()
  teams.value = await teamsRes.json()
  playerCount.value = (await playersRes.json()).length
  loaded.value = true
  if (!counts.value.needs) tab.value = 'upcoming'
})

const teamById = computed(() => Object.fromEntries(teams.value.map((t) => [t.id, t])))

// A game is "needs result" once its date has passed and it's still scheduled.
function bucket(g) {
  if (g.status === 'scheduled') return g.date < todayStr ? 'needs' : 'upcoming'
  return 'completed'
}

const TABS = [
  { key: 'needs', label: 'Needs result' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
]
const tab = ref('needs')
const teamFilter = ref('all')

const counts = computed(() => {
  const c = { needs: 0, upcoming: 0, completed: 0, all: games.value.length }
  games.value.forEach((g) => c[bucket(g)]++)
  return c
})

// Upcoming reads forward in time (next game first); everything else shows
// the most recent first, so today's / last night's games are on top.
const groupedGames = computed(() => {
  const list = games.value
    .filter((g) => tab.value === 'all' || bucket(g) === tab.value)
    .filter((g) => teamFilter.value === 'all' || g.home === teamFilter.value || g.away === teamFilter.value)
  const dir = tab.value === 'upcoming' ? 1 : -1
  list.sort((a, b) => dir * (a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? '')))

  const groups = []
  list.forEach((g) => {
    const last = groups[groups.length - 1]
    if (last?.date === g.date) last.games.push(g)
    else groups.push({ date: g.date, games: [g] })
  })
  return groups
})

const STATUS_LABELS = { scheduled: 'Scheduled', final: 'Final', forfeit: 'Forfeit', cancelled: 'Cancelled' }

function statusKey(g) {
  return bucket(g) === 'needs' ? 'needs' : g.status
}

function winnerOf(g) {
  if (g.status === 'forfeit') return g.winner
  if (g.status === 'final' && g.homeScore != null && g.awayScore != null) {
    return g.homeScore > g.awayScore ? g.home : g.away
  }
  return null
}

function dayLabel(date) {
  if (date === todayStr) return `Today · ${formatDate(date, { weekday: 'short', month: 'short', day: 'numeric' })}`
  return formatDate(date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

async function logout() {
  await fetch('/api/logout', { method: 'POST', credentials: 'include' })
  router.push('/admin/login')
}

async function deleteGame(game) {
  const confirmed = confirm(`Delete ${game.homeName} vs ${game.awayName} on ${game.date}? This cannot be undone.`)
  if (!confirmed) return

  const res = await fetch(`/api/games/${game.id}`, { method: 'DELETE', credentials: 'include' })
  if (res.ok) {
    games.value = games.value.filter((g) => g.id !== game.id)
  } else {
    alert('Failed to delete game.')
  }
}
</script>

<template>
  <div class="container admin-dash">
    <header class="dash-header">
      <div>
        <div class="eyebrow">Admin</div>
        <h1 class="dash-title">Dashboard</h1>
        <p v-if="username" class="dash-user">Logged in as <b>{{ username }}</b></p>
      </div>
      <button class="btn" @click="logout">Log out</button>
    </header>

    <nav class="dash-actions">
      <router-link to="/admin/games/new" class="card dash-action dash-action-primary">
        <span class="dash-action-icon" aria-hidden="true">+</span>
        <span>
          <span class="dash-action-title">Add Game</span>
          <span class="dash-action-sub">Schedule a new matchup</span>
        </span>
      </router-link>
      <router-link to="/admin/teams" class="card dash-action">
        <span class="dash-action-count">{{ loaded ? teams.length : '–' }}</span>
        <span>
          <span class="dash-action-title">Teams</span>
          <span class="dash-action-sub">Logos, colors, featured photos</span>
        </span>
      </router-link>
      <router-link to="/admin/players" class="card dash-action">
        <span class="dash-action-count">{{ playerCount ?? '–' }}</span>
        <span>
          <span class="dash-action-title">Players</span>
          <span class="dash-action-sub">Rosters, numbers, photos</span>
        </span>
      </router-link>
    </nav>

    <section>
      <div class="dash-games-head">
        <h2 class="section-title">Games</h2>
        <select v-model="teamFilter" class="dash-select" aria-label="Filter by team">
          <option value="all">All teams</option>
          <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>

      <div class="dash-tabs" role="tablist">
        <button
          v-for="t in TABS"
          :key="t.key"
          role="tab"
          :aria-selected="tab === t.key"
          :class="['dash-tab', { active: tab === t.key, alert: t.key === 'needs' && counts.needs > 0 }]"
          @click="tab = t.key"
        >
          {{ t.label }}
          <span class="dash-tab-count">{{ counts[t.key] }}</span>
        </button>
      </div>

      <div v-if="!loaded" class="card empty-state">Loading&hellip;</div>
      <div v-else-if="!groupedGames.length" class="card empty-state">
        {{ tab === 'needs' ? 'All caught up — every past game has a result.' : 'No games here.' }}
      </div>

      <div v-else class="dash-days">
        <div v-for="day in groupedGames" :key="day.date">
          <div :class="['dash-day-label', { today: day.date === todayStr }]">{{ dayLabel(day.date) }}</div>
          <div class="card dash-day">
            <div v-for="g in day.games" :key="g.id" :class="['dash-game', `is-${statusKey(g)}`]">
              <div class="dash-game-time">{{ formatTime(g.time) }}</div>

              <div class="dash-game-teams">
                <div
                  v-for="side in ['home', 'away']"
                  :key="side"
                  :class="['dash-team', { lost: winnerOf(g) && winnerOf(g) !== g[side] }]"
                >
                  <TeamBadge :team="teamById[g[side]]" :size="24" />
                  <span class="dash-team-name">{{ side === 'home' ? g.homeName : g.awayName }}</span>
                  <span class="dash-team-score">
                    {{
                      g.status === 'final'
                        ? side === 'home' ? g.homeScore : g.awayScore
                        : g.status === 'forfeit' && g.winner === g[side] ? 'FF' : ''
                    }}
                  </span>
                </div>
              </div>

              <div class="dash-game-meta">
                <span :class="['dash-status', `dash-status-${statusKey(g)}`]">
                  {{ statusKey(g) === 'needs' ? 'Needs result' : STATUS_LABELS[g.status] ?? g.status }}
                </span>
                <span v-if="g.stage && g.stage !== 'elimination'" class="badge">{{ STAGE_LABELS[g.stage] }}</span>
              </div>

              <div class="dash-game-actions">
                <router-link
                  :to="`/admin/games/${g.id}/boxscore`"
                  :class="['btn', 'btn-sm', { 'btn-primary': statusKey(g) === 'needs' }]"
                >
                  {{ g.hasBoxscore ? 'Edit' : 'Enter' }} box score
                </router-link>
                <router-link :to="`/admin/games/${g.id}/status`" class="btn btn-sm">Score / status</router-link>
                <button class="btn btn-sm dash-delete" :aria-label="`Delete ${g.homeName} vs ${g.awayName}`" @click="deleteGame(g)">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
