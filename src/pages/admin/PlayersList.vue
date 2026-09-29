<script setup>
import { ref, computed, onMounted } from 'vue'
import Avatar from '../../components/Avatar.vue'
import TeamBadge from '../../components/TeamBadge.vue'
import './admin.css'

const teams = ref([])
const players = ref([])
const loaded = ref(false)
const search = ref('')
const teamFilter = ref('all')

onMounted(async () => {
  const [teamsRes, playersRes] = await Promise.all([fetch('/api/teams'), fetch('/api/players')])
  teams.value = await teamsRes.json()
  players.value = await playersRes.json()
  loaded.value = true
})

// Matches name or jersey number, e.g. "jess" or "23".
function matches(p, q) {
  return p.name.toLowerCase().includes(q) || String(p.number ?? '') === q
}

const visibleTeams = computed(() => {
  const q = search.value.trim().toLowerCase()
  return teams.value
    .filter((t) => teamFilter.value === 'all' || t.id === teamFilter.value)
    .map((t) => ({
      ...t,
      players: players.value
        .filter((p) => p.team === t.id && (!q || matches(p, q)))
        .sort((a, b) => (a.number ?? 999) - (b.number ?? 999) || a.name.localeCompare(b.name)),
    }))
    // While searching, hide teams with no matches; otherwise show empty rosters too.
    .filter((t) => !q || t.players.length)
})

const shownCount = computed(() => visibleTeams.value.reduce((n, t) => n + t.players.length, 0))
const addPlayerLink = computed(() =>
  teamFilter.value === 'all' ? '/admin/players/new' : `/admin/players/new?team=${teamFilter.value}`
)
</script>

<template>
  <div class="container">
    <router-link to="/admin" class="admin-back">&larr; Back to Dashboard</router-link>
    <div class="admin-list-head">
      <h1 class="admin-title">Players</h1>
      <router-link :to="addPlayerLink" class="btn btn-primary">+ Add Player</router-link>
    </div>

    <div class="admin-toolbar">
      <input
        v-model="search"
        type="search"
        class="admin-input admin-search"
        placeholder="Search by name or number…"
        aria-label="Search players"
      />
      <select v-model="teamFilter" class="admin-input" aria-label="Filter by team">
        <option value="all">All teams</option>
        <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
    </div>
    <p v-if="loaded" class="players-count">
      {{ shownCount }} {{ shownCount === 1 ? 'player' : 'players' }}
      <template v-if="search.trim() || teamFilter !== 'all'">
        · <button type="button" class="players-clear" @click="(search = ''), (teamFilter = 'all')">Clear filters</button>
      </template>
    </p>

    <div v-if="!loaded" class="card empty-state">Loading&hellip;</div>
    <div v-else-if="!visibleTeams.length" class="card empty-state">No players match “{{ search }}”.</div>

    <section v-for="t in visibleTeams" :key="t.id" class="players-team">
      <div class="players-team-head">
        <div class="players-team-name">
          <TeamBadge :team="t" :size="28" />
          <h2>{{ t.name }}</h2>
          <span class="players-team-count">{{ t.players.length }}</span>
        </div>
        <router-link :to="`/admin/players/new?team=${t.id}`" class="btn btn-sm">+ Add Player</router-link>
      </div>

      <div class="card table-scroll">
        <table>
          <thead>
            <tr>
              <th style="width: 56px">#</th>
              <th>Name</th>
              <th>Position</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in t.players" :key="p.id">
              <td class="players-num">{{ p.number ?? '–' }}</td>
              <td>
                <div class="players-name">
                  <Avatar :name="p.name" :pic="p.pic" :size="32" />
                  {{ p.name }}
                </div>
              </td>
              <td class="players-pos">{{ p.positionLabel || p.position || '–' }}</td>
              <td style="text-align: right">
                <router-link :to="`/admin/players/${p.id}/edit`" class="btn btn-sm">Edit</router-link>
              </td>
            </tr>
            <tr v-if="!t.players.length">
              <td colspan="4" class="players-empty">No players yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.players-count {
  color: var(--text-muted);
  font-size: 13px;
  margin: 0 0 8px;
}

.players-clear {
  padding: 0;
  border: none;
  background: none;
  color: var(--accent-strong);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.players-team {
  margin-top: 28px;
}

.players-team-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.players-team-name {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.players-team-name h2 {
  font-size: 17px;
  font-weight: 800;
  margin: 0;
}

.players-team-count {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
}

.players-num {
  font-weight: 800;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.players-name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
}

.players-pos {
  color: var(--text-muted);
}

.players-empty {
  color: var(--text-dim);
  text-align: center;
  padding: 20px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}
</style>
