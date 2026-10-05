// One-time migration: points teams.logo, teams.featured_photo and players.pic
// at the .webp versions of the images under public/. A path is only changed
// when the matching .webp file actually exists, so nothing can end up
// pointing at a missing image. Admin uploads (/uploads/...) are already
// .webp and are left alone. Safe to re-run.
// Usage: node scripts/migrate-images-to-webp.mjs          (dry run, shows changes)
//        node scripts/migrate-images-to-webp.mjs --apply  (writes them)
import { existsSync } from 'fs';
import { pool } from './db.mjs';

const apply = process.argv.includes('--apply');
const targets = [['teams', 'logo'], ['teams', 'featured_photo'], ['players', 'pic']];
let changed = 0, skipped = 0;

for (const [table, column] of targets) {
  const { rows } = await pool.query(
    `SELECT id, ${column} AS path FROM ${table} WHERE ${column} ~* '^\\s*/(logos|featured|player-photos)/.+\\.(png|jpe?g)\\s*$'`
  );
  for (const { id, path } of rows) {
    const next = path.trim().replace(/\.(png|jpe?g)$/i, '.webp');
    if (!existsSync(`public${next}`)) {
      console.log(`SKIP  ${table}.${column} [${id}] ${path} (no public${next})`);
      skipped++;
      continue;
    }
    console.log(`${apply ? 'SET ' : 'WOULD SET'}  ${table}.${column} [${id}] ${path} -> ${next}`);
    if (apply) await pool.query(`UPDATE ${table} SET ${column} = $1 WHERE id = $2`, [next, id]);
    changed++;
  }
}

console.log(`${apply ? 'Updated' : 'Would update'} ${changed} row(s), skipped ${skipped}.`);
if (!apply) console.log('Dry run only. Re-run with --apply to write the changes.');
await pool.end();
