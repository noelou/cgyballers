// Generates src/data/*.json from the roster list in plan.md.
// Re-run with `npm run gen:data` after editing TEAMS below.
// Stats are deterministic mock data (seeded RNG), not real records.
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'src', 'data')
mkdirSync(DATA_DIR, { recursive: true })

const TODAY = new Date('2026-08-23')

const TEAMS = [
  { name: 'Jacque Jons', players: ['Daclag', 'Roa', 'Mesa', 'Santos', 'Saarenas', 'Villahermosa', 'Villanueva', 'Villar', 'Ucab', 'Abis', 'Sanchez', 'Baquial'] },
  { name: 'Stampede', players: ['Manigsaca', 'Oca', 'Torres', 'Pana', 'Ellevera', 'Cano', 'Baculio', 'Sia', 'Yanez', 'Cabanez', 'Maandig', 'Ortiz'] },
  { name: 'JME-JES', players: ['Jessie', 'Ronald', 'Daug', 'Acaylar', 'Jarjar', 'Campos', 'Beja', 'Apollo', 'Libres', 'Arquibel', 'Sario', 'Edrote'] },
  { name: 'GLQ', players: ['Moreno', 'Langreo', 'Cordova', 'Pasigay', 'Tuto', 'Pcatolerin', 'Pantonial', 'Quilala', 'Micabani', 'Lamberang', 'Repulo', 'Cahilog'] },
  { name: 'A-Team', players: ['Tan', 'Handuman', 'Vadehueza', 'Abaday', 'Gorit', 'Aguhar', 'Naliponguit', 'Onico', 'Arcilla', 'Abbu', 'Pajo', 'Rodrigo'] },
  { name: 'ETS x RLT', players: ['Valdez', 'Custan', 'Ansin', 'Estevez', 'Edades', 'Tan-awon', 'Bitoy', 'Tutor', 'Gumera', 'Pcaudan', 'Taal', 'Lentorio'] },
  { name: 'Howon', players: ['Sanoria', 'Estrella', 'Tabalon', 'Parrel', 'Virtudazo', 'Akut', 'Nabasca', 'Garcia', 'Parba', 'Capito', 'Gulben', 'Besande'] },
  { name: 'Warlyn', players: ['Magsalay', 'Arcillas', 'Gamorot', 'Barbero', 'Palubon', 'Fernandez', 'Ebarat', 'Palen', 'Maca-ayan', 'Canales', 'Olarte', 'Grafe'] },
  { name: 'Maranding Autoparts', players: ['Cabrezos', 'Andoy', 'Arong', 'Garlan', 'Labares', 'Recabo', 'Grueso', 'Sang-an', 'Comique', 'Alvarado', 'Inciso', 'Borinaga'] },
  { name: 'GRIT', players: ['Montealegre', 'Estevez', 'J. Nagac', 'Bardos', 'Amper', 'Rey', 'Pabualan', 'Arancis', 'Nagac', 'Pantolio', 'Aycardo', 'Gacusan'] },
  { name: 'RGB Zees', players: ['Plantado', 'Madrigal', 'Ayuma', 'Sandigan', 'Zamora', 'Nemenzo', 'Cabreros', 'Baylo', 'Madrigal', 'Marcoso', 'Gealan', 'Juson'] },
  { name: 'Young Chow', players: ['Bayon', 'Gaccion', 'Halasan', 'Goopio', 'Julie', 'Pardillo', 'Gacusan', 'Francisco', 'Poras', 'Bangcuyo', 'Proceso', 'Achaocoso'] },
]

const TEAM_COLORS = [
  '#ff6a1a', '#1ac0ff', '#ffd21a', '#ff1a5e', '#3dff9e', '#a45bff',
  '#ff8e1a', '#1affc4', '#ff4f4f', '#5b8cff', '#c8ff1a', '#ff6bd6',
]

// The whole league plays at a single home court.
const VENUE = 'I.S. Covered Court'

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// mulberry32 seeded PRNG for reproducible output
function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function seedFromString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) { h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0 }
  return h >>> 0
}
const rng = mulberry32(seedFromString('cgyballers-2026'))
const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min
const pick = (arr) => arr[randInt(0, arr.length - 1)]

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C']
const POSITION_LABEL = { PG: 'Point Guard', SG: 'Shooting Guard', SF: 'Small Forward', PF: 'Power Forward', C: 'Center' }

const HEIGHT_RANGE = { PG: [170, 180], SG: [176, 186], SF: [183, 193], PF: [188, 198], C: [195, 208] }
const PPG_RANGE = { PG: [8, 20], SG: [9, 24], SF: [8, 22], PF: [7, 19], C: [6, 17] }
const RPG_RANGE = { PG: [2, 5], SG: [2, 6], SF: [4, 8], PF: [6, 11], C: [7, 14] }
const APG_RANGE = { PG: [4, 10], SG: [2, 7], SF: [2, 5], PF: [1, 4], C: [1, 3] }

const FREE_AGENT_POOL = ['Free Agent', 'Barangay Ballers', 'Riverside Hoops', 'Coastal Runners', 'Metro Ballaz']

function cmToFeetInches(cm) {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return `${feet}'${inches}"`
}

function birthdateForAge(age) {
  const y = TODAY.getFullYear() - age
  const m = randInt(1, 12)
  const d = randInt(1, 28)
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

const teams = []
const players = []

TEAMS.forEach((team, ti) => {
  const slug = slugify(team.name)
  const color = TEAM_COLORS[ti % TEAM_COLORS.length]
  const usedNumbers = new Set()
  const roster = []

  team.players.forEach((rawName, pi) => {
    const name = rawName
    const id = `${slug}-${slugify(name)}${roster.some((p) => p.name === name) ? `-${pi}` : ''}`
    const position = POSITIONS[pi % POSITIONS.length]

    let number
    do { number = randInt(0, 55) } while (usedNumbers.has(number))
    usedNumbers.add(number)

    const [hMin, hMax] = HEIGHT_RANGE[position]
    const height = randInt(hMin, hMax)
    const weight = Math.round(height - 100 + randInt(-4, 16))
    const experience = randInt(0, 9)
    const age = Math.max(19, 19 + experience + randInt(0, 4))

    const [ppgMin, ppgMax] = PPG_RANGE[position]
    const [rpgMin, rpgMax] = RPG_RANGE[position]
    const [apgMin, apgMax] = APG_RANGE[position]

    const draft = rng() < 0.25
      ? `${TODAY.getFullYear() - randInt(0, experience || 1)} League Draft`
      : 'Undrafted'

    const lastTeam = experience === 0
      ? '—'
      : (rng() < 0.5 ? pick(TEAMS.filter((t) => t.name !== team.name).map((t) => t.name)) : pick(FREE_AGENT_POOL))

    const player = {
      id,
      name,
      team: slug,
      teamName: team.name,
      number,
      position,
      positionLabel: POSITION_LABEL[position],
      ppg: +(ppgMin + rng() * (ppgMax - ppgMin)).toFixed(1),
      rpg: +(rpgMin + rng() * (rpgMax - rpgMin)).toFixed(1),
      apg: +(apgMin + rng() * (apgMax - apgMin)).toFixed(1),
      heightCm: height,
      heightDisplay: cmToFeetInches(height),
      weightKg: weight,
      country: 'Philippines',
      lastTeam,
      age,
      birthdate: birthdateForAge(age),
      draft,
      experience: experience === 0 ? 'Rookie' : `${experience} yr${experience > 1 ? 's' : ''}`,
      pic: null,
    }
    roster.push(player)
    players.push(player)
  })

  teams.push({
    id: slug,
    name: team.name,
    color,
    venue: VENUE,
    playerIds: roster.map((p) => p.id),
  })
})

// ---- Schedule + standings ----
// League nights are Wednesday, Friday, and Sunday. Friday carries a full
// four-game card (6/7/8/9 PM); Wednesday and Sunday carry a two-game card
// (8/9 PM) since fewer teams play those nights.
const WEDNESDAY = 3
const FRIDAY = 5
const SUNDAY = 0
const FRIDAY_SLOTS = ['18:00', '19:00', '20:00', '21:00']
const OTHER_SLOTS = ['20:00', '21:00']

function buildSchedule() {
  const pairs = []
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) pairs.push([i, j])
  }
  // shuffle deterministically — each team faces every other team once (single round robin)
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pairs[i], pairs[j]] = [pairs[j], pairs[i]]
  }

  const games = []
  let queue = pairs
  const d = new Date('2026-07-01')
  let safety = 0

  while (queue.length > 0 && safety < 2000) {
    safety++
    const day = d.getDay()
    const times = day === FRIDAY ? FRIDAY_SLOTS : (day === WEDNESDAY || day === SUNDAY) ? OTHER_SLOTS : null

    if (times) {
      const usedToday = new Set()
      const deferred = []
      let slotIdx = 0

      for (const pair of queue) {
        const [a, b] = pair
        const home = teams[a]
        const away = teams[b]
        if (slotIdx < times.length && !usedToday.has(home.id) && !usedToday.has(away.id)) {
          usedToday.add(home.id)
          usedToday.add(away.id)
          const date = new Date(d)
          const isPlayed = date < TODAY
          const game = {
            id: `g${games.length + 1}`,
            date: date.toISOString().slice(0, 10),
            time: times[slotIdx],
            venue: home.venue,
            home: home.id,
            homeName: home.name,
            away: away.id,
            awayName: away.name,
            status: isPlayed ? 'final' : 'scheduled',
            homeScore: null,
            awayScore: null,
          }
          if (isPlayed) {
            game.homeScore = randInt(62, 108)
            game.awayScore = randInt(62, 108)
            if (game.homeScore === game.awayScore) game.homeScore += 1
          }
          games.push(game)
          slotIdx++
        } else {
          deferred.push(pair)
        }
      }
      queue = deferred
    }
    d.setDate(d.getDate() + 1)
  }

  games.sort((x, y) => x.date.localeCompare(y.date) || x.time.localeCompare(y.time))
  return games
}

const schedule = buildSchedule()

function buildStandings() {
  const table = {}
  teams.forEach((t) => {
    table[t.id] = { team: t.id, name: t.name, color: t.color, wins: 0, losses: 0, pf: 0, pa: 0, streak: 0, streakType: null }
  })
  schedule.filter((g) => g.status === 'final').forEach((g) => {
    const h = table[g.home]
    const a = table[g.away]
    h.pf += g.homeScore; h.pa += g.awayScore
    a.pf += g.awayScore; a.pa += g.homeScore
    if (g.homeScore > g.awayScore) { h.wins++; a.losses++ } else { a.wins++; h.losses++ }
  })
  const rows = Object.values(table).map((r) => {
    const gp = r.wins + r.losses
    return {
      ...r,
      gp,
      winPct: gp ? +(r.wins / gp).toFixed(3) : 0,
      diff: r.pf - r.pa,
    }
  })
  rows.sort((a, b) => b.winPct - a.winPct || b.diff - a.diff)
  const leaderWins = rows[0]?.wins ?? 0
  const leaderLosses = rows[0]?.losses ?? 0
  rows.forEach((r, i) => {
    r.rank = i + 1
    r.gb = i === 0 ? 0 : +(((leaderWins - r.wins) + (r.losses - leaderLosses)) / 2).toFixed(1)
  })
  return rows
}

const standings = buildStandings()

const news = [
  {
    id: 'n1',
    title: 'CGYBallers Season Tips Off at CGY Sports Complex',
    date: '2026-07-04',
    excerpt: 'Twelve teams open the new season with a doubleheader as the league returns for another year of grassroots ball.',
    body: 'The CGYBallers season officially began this weekend with a packed doubleheader at CGY Sports Complex. Fans packed the sidelines to watch the twelve-team league tip off its schedule, with several offseason roster moves already shaking up early power rankings.',
    tag: 'League',
  },
  {
    id: 'n2',
    title: 'Early Standings Shakeup as Contenders Separate from the Pack',
    date: '2026-07-20',
    excerpt: 'A few weeks into the season, the standings are starting to take shape with two teams jumping out to hot starts.',
    body: 'With the opening weeks in the books, the standings board is beginning to separate the contenders from the rest of the field. Depth and defense have been the deciding factor so far, and coaches around the league are already adjusting rotations.',
    tag: 'Standings',
  },
  {
    id: 'n3',
    title: 'Weekly Stat Leaders: Scoring, Boards, and Dimes',
    date: '2026-08-02',
    excerpt: 'A look at who is topping the league leaderboards through the first stretch of the season.',
    body: 'Scoring races are heating up across the league as several players push toward the top of the leaderboard in points, rebounds, and assists per game. The players page has the full breakdown of every roster and their season averages.',
    tag: 'Stats',
  },
  {
    id: 'n4',
    title: 'Midseason Injury Update',
    date: '2026-08-10',
    excerpt: 'A rundown of the latest availability news around the league heading into the second half of the schedule.',
    body: 'Several squads are managing minor injuries as the season reaches its midpoint. Team staff say most players are considered day-to-day and expected back well before the playoff push begins.',
    tag: 'Injuries',
  },
  {
    id: 'n5',
    title: 'Playoff Picture Coming Into Focus',
    date: '2026-08-18',
    excerpt: 'With the regular season winding down, teams on the bubble are jockeying for playoff positioning.',
    body: 'As the schedule enters its final stretch, several teams sit within a game or two of a playoff spot. Every remaining matchup now carries extra weight for teams fighting to lock in postseason positioning.',
    tag: 'Playoffs',
  },
  {
    id: 'n6',
    title: 'Community Spotlight: The Growth of CGYBallers',
    date: '2026-08-22',
    excerpt: 'A look at how the league has grown from a handful of teams into a full-fledged twelve-team competition.',
    body: 'What started as a small weekend pickup circuit has grown into CGYBallers, a twelve-team league with a full regular season, standings race, and passionate local following. Organizers say expansion talks for next season are already underway.',
    tag: 'Community',
  },
]

writeFileSync(join(DATA_DIR, 'teams.json'), JSON.stringify(teams, null, 2))
writeFileSync(join(DATA_DIR, 'players.json'), JSON.stringify(players, null, 2))
writeFileSync(join(DATA_DIR, 'schedule.json'), JSON.stringify(schedule, null, 2))
writeFileSync(join(DATA_DIR, 'standings.json'), JSON.stringify(standings, null, 2))
writeFileSync(join(DATA_DIR, 'news.json'), JSON.stringify(news, null, 2))

console.log(`Generated ${teams.length} teams, ${players.length} players, ${schedule.length} games, ${news.length} news items.`)
