// Read-only numbers computed from the data: player stats, standings, the
// playoff bracket, and the sitemap for search engines. No login needed.
import express from 'express';
import { pool } from '../../scripts/db.mjs';
import { buildStandings } from '../../src/utils/standings.js';
import { buildBracket, PHASES, phaseOfStage } from '../../src/utils/playoffs.js';
import { buildPlayerStats } from '../../src/utils/playerStats.js';

const router = express.Router();

// ?phase=elimination or ?phase=playoffs (play-in included) limits the stats
// to that part of the season. Without it, every game counts.
router.get('/api/player-stats', async (req, res) => {
  const { phase } = req.query;
  if (phase !== undefined && !PHASES.includes(phase)) {
    return res.status(400).json({ error: `phase must be one of: ${PHASES.join(', ')}` });
  }
  const result = await pool.query(`
    SELECT bl.player_id AS "playerId", bl.pts, bl.reb, bl.ast, bl.blk, bl.stl, bl.tpa, bl.tpm, bl.fta, bl.ftm, g.stage
    FROM boxscore_lines bl
    JOIN games g ON g.id = bl.game_id
  `);
  const lines = phase ? result.rows.filter((l) => phaseOfStage(l.stage) === phase) : result.rows;
  res.json(buildPlayerStats(lines));
});

// Everything standings and the playoff bracket are computed from.
async function loadStandingsInputs() {
  const teamsResult = await pool.query('SELECT id, name, color, ranked_last AS "rankedLast" FROM teams');
  const gamesResult = await pool.query(`
    SELECT
      id, date::text AS date, time, stage,
      home_team_id AS home, away_team_id AS away, status,
      home_score AS "homeScore", away_score AS "awayScore", winner
    FROM games
  `);
  return { teams: teamsResult.rows, games: gamesResult.rows };
}

router.get('/api/standings', async (req, res) => {
  const { teams, games } = await loadStandingsInputs();
  res.json(buildStandings(games, teams));
});

// The playoff bracket: seeded from the standings, advanced by playoff games.
router.get('/api/playoffs', async (req, res) => {
  const { teams, games } = await loadStandingsInputs();
  res.json(buildBracket(buildStandings(games, teams), games));
});

// sitemap.xml for search engines, built from the database so new teams,
// players and box scores show up without a rebuild. Nginx proxies
// /sitemap.xml here. Games are only listed once they have a box score —
// before that their page is empty.
const SITE_URL = 'https://cgyballers.gacs.me';
const STATIC_PAGES = ['/', '/schedule', '/standings', '/playoffs', '/players', '/teams'];

router.get('/sitemap.xml', async (req, res) => {
  const [teams, players, games] = await Promise.all([
    pool.query('SELECT id FROM teams ORDER BY id'),
    pool.query('SELECT id FROM players ORDER BY id'),
    pool.query(`
      SELECT g.id, g.date::text AS date FROM games g
      WHERE EXISTS (SELECT 1 FROM boxscore_lines bl WHERE bl.game_id = g.id)
      ORDER BY g.date, g.id
    `),
  ]);

  const url = (path, lastmod) =>
    `  <url><loc>${SITE_URL}${encodeURI(path)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
  const urls = [
    ...STATIC_PAGES.map((p) => url(p)),
    ...teams.rows.map((t) => url(`/teams/${t.id}`)),
    ...players.rows.map((p) => url(`/players/${p.id}`)),
    ...games.rows.map((g) => url(`/games/${g.id}`, g.date)),
  ];

  res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
  );
});

export default router;
