# `scripts/run-schema.mjs`: create the tables

[← All scripts](./README.md)

```js
import { readFile } from 'node:fs/promises';
import { pool } from './db.mjs';

// read db/schema.sql as one big string (path is relative to THIS file)
const sql = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf-8');

await pool.query(sql);            // send the whole file to Postgres in one go
console.log('Schema applied.');

await pool.end();
```

**What it's for:** turning an empty database into one with all the tables
(`teams`, `players`, `games`, `boxscore_lines`, `users`, `sessions`, `news`). The table
definitions themselves live in `db/schema.sql`; this script only sends that
file to Postgres.

**When to run:** once, on a brand-new empty database (a new laptop, or the
first time setting up the droplet).

**How to run:** `node scripts/run-schema.mjs`

**About `new URL('../db/schema.sql', import.meta.url)`:** `import.meta.url`
is "the location of this script file," so the path is resolved relative to
`scripts/`, not to wherever your terminal is. This is the reliable way to
reference a file next to your code.

**Safety:** `schema.sql` uses plain `CREATE TABLE`, so on a database that
already has tables it fails immediately with
`relation "teams" already exists` and changes nothing. It can't wipe data.
Changing the schema of a database that already has data is a different job;
see "Database schema changes" in [`DEPLOYING-CHANGES.md`](../DEPLOYING-CHANGES.md).
