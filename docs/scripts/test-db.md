# `scripts/test-db.mjs`: "can Node reach the database?"

[← All scripts](./README.md)

```js
import { pool } from './db.mjs';

const result = await pool.query('SELECT NOW()');       // ask Postgres for its clock
console.log('Connected. Server time:', result.rows[0].now);
await pool.end();
```

**What it's for:** the smallest possible check that `.env` is right and
Postgres is running. `SELECT NOW()` touches no tables, so it works even on
an empty database.

**When to run:** the API logs a database error and you're not sure whether
it's the code or the connection.

**How to run:** `node scripts/test-db.mjs`

| You see | It means |
| --- | --- |
| `Connected. Server time: ...` | Connection is fine. The problem is elsewhere |
| `password authentication failed` | Wrong password in `DATABASE_URL` |
| `ECONNREFUSED` | Postgres isn't running, or wrong host/port |
| `database "cgyballers" does not exist` | Create the database in pgAdmin first |
| `SASL: ... client password must be a string` | `DATABASE_URL` is empty, usually because you're not in the project root |

**Safety:** read-only. Run it as often as you like.
