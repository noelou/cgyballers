# Node basics you'll see in every script

[← All scripts](./README.md)

The scripts are short, but they lean on a handful of Node/JavaScript ideas.
Once these make sense, every script page becomes readable.

## `.mjs` and `import`

The `.mjs` extension (and `"type": "module"` in `package.json`) means the
file uses **ES modules**, the modern `import x from 'y'` syntax instead of
the older `require('y')`.

```js
import pg from 'pg';                  // a package from node_modules/
import { pool } from './db.mjs';      // a file in this project (note the ./ and the extension)
import { readFile } from 'node:fs/promises';  // a built-in Node module (node: prefix)
```

## `await` at the top of a file

Talking to a database or reading a file takes time, so those functions
return a **Promise** (a "result coming later"). `await` pauses until the
result arrives. In `.mjs` files you can use `await` directly at the top
level, which is why the scripts read like simple top-to-bottom
instructions:

```js
const result = await pool.query('SELECT NOW()');   // wait for Postgres to answer
console.log(result.rows[0].now);                   // then use the answer
```

## `process.env` and `.env`

`process.env` holds **environment variables**, settings passed in from
outside the code. The `dotenv` package reads your `.env` file and copies
each line into `process.env`, so `DATABASE_URL=postgres://...` in `.env`
becomes `process.env.DATABASE_URL` in code. `.env` is in `.gitignore`, so
passwords never end up on GitHub. `.env.example` is the committed template.

| Variable | Used by | Meaning |
| --- | --- | --- |
| `DATABASE_URL` | every DB script + the server | Where Postgres is, plus the username/password to log in |
| `JWT_SECRET` | the server | Secret key used to sign login cookies. Anyone who knows it could forge a login |
| `API_PORT` | the server (optional) | Port to listen on; defaults to `3001` |
| `UPLOAD_DIR` | the server (optional) | Where uploaded player photos go; defaults to `./uploads` |
| `NODE_ENV` | the server | Set to `production` on the droplet so the login cookie requires HTTPS |

## `process.argv`: reading command-line arguments

When you run `node scripts/create-user.mjs alice secret123`,
`process.argv` is:

```js
['C:\\...\\node.exe', 'C:\\...\\create-user.mjs', 'alice', 'secret123']
//      [0]                    [1]                   [2]         [3]
```

So `const [, , username, password] = process.argv;` skips the first two
(the commas with nothing between them) and grabs your arguments.

## SQL placeholders: `$1`, `$2`, ...

```js
pool.query('SELECT * FROM users WHERE username = $1', [username]);
```

Values are **never** glued into the SQL string. They go in the array, and
Postgres fills in `$1`, `$2`, ... safely. This prevents **SQL
injection**, where a user types something like `'; DROP TABLE users; --`
into a form. Every query in this project follows this pattern; keep it
that way.

## `pool` vs `client`, and transactions

- A **pool** is a set of reusable database connections. `pool.query(...)`
  borrows one, runs one query, and gives it back. That's fine for single
  queries.
- When several queries must **all succeed or all fail together**, the code
  checks out one dedicated **client** and wraps the work in a
  **transaction**:

```js
const client = await pool.connect();   // take one connection for ourselves
try {
  await client.query('BEGIN');         // start: nothing is permanent yet
  // ... many queries ...
  await client.query('COMMIT');        // all good: make it permanent
} catch (err) {
  await client.query('ROLLBACK');      // something failed: undo everything since BEGIN
  throw err;
} finally {
  client.release();                    // always give the connection back
}
```

If the work crashes halfway through, a transaction means you get
**nothing** instead of half the data, which is much easier to recover
from. The server saves each box score this way, so a game never ends up
with only some of its players' lines saved.

## "Upsert": `ON CONFLICT ... DO UPDATE`

```sql
INSERT INTO teams (id, name) VALUES ($1, $2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
```

"Insert this row; if a row with that `id` already exists, update it
instead." `EXCLUDED` means "the values I was trying to insert." This makes
a script safe to run twice without creating duplicates, but it also means
it **overwrites** existing rows (that's how [`create-user.mjs`](./create-user.md)
resets a password).

## `pool.end()`

A script's last line is usually `await pool.end();`. An open database
connection keeps Node running, so without this the script would finish its
work and then just hang instead of returning you to the prompt.

## Run scripts from the project root

`dotenv` looks for `.env` in the **folder you're currently in**, not the
folder the script lives in. Always run scripts like this, from the
`cgyballers` folder:

```
node scripts/test-db.mjs
```

If you `cd scripts` first, `.env` won't be found, `DATABASE_URL` will be
empty, and you'll get a confusing connection error.
