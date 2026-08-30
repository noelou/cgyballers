// Generates src/data/*.json from the roster list in plan.md.
// Re-run with `npm run gen:data` after editing TEAMS below.
// Stats are deterministic mock data (seeded RNG), not real records.
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'src', 'data')
mkdirSync(DATA_DIR, { recursive: true })

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

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C']
const POSITION_LABEL = { PG: 'Point Guard', SG: 'Shooting Guard', SF: 'Small Forward', PF: 'Power Forward', C: 'Center' }

const HEIGHT_RANGE = { PG: [170, 180], SG: [176, 186], SF: [183, 193], PF: [188, 198], C: [195, 208] }
// Player stats (ppg/rpg/apg/etc.) are no longer mocked here — they are computed
// at load time from real box scores in src/data/boxscores/*.json (see
// src/utils/playerStats.js). This script only seeds bios.


function cmToFeetInches(cm) {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return `${feet}'${inches}"`
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

    const player = {
      id,
      name,
      team: slug,
      teamName: team.name,
      number,
      position,
      positionLabel: POSITION_LABEL[position],
      heightCm: height,
      heightDisplay: cmToFeetInches(height),
      weightKg: weight,
      age,
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
    logo: `/logos/${slug}.png`,
    venue: VENUE,
    playerIds: roster.map((p) => p.id),
  })
})

// ---- Schedule + standings ----
// Real fixture list for CGY Ballers Season 4 — Amlan's Cup (from the league's
// published schedule graphic). Update this array — not a generator — when a
// new round of fixtures is announced; see scripts/README.md for the flow.
// [date, time, homeTeamName, awayTeamName]
const REAL_FIXTURES = [
  ['2026-08-05', '20:00', 'A-Team', 'RGB Zees'],
  ['2026-08-05', '21:00', 'ETS x RLT', 'Howon'],
  ['2026-08-07', '18:00', 'Stampede', 'Maranding Autoparts'],
  ['2026-08-07', '19:00', 'Jacque Jons', 'GLQ'],
  ['2026-08-07', '20:00', 'JME-JES', 'Warlyn'],
  ['2026-08-07', '21:00', 'GRIT', 'Young Chow'],
  ['2026-08-12', '20:00', 'Jacque Jons', 'JME-JES'],
  ['2026-08-12', '21:00', 'Stampede', 'ETS x RLT'],
  ['2026-08-14', '18:00', 'RGB Zees', 'GRIT'],
  ['2026-08-14', '19:00', 'A-Team', 'Howon'],
  ['2026-08-14', '20:00', 'Maranding Autoparts', 'GLQ'],
  ['2026-08-14', '21:00', 'Warlyn', 'Stampede'],
  ['2026-08-16', '20:00', 'Young Chow', 'Warlyn'],
  ['2026-08-16', '21:00', 'Jacque Jons', 'Maranding Autoparts'],
  ['2026-08-19', '20:00', 'ETS x RLT', 'Young Chow'],
  ['2026-08-19', '21:00', 'GRIT', 'Stampede'],
  ['2026-08-21', '18:00', 'JME-JES', 'A-Team'],
  ['2026-08-21', '19:00', 'Young Chow', 'GLQ'],
  ['2026-08-21', '20:00', 'Jacque Jons', 'Warlyn'],
  ['2026-08-21', '21:00', 'Howon', 'RGB Zees'],
  ['2026-08-23', '20:00', 'GLQ', 'Stampede'],
  ['2026-08-23', '21:00', 'Maranding Autoparts', 'GRIT'],
  ['2026-08-26', '20:00', 'Howon', 'Stampede'],
  ['2026-08-26', '21:00', 'A-Team', 'Maranding Autoparts'],
  ['2026-08-28', '18:00', 'ETS x RLT', 'Maranding Autoparts'],
  ['2026-08-28', '19:00', 'JME-JES', 'Howon'],
  ['2026-08-28', '20:00', 'RGB Zees', 'Jacque Jons'],
  ['2026-08-28', '21:00', 'Warlyn', 'A-Team'],
  ['2026-08-30', '20:00', 'GRIT', 'ETS x RLT'],
  ['2026-08-30', '21:00', 'GLQ', 'Warlyn'],
]

function buildSchedule() {
  const teamByName = Object.fromEntries(teams.map((t) => [t.name, t]))

  const games = REAL_FIXTURES.map(([date, time, homeName, awayName], i) => {
    const home = teamByName[homeName]
    const away = teamByName[awayName]
    if (!home) throw new Error(`Unknown home team in REAL_FIXTURES: ${homeName}`)
    if (!away) throw new Error(`Unknown away team in REAL_FIXTURES: ${awayName}`)
    return {
      id: `g${i + 1}`,
      date,
      time,
      venue: home.venue,
      home: home.id,
      homeName: home.name,
      away: away.id,
      awayName: away.name,
      // No official results reported yet — flip to 'final' with real scores
      // once a game is played (see scripts/README.md).
      status: 'scheduled',
      homeScore: null,
      awayScore: null,
    }
  })

  games.sort((x, y) => x.date.localeCompare(y.date) || x.time.localeCompare(y.time))
  return games
}

const schedule = buildSchedule()

// Standings are no longer written to a file — src/utils/standings.js computes
// them at load time from schedule.json, so there is nothing to regenerate here.

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
writeFileSync(join(DATA_DIR, 'news.json'), JSON.stringify(news, null, 2))

console.log(`Generated ${teams.length} teams, ${players.length} players, ${schedule.length} games, ${news.length} news items.`)
