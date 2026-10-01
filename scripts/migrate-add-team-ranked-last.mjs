// One-time migration: adds teams.ranked_last so the league can rule a team
// to the bottom of the standings (e.g. for backing out of a game). Safe to
// re-run (IF NOT EXISTS); existing teams all default to false.
// Usage: node scripts/migrate-add-team-ranked-last.mjs
import { pool } from './db.mjs';

await pool.query(`ALTER TABLE teams ADD COLUMN IF NOT EXISTS ranked_last boolean NOT NULL DEFAULT false`);
console.log('teams.ranked_last column is in place.');
await pool.end();
