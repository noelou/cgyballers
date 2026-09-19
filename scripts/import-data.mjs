import { readFile, readdir } from 'node:fs/promises';
import { pool } from './db.mjs';

const dataDir = new URL('../src/data/', import.meta.url);
const readJson = (name) => readFile(new URL(name, dataDir), 'utf-8').then(JSON.parse);

const teams = await readJson('teams.json');
const players = await readJson('players.json');
const games = await readJson('schedule.json');
const news = await readJson('news.json');

const boxscoreDir = new URL('boxscores/', dataDir);
const boxscoreFiles = (await readdir(boxscoreDir)).filter((f) => f.endsWith('.json'));
const boxscores = await Promise.all(
  boxscoreFiles.map((f) => readFile(new URL(f, boxscoreDir), 'utf-8').then(JSON.parse))
);

const client = await pool.connect();

try {
  await client.query('BEGIN');

  for (const t of teams) {
    await client.query(
      `INSERT INTO teams (id, name, color, logo, venue)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, color = EXCLUDED.color, logo = EXCLUDED.logo, venue = EXCLUDED.venue`,
      [t.id, t.name, t.color, t.logo, t.venue]
    );
  }
  console.log(`Imported ${teams.length} teams.`);

  for (const p of players) {
    await client.query(
      `INSERT INTO players
         (id, team_id, name, number, position, position_label, height_cm, height_display, weight_kg, age, experience, pic)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         team_id = EXCLUDED.team_id, name = EXCLUDED.name, number = EXCLUDED.number,
         position = EXCLUDED.position, position_label = EXCLUDED.position_label,
         height_cm = EXCLUDED.height_cm, height_display = EXCLUDED.height_display,
         weight_kg = EXCLUDED.weight_kg, age = EXCLUDED.age,
         experience = EXCLUDED.experience, pic = EXCLUDED.pic`,
      [
        p.id, p.team, p.name, p.number, p.position, p.positionLabel,
        p.heightCm, p.heightDisplay, p.weightKg, p.age, p.experience, p.pic,
      ]
    );
  }
  console.log(`Imported ${players.length} players.`);

  for (const g of games) {
    await client.query(
      `INSERT INTO games (id, date, time, venue, home_team_id, away_team_id, status, home_score, away_score, winner)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         date = EXCLUDED.date, time = EXCLUDED.time, venue = EXCLUDED.venue,
         home_team_id = EXCLUDED.home_team_id, away_team_id = EXCLUDED.away_team_id,
         status = EXCLUDED.status, home_score = EXCLUDED.home_score, away_score = EXCLUDED.away_score,
         winner = EXCLUDED.winner`,
      [g.id, g.date, g.time, g.venue, g.home, g.away, g.status, g.homeScore, g.awayScore, g.winner ?? null]
    );
  }
  console.log(`Imported ${games.length} games.`);

  let lineCount = 0;
  for (const b of boxscores) {
    await client.query(`UPDATE games SET boxscore_source = $1 WHERE id = $2`, [b.source, b.gameId]);

    for (const [playerId, s] of Object.entries(b.lines)) {
      await client.query(
        `INSERT INTO boxscore_lines (game_id, player_id, pts, reb, ast, blk, stl, tpa, tpm, fta, ftm)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (game_id, player_id) DO UPDATE SET
           pts = EXCLUDED.pts, reb = EXCLUDED.reb, ast = EXCLUDED.ast, blk = EXCLUDED.blk,
           stl = EXCLUDED.stl, tpa = EXCLUDED.tpa, tpm = EXCLUDED.tpm, fta = EXCLUDED.fta, ftm = EXCLUDED.ftm`,
        [b.gameId, playerId, s.pts, s.reb, s.ast, s.blk, s.stl, s.tpa, s.tpm, s.fta, s.ftm]
      );
      lineCount++;
    }
  }
  console.log(`Imported ${boxscores.length} boxscores (${lineCount} player lines).`);

  for (const n of news) {
    await client.query(
      `INSERT INTO news (id, title, date, excerpt, body, tag)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title, date = EXCLUDED.date, excerpt = EXCLUDED.excerpt,
         body = EXCLUDED.body, tag = EXCLUDED.tag`,
      [n.id, n.title, n.date, n.excerpt, n.body, n.tag]
    );
  }
  console.log(`Imported ${news.length} news items.`);

  await client.query('COMMIT');
  console.log('Done.');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
  await pool.end();
}
