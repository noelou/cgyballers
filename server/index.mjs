import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from '../scripts/db.mjs';
import { buildStandings } from '../src/utils/standings.js';
import { buildPlayerStats } from '../src/utils/playerStats.js';

const app = express();
// credentials: true is required for the browser to send/receive the login
// cookie — without it, fetch() silently drops it.
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

const COOKIE_NAME = 'cgyballers_session';

// Attach this to any route that should require being logged in.
// It reads the cookie set at login, checks it's a real, un-tampered-with
// token (jwt.verify), and only then lets the request continue.
export function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  const user = result.rows[0];

  const valid = user && (await bcrypt.compare(password, user.password_hash));
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign({ sub: user.id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // JavaScript in the browser can't read this cookie — only the browser sends it automatically
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production', // only require HTTPS once deployed
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ username: user.username });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

// Lets the Vue app ask "am I logged in?" on page load.
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ username: req.user.username });
});

// Proof of concept: teams, shaped the same way teams.json is,
// so the Vue side barely has to change.
app.get('/api/teams', async (req, res) => {
  const result = await pool.query(`
    SELECT
      t.id, t.name, t.color, t.logo, t.venue,
      COALESCE(array_agg(p.id ORDER BY p.id) FILTER (WHERE p.id IS NOT NULL), '{}') AS "playerIds"
    FROM teams t
    LEFT JOIN players p ON p.team_id = t.id
    GROUP BY t.id
    ORDER BY t.name
  `);
  res.json(result.rows);
});

// New teams get an id from their name, e.g. "River Kings" -> "river-kings".
// If that id is already taken, -2, -3, ... is appended until it's unique.
async function generateTeamId(name) {
  const base = slugify(name);
  let id = base;
  let n = 2;
  while (true) {
    const existing = await pool.query('SELECT 1 FROM teams WHERE id = $1', [id]);
    if (existing.rows.length === 0) return id;
    id = `${base}-${n}`;
    n++;
  }
}

// Creates a new team. Requires login.
app.post('/api/teams', requireAuth, async (req, res) => {
  const { name, color, logo, venue } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const id = await generateTeamId(name);
  await pool.query('INSERT INTO teams (id, name, color, logo, venue) VALUES ($1, $2, $3, $4, $5)', [
    id,
    name,
    color || null,
    logo || null,
    venue || null,
  ]);

  res.status(201).json({ id });
});

// Edits an existing team (its id never changes, even if the name does —
// same as editing a player). Requires login.
app.put('/api/teams/:teamId', requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const { name, color, logo, venue } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const result = await pool.query(
    'UPDATE teams SET name = $1, color = $2, logo = $3, venue = $4 WHERE id = $5 RETURNING id',
    [name, color || null, logo || null, venue || null, teamId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Team not found' });
  res.json({ id: teamId });
});

app.get('/api/players', async (req, res) => {
  const result = await pool.query(`
    SELECT
      p.id, p.name, p.team_id AS team, t.name AS "teamName",
      p.number, p.position, p.position_label AS "positionLabel",
      p.height_cm AS "heightCm", p.height_display AS "heightDisplay",
      p.weight_kg AS "weightKg", p.age, p.experience, p.pic
    FROM players p
    JOIN teams t ON t.id = p.team_id
    ORDER BY p.name
  `);
  res.json(result.rows);
});

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// New players get an id in the same style as the existing data,
// e.g. team "grit" + name "Dela Cruz" -> "grit-dela-cruz". If that id is
// already taken (e.g. two players with the same last name), -2, -3, ... is
// appended until it's unique.
async function generatePlayerId(team, name) {
  const base = `${team}-${slugify(name)}`;
  let id = base;
  let n = 2;
  while (true) {
    const existing = await pool.query('SELECT 1 FROM players WHERE id = $1', [id]);
    if (existing.rows.length === 0) return id;
    id = `${base}-${n}`;
    n++;
  }
}

// Creates a new player on a team's roster. Requires login.
app.post('/api/players', requireAuth, async (req, res) => {
  const { team, name, number, position, positionLabel, heightCm, heightDisplay, weightKg, age, experience, pic } =
    req.body;

  if (!team || !name) {
    return res.status(400).json({ error: 'team and name are required' });
  }

  const teamExists = await pool.query('SELECT 1 FROM teams WHERE id = $1', [team]);
  if (teamExists.rows.length === 0) return res.status(400).json({ error: 'Unknown team' });

  const id = await generatePlayerId(team, name);

  await pool.query(
    `INSERT INTO players
       (id, team_id, name, number, position, position_label, height_cm, height_display, weight_kg, age, experience, pic)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [id, team, name, number || null, position || null, positionLabel || null, heightCm || null, heightDisplay || null, weightKg || null, age || null, experience || null, pic || null]
  );

  res.status(201).json({ id });
});

// Edits an existing player. Requires login.
app.put('/api/players/:playerId', requireAuth, async (req, res) => {
  const { playerId } = req.params;
  const { team, name, number, position, positionLabel, heightCm, heightDisplay, weightKg, age, experience, pic } =
    req.body;

  if (!team || !name) {
    return res.status(400).json({ error: 'team and name are required' });
  }

  const result = await pool.query(
    `UPDATE players SET
       team_id = $1, name = $2, number = $3, position = $4, position_label = $5,
       height_cm = $6, height_display = $7, weight_kg = $8, age = $9, experience = $10, pic = $11
     WHERE id = $12
     RETURNING id`,
    [team, name, number || null, position || null, positionLabel || null, heightCm || null, heightDisplay || null, weightKg || null, age || null, experience || null, pic || null, playerId]
  );

  if (result.rows.length === 0) return res.status(404).json({ error: 'Player not found' });
  res.json({ id: playerId });
});

app.get('/api/games', async (req, res) => {
  const result = await pool.query(`
    SELECT
      g.id, g.date::text AS date, g.time, g.venue,
      g.home_team_id AS home, ht.name AS "homeName",
      g.away_team_id AS away, at.name AS "awayName",
      g.status, g.home_score AS "homeScore", g.away_score AS "awayScore",
      g.winner,
      EXISTS (SELECT 1 FROM boxscore_lines bl WHERE bl.game_id = g.id) AS "hasBoxscore"
    FROM games g
    JOIN teams ht ON ht.id = g.home_team_id
    JOIN teams at ON at.id = g.away_team_id
    ORDER BY g.date, g.time
  `);
  res.json(result.rows);
});

// New games get an id in the same style as the existing data (g1, g2, ...),
// continuing after the highest existing number.
async function generateGameId() {
  const result = await pool.query(
    `SELECT COALESCE(MAX((substring(id from 2))::int), 0) + 1 AS next FROM games WHERE id ~ '^g[0-9]+$'`
  );
  return `g${result.rows[0].next}`;
}

// Adds a brand-new game to the schedule. Requires login.
app.post('/api/games', requireAuth, async (req, res) => {
  const { date, time, venue, home, away } = req.body;

  if (!date || !time || !home || !away) {
    return res.status(400).json({ error: 'date, time, home, and away are required' });
  }
  if (home === away) {
    return res.status(400).json({ error: 'home and away must be different teams' });
  }

  const teamsResult = await pool.query('SELECT id FROM teams WHERE id IN ($1, $2)', [home, away]);
  if (teamsResult.rows.length !== 2) {
    return res.status(400).json({ error: 'Unknown team' });
  }

  const id = await generateGameId();
  await pool.query(
    `INSERT INTO games (id, date, time, venue, home_team_id, away_team_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')`,
    [id, date, time, venue || null, home, away]
  );

  res.status(201).json({ id });
});

// Removes a game from the schedule. Any box score for it is removed too
// (boxscore_lines cascades on games.id).
app.delete('/api/games/:gameId', requireAuth, async (req, res) => {
  const { gameId } = req.params;
  const result = await pool.query('DELETE FROM games WHERE id = $1 RETURNING id', [gameId]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Game not found' });
  res.status(204).end();
});

app.get('/api/player-stats', async (req, res) => {
  const result = await pool.query(`
    SELECT player_id AS "playerId", pts, reb, ast, blk, stl, tpa, tpm, fta, ftm
    FROM boxscore_lines
  `);
  res.json(buildPlayerStats(result.rows));
});

const VALID_STATUSES = ['scheduled', 'final', 'forfeit', 'cancelled'];

// Directly sets a game's status/score/winner — for forfeits, cancellations,
// or correcting a score without re-entering the whole box score. Requires login.
app.put('/api/games/:gameId/status', requireAuth, async (req, res) => {
  const { gameId } = req.params;
  const { status, homeScore, awayScore, winner } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const gameResult = await pool.query('SELECT home_team_id AS home, away_team_id AS away FROM games WHERE id = $1', [
    gameId,
  ]);
  const game = gameResult.rows[0];
  if (!game) return res.status(404).json({ error: 'Game not found' });

  if (status === 'forfeit' && winner !== game.home && winner !== game.away) {
    return res.status(400).json({ error: 'winner must be the home or away team for a forfeit' });
  }

  // Each status only keeps the fields that make sense for it — e.g. a
  // cancelled game has no score, a forfeit has a winner but no score.
  const isFinal = status === 'final';
  const isForfeit = status === 'forfeit';

  const result = await pool.query(
    `UPDATE games SET status = $1, home_score = $2, away_score = $3, winner = $4 WHERE id = $5 RETURNING id`,
    [status, isFinal ? homeScore : null, isFinal ? awayScore : null, isForfeit ? winner : null, gameId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Game not found' });

  res.json({ ok: true });
});

app.get('/api/standings', async (req, res) => {
  const teamsResult = await pool.query('SELECT id, name, color FROM teams');
  const gamesResult = await pool.query(`
    SELECT
      home_team_id AS home, away_team_id AS away, status,
      home_score AS "homeScore", away_score AS "awayScore", winner
    FROM games
  `);
  res.json(buildStandings(gamesResult.rows, teamsResult.rows));
});

// Everything a box-score entry form needs for one game: the game itself,
// both rosters, and any stat lines already saved (so re-opening a game you
// already scored pre-fills the form instead of starting blank).
app.get('/api/games/:gameId/boxscore', async (req, res) => {
  const { gameId } = req.params;

  const gameResult = await pool.query(
    `SELECT g.id, g.date::text AS date, g.time, g.venue,
            g.home_team_id AS home, ht.name AS "homeName",
            g.away_team_id AS away, at.name AS "awayName", g.status,
            g.home_score AS "homeScore", g.away_score AS "awayScore"
     FROM games g
     JOIN teams ht ON ht.id = g.home_team_id
     JOIN teams at ON at.id = g.away_team_id
     WHERE g.id = $1`,
    [gameId]
  );
  const game = gameResult.rows[0];
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const rosterResult = await pool.query(
    `SELECT id, name, number, team_id AS team FROM players
     WHERE team_id IN ($1, $2) ORDER BY team_id, number`,
    [game.home, game.away]
  );

  const linesResult = await pool.query(
    `SELECT player_id AS "playerId", pts, reb, ast, blk, stl, tpa, tpm, fta, ftm
     FROM boxscore_lines WHERE game_id = $1`,
    [gameId]
  );

  res.json({
    game,
    homeRoster: rosterResult.rows.filter((p) => p.team === game.home),
    awayRoster: rosterResult.rows.filter((p) => p.team === game.away),
    lines: Object.fromEntries(linesResult.rows.map(({ playerId, ...line }) => [playerId, line])),
  });
});

// Saves every player's stat line for a game, then derives the final score
// from the points entered and marks the game "final". Requires login.
app.post('/api/games/:gameId/boxscore', requireAuth, async (req, res) => {
  const { gameId } = req.params;
  const { lines } = req.body;

  const gameResult = await pool.query('SELECT home_team_id AS home, away_team_id AS away FROM games WHERE id = $1', [
    gameId,
  ]);
  const game = gameResult.rows[0];
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const rosterResult = await pool.query('SELECT id, team_id AS team FROM players WHERE team_id IN ($1, $2)', [
    game.home,
    game.away,
  ]);
  const teamOf = Object.fromEntries(rosterResult.rows.map((p) => [p.id, p.team]));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let homeScore = 0;
    let awayScore = 0;

    for (const [playerId, s] of Object.entries(lines)) {
      const pts = Number(s.pts) || 0;
      if (teamOf[playerId] === game.home) homeScore += pts;
      if (teamOf[playerId] === game.away) awayScore += pts;

      await client.query(
        `INSERT INTO boxscore_lines (game_id, player_id, pts, reb, ast, blk, stl, tpa, tpm, fta, ftm)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (game_id, player_id) DO UPDATE SET
           pts = EXCLUDED.pts, reb = EXCLUDED.reb, ast = EXCLUDED.ast, blk = EXCLUDED.blk,
           stl = EXCLUDED.stl, tpa = EXCLUDED.tpa, tpm = EXCLUDED.tpm, fta = EXCLUDED.fta, ftm = EXCLUDED.ftm`,
        [gameId, playerId, pts, s.reb || 0, s.ast || 0, s.blk || 0, s.stl || 0, s.tpa || 0, s.tpm || 0, s.fta || 0, s.ftm || 0]
      );
    }

    await client.query(
      `UPDATE games SET status = 'final', home_score = $1, away_score = $2 WHERE id = $3`,
      [homeScore, awayScore, gameId]
    );

    await client.query('COMMIT');
    res.json({ homeScore, awayScore });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

const port = process.env.API_PORT || 3001;
app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
