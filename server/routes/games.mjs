// Games: the schedule, game status, and box scores.
import express from 'express';
import { pool } from '../../scripts/db.mjs';
import { STAGES } from '../../src/utils/playoffs.js';
import { requireAuth } from '../auth.mjs';

const router = express.Router();

router.get('/api/games', async (req, res) => {
  const result = await pool.query(`
    SELECT
      g.id, g.date::text AS date, g.time, g.venue,
      g.home_team_id AS home, ht.name AS "homeName",
      g.away_team_id AS away, at.name AS "awayName",
      g.status, g.home_score AS "homeScore", g.away_score AS "awayScore",
      g.winner, g.stage,
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
router.post('/api/games', requireAuth, async (req, res) => {
  const { date, time, venue, home, away, stage = 'elimination' } = req.body;

  if (!date || !time || !home || !away) {
    return res.status(400).json({ error: 'date, time, home, and away are required' });
  }
  if (!STAGES.includes(stage)) {
    return res.status(400).json({ error: `stage must be one of: ${STAGES.join(', ')}` });
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
    `INSERT INTO games (id, date, time, venue, home_team_id, away_team_id, status, stage)
     VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', $7)`,
    [id, date, time, venue || null, home, away, stage]
  );

  res.status(201).json({ id });
});

// Removes a game from the schedule. Any box score for it is removed too
// (boxscore_lines cascades on games.id).
router.delete('/api/games/:gameId', requireAuth, async (req, res) => {
  const { gameId } = req.params;
  const result = await pool.query('DELETE FROM games WHERE id = $1 RETURNING id', [gameId]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Game not found' });
  res.status(204).end();
});

const VALID_STATUSES = ['scheduled', 'final', 'forfeit', 'cancelled'];

// Directly sets a game's status/score/winner — for forfeits, cancellations,
// or correcting a score without re-entering the whole box score. Requires login.
router.put('/api/games/:gameId/status', requireAuth, async (req, res) => {
  const { gameId } = req.params;
  const { status, homeScore, awayScore, winner, stage } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  if (stage !== undefined && !STAGES.includes(stage)) {
    return res.status(400).json({ error: `stage must be one of: ${STAGES.join(', ')}` });
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
    `UPDATE games SET status = $1, home_score = $2, away_score = $3, winner = $4, stage = COALESCE($6, stage)
     WHERE id = $5 RETURNING id`,
    [status, isFinal ? homeScore : null, isFinal ? awayScore : null, isForfeit ? winner : null, gameId, stage ?? null]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Game not found' });

  res.json({ ok: true });
});

// Everything a box-score entry form needs for one game: the game itself,
// both rosters, and any stat lines already saved (so re-opening a game you
// already scored pre-fills the form instead of starting blank).
router.get('/api/games/:gameId/boxscore', async (req, res) => {
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
router.post('/api/games/:gameId/boxscore', requireAuth, async (req, res) => {
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

export default router;
