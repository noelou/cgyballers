# `scripts/restore-games-boxscores.mjs`: copy production's games into your local DB ⚠️

[← All scripts](./README.md)

**What it's for:** your local database and production are separate. Scores
entered on the live site don't appear locally. This script loads a
production export of the `games` and `boxscore_lines` tables into your
local database so local looks like live.

**When to run:** you want to develop against real, current scores.

**How to run:** two steps.

1. On the droplet, export just those two tables' data to a file:
   ```
   pg_dump --data-only -t games -t boxscore_lines <prod-connection> > prod_games_boxscores.sql
   ```
   Then copy that file to your laptop (for example with `scp`).
2. On your laptop, from the project root:
   ```
   node scripts/restore-games-boxscores.mjs prod_games_boxscores.sql
   ```

**What it does:**

```js
import 'dotenv/config'               // shorthand for dotenv.config()
import { readFileSync } from 'node:fs'
import { Client } from 'pg'          // a single connection, not a pool

const file = process.argv[2]         // the dump file you passed in
if (!file) { /* print usage, exit */ }

// pg_dump output contains a few lines starting with "\" (e.g. \restrict)
// that only the psql command-line tool understands. Drop them so node-pg
// can run the rest as plain SQL.
const sql = readFileSync(file, 'utf8')
  .split('\n')
  .filter((line) => !line.startsWith('\\'))
  .join('\n')

const client = new Client({ connectionString: process.env.DATABASE_URL })
await client.connect()
try {
  await client.query('BEGIN')
  await client.query('TRUNCATE games, boxscore_lines RESTART IDENTITY CASCADE')  // empty both tables
  await client.query(sql)                                                        // load prod's rows
  await client.query('COMMIT')
} catch (err) {
  await client.query('ROLLBACK')     // any error: local DB goes back to how it was
  ...
} finally {
  await client.end()
}
```

- **`TRUNCATE`** empties a table instantly. `RESTART IDENTITY` resets the
  auto-numbering `id` in `boxscore_lines` back to 1 so it matches prod's
  numbers. `CASCADE` also clears anything that depends on these tables.
- Because it's in a transaction, a bad dump file doesn't leave you with
  empty tables. The `TRUNCATE` is rolled back too.
- It uses a plain `Client` instead of `db.mjs`'s `pool` because it only
  ever needs one connection. Either would work.

**⚠️ Safety:** it **deletes every game and box score** in whatever database
`DATABASE_URL` points to, then refills them from the file. On your laptop
that's the point. **Never run it on the droplet**, where it would replace
live data with whatever is in the file. It only touches `games` and
`boxscore_lines`. Teams and players must already exist locally, or the
insert fails on the foreign keys and everything rolls back safely.
