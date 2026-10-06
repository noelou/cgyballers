# `scripts/migrate-add-game-stage.mjs`: add the `stage` column to games

[← All scripts](./README.md)

```js
import { pool } from './db.mjs';

await pool.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'elimination'`);
console.log('games.stage column is in place.');
await pool.end();
```

**What it's for:** when the playoffs were added, every game needed a
`stage` so the site can tell playoff games apart from elimination-round
games. This adds that column to a database that was created before then.

This kind of script is called a **migration**: a one-time change to the
shape of a database that already has data in it.

- **`ALTER TABLE games ADD COLUMN`** adds a new column to the existing
  `games` table without touching the rows already in it.
- **`DEFAULT 'elimination'`** fills the new column for every existing game,
  since they were all elimination games.
- **`IF NOT EXISTS`** makes it do nothing if the column is already there.

**When to run:** almost never. It was a one-time step for the live
database when playoffs shipped, and `db/schema.sql` includes `stage`, so a database made with
[`run-schema.mjs`](./run-schema.md) already has it. You'd only need it for an
old local database created before the playoffs were added. If the site
complains that `column "stage" does not exist`, run this.

**How to run:** `node scripts/migrate-add-game-stage.mjs`

**Safety:** safe to run any number of times. It only adds a column and
never changes or deletes data.
