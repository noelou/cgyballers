// One-time migration: adds games.stage so playoff games can be told apart
// from elimination-round games. Safe to re-run (IF NOT EXISTS); existing
// games all default to 'elimination'.
// Usage: node scripts/migrate-add-game-stage.mjs
import { pool } from './db.mjs';

await pool.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'elimination'`);
console.log('games.stage column is in place.');
await pool.end();
