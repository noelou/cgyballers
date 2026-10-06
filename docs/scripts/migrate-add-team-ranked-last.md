# `scripts/migrate-add-team-ranked-last.mjs`: add the `ranked_last` column to teams

[← All scripts](./README.md)

```js
import { pool } from './db.mjs';

await pool.query(`ALTER TABLE teams ADD COLUMN IF NOT EXISTS ranked_last boolean NOT NULL DEFAULT false`);
console.log('teams.ranked_last column is in place.');
await pool.end();
```

**What it's for:** the league can rule a team to the bottom of the
standings (for example, for backing out of a game). That setting is stored
in `teams.ranked_last` and switched on in **Admin → Edit Team**. This
script adds that column to a database that was created before the feature
existed.

It works the same way as
[`migrate-add-game-stage.mjs`](./migrate-add-game-stage.md):

- **`ALTER TABLE teams ADD COLUMN`** adds the column without touching the
  existing teams.
- **`boolean ... DEFAULT false`** means every existing team starts as
  "not ranked last" (`boolean` is a true/false column).
- **`IF NOT EXISTS`** makes it do nothing if the column is already there.

**When to run:** almost never. It was a one-time step for the live
database when the feature shipped, and `db/schema.sql` includes `ranked_last`, so a database made
with [`run-schema.mjs`](./run-schema.md) already has it. Only an old local
database needs it. If the site complains that
`column "ranked_last" does not exist`, run this.

**How to run:** `node scripts/migrate-add-team-ranked-last.mjs`

**Safety:** safe to run any number of times. It only adds a column and
never changes or deletes data.
