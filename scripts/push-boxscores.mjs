// Copies box scores you've entered and checked locally up to the live site.
// It sends each game through the live API, the same as clicking Save on the
// admin box score page, so the live site recalculates the score and marks
// the game final. It only touches the games you name and never deletes
// anything.
//
// Usage:
//   node scripts/push-boxscores.mjs g52 g53 --check   compare only, no login, nothing sent
//   node scripts/push-boxscores.mjs g52 g53           push (asks for your live admin login)
//   ... --overwrite   also replace games that already have a box score on live
//
// Login: asked for in the terminal (password hidden), or set LIVE_ADMIN_USER
// and LIVE_ADMIN_PASSWORD in the environment.
import { createInterface } from 'node:readline';
import { pool } from './db.mjs';

const LIVE = process.env.LIVE_URL || 'https://cgyballers.gacs.me';
const COLS = ['pts', 'reb', 'ast', 'blk', 'stl', 'tpa', 'tpm', 'fta', 'ftm'];

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const overwrite = args.includes('--overwrite');
const gameIds = args.filter((a) => !a.startsWith('--'));

if (gameIds.length === 0) {
  console.error('Usage: node scripts/push-boxscores.mjs <gameId> [<gameId> ...] [--check] [--overwrite]');
  process.exit(1);
}

async function liveJson(path, options) {
  const res = await fetch(LIVE + path, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path}: ${res.status} ${body.error ?? ''}`.trim());
  return body;
}

// Local lines for one game, shaped like the API's { playerId: { pts, ... } }.
async function localLines(gameId) {
  const result = await pool.query(
    `SELECT player_id AS "playerId", ${COLS.join(', ')} FROM boxscore_lines WHERE game_id = $1`,
    [gameId]
  );
  return Object.fromEntries(result.rows.map(({ playerId, ...line }) => [playerId, line]));
}

const sameLines = (a, b) =>
  Object.keys(a).length === Object.keys(b).length &&
  Object.entries(a).every(([pid, line]) => b[pid] && COLS.every((k) => line[k] === b[pid][k]));

// --- Check every game before sending anything ---
const plan = [];
let problems = 0;

for (const gameId of gameIds) {
  const lines = await localLines(gameId);
  const local = (
    await pool.query('SELECT home_team_id AS home, away_team_id AS away FROM games WHERE id = $1', [gameId])
  ).rows[0];
  let live;
  try {
    live = await liveJson(`/api/games/${gameId}/boxscore`);
  } catch (err) {
    console.log(`✗ ${gameId}: not found on live (${err.message})`);
    problems++;
    continue;
  }
  const { game } = live;
  const label = `${gameId} ${game.date} ${game.homeName} vs ${game.awayName}`;

  if (!local) {
    console.log(`✗ ${label}: not in the local database`);
    problems++;
    continue;
  }
  if (local.home !== game.home || local.away !== game.away) {
    console.log(`✗ ${label}: teams differ (local ${local.home} vs ${local.away})`);
    problems++;
    continue;
  }
  if (Object.keys(lines).length === 0) {
    console.log(`✗ ${label}: no box score entered locally`);
    problems++;
    continue;
  }

  const liveRoster = new Set([...live.homeRoster, ...live.awayRoster].map((p) => p.id));
  const missing = Object.keys(lines).filter((pid) => !liveRoster.has(pid));
  if (missing.length) {
    console.log(`✗ ${label}: players not on the live roster yet — add them in live admin first: ${missing.join(', ')}`);
    problems++;
    continue;
  }

  const homeIds = new Set(live.homeRoster.map((p) => p.id));
  let homeScore = 0;
  let awayScore = 0;
  for (const [pid, line] of Object.entries(lines)) {
    if (homeIds.has(pid)) homeScore += line.pts;
    else awayScore += line.pts;
  }
  const score = `${homeScore}-${awayScore}`;
  const liveScore = game.status === 'final' ? `${game.homeScore}-${game.awayScore}` : 'no score';
  const scoreNote = score === liveScore ? '' : ` (live score ${liveScore} will become ${score})`;

  const liveHasBox = Object.keys(live.lines).length > 0;
  if (liveHasBox && sameLines(lines, live.lines)) {
    console.log(`= ${label}: already identical on live, skipping`);
    continue;
  }
  if (liveHasBox && !overwrite) {
    console.log(`✗ ${label}: live already has a different box score — rerun with --overwrite to replace it`);
    problems++;
    continue;
  }
  const extra = Object.keys(live.lines).filter((pid) => !lines[pid]);
  if (extra.length) {
    console.log(`✗ ${label}: live has lines for players not in the local box score: ${extra.join(', ')}`);
    problems++;
    continue;
  }

  console.log(`✓ ${label}: ${Object.keys(lines).length} players, ${score}${liveHasBox ? ', REPLACES live box score' : ''}${scoreNote}`);
  plan.push({ gameId, label, lines, score });
}

await pool.end();

if (problems) {
  console.log(`\n${problems} game(s) have problems. Nothing was sent.`);
  process.exit(1);
}
if (plan.length === 0) {
  console.log('\nNothing to push.');
  process.exit(0);
}
if (checkOnly) {
  console.log(`\nCheck only: ${plan.length} game(s) ready. Nothing was sent.`);
  process.exit(0);
}

// --- Log in and push ---
function ask(question, hidden = false) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) {
    rl._writeToOutput = (s) => {
      if (s.startsWith(question)) rl.output.write(question);
      else if (!s.includes('\n')) rl.output.write('*');
    };
  }
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer);
    })
  );
}

const username = process.env.LIVE_ADMIN_USER || (await ask('Live admin username: '));
const password = process.env.LIVE_ADMIN_PASSWORD || (await ask('Live admin password: ', true));

const loginRes = await fetch(`${LIVE}/api/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
});
if (!loginRes.ok) {
  console.error('Login failed:', (await loginRes.json().catch(() => ({}))).error ?? loginRes.status);
  process.exit(1);
}
const cookie = loginRes.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');

let failed = 0;
for (const { gameId, label, lines, score } of plan) {
  try {
    const saved = await liveJson(`/api/games/${gameId}/boxscore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ lines }),
    });
    const after = await liveJson(`/api/games/${gameId}/boxscore`);
    const ok = sameLines(lines, after.lines) && `${saved.homeScore}-${saved.awayScore}` === score;
    console.log(`${ok ? '✓' : '✗'} ${label}: ${ok ? 'pushed and verified' : 'pushed, but live does not match local — check it'}`);
    if (!ok) failed++;
  } catch (err) {
    console.log(`✗ ${label}: ${err.message}`);
    failed++;
  }
}

await fetch(`${LIVE}/api/logout`, { method: 'POST', headers: { Cookie: cookie } });
console.log(failed ? `\n${failed} game(s) failed.` : `\nAll ${plan.length} game(s) pushed.`);
process.exit(failed ? 1 : 0);
