<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import teams from '../data/teams.json'
import TeamBadge from './TeamBadge.vue'
import { STAGE_LABELS } from '../utils/playoffs'
import { formatDate } from '../utils/date'
import './PlayoffBracket.css'

const props = defineProps({
  series: { type: Array, required: true },
})

const teamById = Object.fromEntries(teams.map((t) => [t.id, t]))

const COLUMNS = ['playin', 'qf', 'sf', 'final']

// Grid placement: Play-In and Quarterfinals take one row each (4 rows),
// each Semifinal spans two, the Final spans all four, so every card sits
// vertically centred between the two cards that feed it.
const ROW_SPAN = { playin: 1, qf: 1, sf: 2, final: 4 }

const columns = computed(() =>
  COLUMNS.map((stage, col) => ({
    stage,
    label: STAGE_LABELS[stage],
    series: props.series
      .filter((s) => s.stage === stage)
      .map((s, i) => ({
        ...s,
        gridStyle: {
          gridColumn: col + 1,
          gridRow: `${i * ROW_SPAN[stage] + 2} / span ${ROW_SPAN[stage]}`,
        },
      })),
  }))
)

const champion = computed(() => props.series.find((s) => s.stage === 'final')?.winner ?? null)

// Where an empty slot's team will come from, e.g. "Winner 8 vs 9".
function placeholder(side) {
  if (!side.from) return 'TBD'
  const src = props.series.find((s) => s.id === side.from)
  if (!src) return 'TBD'
  const label = (x) => (x.seed ? `#${x.seed}` : x.team ? x.name : '?')
  if (src.top.seed && src.bottom.seed) return `Winner ${label(src.top)} / ${label(src.bottom)}`
  return `Winner ${STAGE_LABELS[src.stage].replace(/s$/, '')}`
}

function sideState(s, side) {
  if (!s.winner || !side.team) return ''
  return s.winner === side.team ? 'is-winner' : 'is-loser'
}

function statusLine(s) {
  if (s.winner) {
    const w = s.top.team === s.winner ? s.top : s.bottom
    if (s.walkover) return `${w.name} advance — opponent backed out`
    return `${w.name} advance${s.stage === 'final' ? ' — Champions' : ''}`
  }
  if (!s.top.team || !s.bottom.team) return s.formatLabel
  const next = s.games.find((g) => g.status === 'scheduled')
  if (next) return `Game ${next.number} · ${formatDate(next.date, { month: 'short', day: 'numeric' })}`
  if (s.games.length) return `${s.formatLabel} · in progress`
  return s.formatLabel
}

// ---- SVG connector lines -------------------------------------------------
// The cards are normal HTML; the lines between them are drawn in an SVG
// layered behind, using the cards' measured positions so they stay right at
// any size.
const root = ref(null)
const paths = ref([])
const size = ref({ w: 0, h: 0 })

function measure() {
  const el = root.value
  if (!el) return
  const box = el.getBoundingClientRect()
  size.value = { w: el.scrollWidth, h: el.scrollHeight }

  const rectOf = (sel) => {
    const node = el.querySelector(sel)
    if (!node) return null
    const r = node.getBoundingClientRect()
    return { left: r.left - box.left, right: r.right - box.left, midY: r.top - box.top + r.height / 2 }
  }

  const out = []
  props.series.forEach((s) => {
    ;['top', 'bottom'].forEach((pos) => {
      const from = s[pos].from
      if (!from) return
      const a = rectOf(`[data-series="${from}"]`)
      const b = rectOf(`[data-slot="${s.id}-${pos}"]`)
      if (!a || !b) return
      const midX = a.right + (b.left - a.right) / 2
      const decided = !!props.series.find((x) => x.id === from)?.winner
      out.push({
        key: `${from}-${s.id}`,
        d: `M ${a.right} ${a.midY} H ${midX} V ${b.midY} H ${b.left}`,
        decided,
      })
    })
  })
  paths.value = out
}

let observer
onMounted(() => {
  observer = new ResizeObserver(() => measure())
  observer.observe(root.value)
  nextTick(measure)
})
onBeforeUnmount(() => observer?.disconnect())
watch(
  () => props.series,
  () => nextTick(measure),
  { deep: true }
)
</script>

<template>
  <div class="bracket-scroll">
    <div ref="root" class="bracket">
      <svg class="bracket-lines" :width="size.w" :height="size.h" aria-hidden="true">
        <path
          v-for="p in paths"
          :key="p.key"
          :d="p.d"
          :class="['bracket-line', { 'is-decided': p.decided }]"
        />
      </svg>

      <div
        v-for="(col, i) in columns"
        :key="`h-${col.stage}`"
        class="bracket-col-title"
        :style="{ gridColumn: i + 1, gridRow: 1 }"
      >
        {{ col.label }}
      </div>

      <template v-for="col in columns" :key="col.stage">
        <div
          v-for="s in col.series"
          :key="s.id"
          class="bracket-cell"
          :style="s.gridStyle"
        >
          <div v-if="s.stage === 'final' && champion" class="bracket-champion">
            <TeamBadge :team="teamById[champion]" :size="40" />
            <div>
              <div class="bracket-champion-label">Champion</div>
              <div class="bracket-champion-name">{{ teamById[champion]?.name ?? champion }}</div>
            </div>
          </div>

          <div :data-series="s.id" :class="['bracket-card card', { 'is-final': s.stage === 'final' }]">
            <div
              v-for="pos in ['top', 'bottom']"
              :key="pos"
              :data-slot="`${s.id}-${pos}`"
              :class="['bracket-team', sideState(s, s[pos])]"
            >
              <span class="bracket-seed">{{ s[pos].seed ?? '' }}</span>
              <template v-if="s[pos].team">
                <TeamBadge :team="teamById[s[pos].team]" :size="24" />
                <router-link :to="`/teams/${s[pos].team}`" class="bracket-name">{{ s[pos].name }}</router-link>
                <span
                  v-if="s.format === 'twice-to-beat' && pos === 'top'"
                  class="bracket-adv"
                  title="Twice-to-beat advantage"
                >
                  2×
                </span>
                <span class="bracket-wins">{{ s.games.length ? s[pos].wins : '' }}</span>
              </template>
              <span v-else class="bracket-tbd">{{ placeholder(s[pos]) }}</span>
            </div>

            <div class="bracket-meta">
              <span>{{ statusLine(s) }}</span>
              <span v-if="s.games.some((g) => g.status !== 'scheduled')" class="bracket-games">
                <router-link
                  v-for="g in s.games.filter((g) => g.status !== 'scheduled')"
                  :key="g.id"
                  :to="`/games/${g.id}`"
                  class="bracket-game"
                  :title="`Game ${g.number}`"
                >
                  G{{ g.number }}
                </router-link>
              </span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
