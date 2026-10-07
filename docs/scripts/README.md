# Scripts explained

A beginner-friendly walkthrough of every script in this project: the
`npm run ...` commands in `package.json`, each maintenance script in
`scripts/`, and a tour of the API server (`server/`). Each script
has its own page: **what it's for, when to run it, how to run it, what it
does line by line, and whether it can hurt your data.**

You don't need to read everything. Start with the table, and open a page
only when you need that script.

## Where to start

1. [Node basics](./node-basics.md): the handful of ideas (`import`,
   `await`, `.env`, `$1` placeholders, ...) that every script uses. Read
   this first if the code looks confusing.
2. [`npm run` commands](./npm-commands.md): starting the site and the API
   locally, and building for production.
3. The script you need, from the table below.

## At a glance

| Script | What it does | When you run it | Safety |
| --- | --- | --- | --- |
| [`npm run dev`](./npm-commands.md) | Starts the Vite dev server (the website) on port 5173 | Every time you work locally | Safe |
| [`npm run server`](./npm-commands.md) | Starts the API (`server/index.mjs`) on port 3001 | Every time you work locally | Safe |
| [`npm run build`](./npm-commands.md) | Turns `src/` into static files in `dist/` | Before deploying a frontend change | Safe |
| [`npm run preview`](./npm-commands.md) | Serves the built `dist/` locally to double-check a build | Optional, after `build` | Safe |
| [`scripts/db.mjs`](./db.md) | Not run directly. Shared database connection used by everything else | Never run on its own | Safe |
| [`scripts/test-db.mjs`](./test-db.md) | Checks that Node can reach Postgres | When the API can't connect and you want to know why | Safe (read-only) |
| [`scripts/run-schema.mjs`](./run-schema.md) | Creates all tables in an **empty** database | Once, when setting up a new database | Safe (fails if tables already exist) |
| [`scripts/create-user.mjs`](./create-user.md) | Creates an admin login, or resets its password | When someone new needs dashboard access | Safe |
| [Copy live data to your laptop](./copy-live-data.md) | Not a script: loads last night's backup into your local database with `pg_restore` | New computer, or to make local match live | ⚠️ **Replaces** your whole local database |
| [`scripts/push-boxscores.mjs`](./push-boxscores.md) | Copies box scores you entered and checked locally up to the live site | After entering games locally (run with `--check` first) | Safe (never replaces a live box score unless you add `--overwrite`) |
| [`scripts/backup.sh`](./backup.md) | Nightly backup of the live database and uploaded photos | Automatically every night, on the droplet | Safe (only deletes its own backups older than 14 days) |
| [`server/`](./server.md) | The API server: the one script that keeps running (entry point `server/index.mjs`) | Via `npm run server` locally, `pm2` in production | — |

> **Golden rule:** every script that touches the database uses whatever
> `DATABASE_URL` is in the `.env` file of the folder you run it from.
> On your laptop that's your local database; on the droplet it's
> production. Before running anything marked ⚠️, check which machine
> you're on.

None of the `scripts/` files run on their own. You run each one by hand in
a terminal, from the project root, and it exits when done.

## Common recipes

**Set up a new computer, or refresh local data from live**

Follow [Copy live data to your laptop](./copy-live-data.md): copy last
night's backup down with `scp`, then load it with `pg_restore`. Afterwards,
`node scripts/test-db.mjs` confirms the connection works.

**Day-to-day local development** (two terminals)

```
npm run server     # terminal 1: API on :3001
npm run dev        # terminal 2: website on :5173, open this one
```

**Give someone access to the live admin dashboard**: on the droplet, in
the project folder:

```
node scripts/create-user.mjs their-name "their-password"
```

## See also

- [`SERVER-FLOW.md`](../SERVER-FLOW.md): how a request travels through
  the API server, step by step, plus a table of every route
- [`APP-STRUCTURE.md`](../APP-STRUCTURE.md): what each folder is for, and
  what starts first
- [`BACKEND_SETUP.md`](../BACKEND_SETUP.md): why the backend exists, auth
  explained, and one request traced through every file
- [`DEPLOYING-CHANGES.md`](../DEPLOYING-CHANGES.md): shipping a change to
  production, and handling database schema changes safely
