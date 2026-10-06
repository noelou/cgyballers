# `scripts/db.mjs`: the shared database connection

[← All scripts](./README.md)

```js
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();                      // 1. load .env into process.env

export const pool = new pg.Pool({     // 2. create a connection pool...
  connectionString: process.env.DATABASE_URL,   // ...pointed at DATABASE_URL
});
```

**What it's for:** every other script, and the API server, imports `pool`
from here. That puts the "how do we connect to Postgres" logic in exactly
one place.

**How to run:** you don't. Other files `import { pool } from './db.mjs'`.

**Why it's in `scripts/` and not somewhere like `server/`:** it was written
first, for the scripts, and the server reused it later. The folder name is
historical; it's used by both.

**Note:** creating a `Pool` doesn't connect yet. The first `pool.query(...)`
does. So a wrong password shows up as an error on that first query, not on
this line.
