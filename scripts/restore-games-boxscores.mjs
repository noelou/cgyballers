// One-off helper: reload local `games`/`boxscore_lines` from a prod pg_dump.
// Usage: node scripts/restore-games-boxscores.mjs prod_games_boxscores.sql
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { Client } from 'pg'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/restore-games-boxscores.mjs <dump-file.sql>')
  process.exit(1)
}

// Strip psql-only meta-commands (e.g. \restrict/\unrestrict from pg16+
// pg_dump) that node-pg can't execute as raw SQL.
const sql = readFileSync(file, 'utf8')
  .split('\n')
  .filter((line) => !line.startsWith('\\'))
  .join('\n')

const client = new Client({ connectionString: process.env.DATABASE_URL })
await client.connect()
try {
  await client.query('BEGIN')
  await client.query('TRUNCATE games, boxscore_lines RESTART IDENTITY CASCADE')
  await client.query(sql)
  await client.query('COMMIT')
  console.log('Restored games + boxscore_lines from', file)
} catch (err) {
  await client.query('ROLLBACK')
  console.error('Restore failed, rolled back:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
