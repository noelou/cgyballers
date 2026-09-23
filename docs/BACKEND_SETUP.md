# CGYBallers Backend Setup Guide

A beginner-friendly walkthrough of how CGYBallers moved from static JSON files to a real Postgres database, a Node.js/Express API, and an admin dashboard with login. Written for someone new to backend development, as of September 20, 2026.

## Why we moved off JSON files

CGYBallers used to store everything as static JSON files inside the project (`teams.json`, `players.json`, `schedule.json`, one file per box score). Every update — a new score, a new player, a roster change — meant hand-editing those files directly, which is slow and easy to get wrong (one misplaced comma breaks the whole file).

We moved that data into **PostgreSQL**, a real database, and built a small **API server** in between it and the website. Now the site reads live data from the database instead of bundled files, and there's an admin dashboard where scores and rosters can be entered through forms instead of by hand.

|  | Before (JSON files) | Now (Postgres + API) |
| --- | --- | --- |
| Where data lives | Files inside the project | A database, separate from the website code |
| How you update it | Edit a file's text directly | Fill out a form in the admin dashboard |
| Who can update it | Only someone editing code | Anyone given a login |
| Risk of a typo breaking the site | High (one bad character breaks the file) | Low (forms validate input) |

## Backend terms, explained plainly

A quick glossary for the words used throughout this doc.

| Term | What it means here |
| --- | --- |
| **Database** | Where the actual data lives, organized into tables (like spreadsheets). We use PostgreSQL. |
| **Table** | One kind of record, e.g. `teams`, `players`, `games`. Each row is one team, one player, one game. |
| **Server** | A program that stays running and answers requests. Ours is `server/index.mjs`, built with Node.js. |
| **API** | "Application Programming Interface" — the set of URLs the server exposes so other code (the website) can ask it for data or tell it to change something. |
| **Endpoint** | One specific URL the API responds to, e.g. `/api/teams`. Each endpoint does one job. |
| **`fetch`** | A built-in browser function for calling a URL and getting a response back. This is how the Vue app talks to the API. |
| **Query** | A command sent to the database asking it to read or change data, written in SQL (e.g. `SELECT * FROM teams`). |
| **Schema** | The blueprint of a database — which tables exist and what columns each one has. |
| **Environment variable / `.env`** | A private settings file (passwords, secret keys) that's never committed to code, so secrets don't leak. |

The shape of the whole system:

```mermaid
flowchart LR
  A[Vue app in the browser] -->|fetch| B[Express API server]
  B -->|SQL query| C[(PostgreSQL database)]
  C -->|rows| B
  B -->|JSON| A
```

## Setting up PostgreSQL

1. Installed PostgreSQL locally on Windows (via the official installer), which includes **pgAdmin**, a graphical tool for browsing databases without writing commands by hand.
2. During install, set a password for the default `postgres` user — this is the same password later used in the connection string.
3. In pgAdmin, created a new, empty database named `cgyballers`. At this point it had no tables yet — just an empty container.

## Connecting Node.js to Postgres

To let JavaScript code talk to Postgres, we added two packages:

- **`pg`** — the actual database driver, the code that knows how to speak Postgres's protocol
- **`dotenv`** — loads settings from a `.env` file into the running program

The connection details (username, password, host, port, database name) live in a `.env` file, **not** in the code itself — that file is listed in `.gitignore` so it's never committed or shared:

```
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/cgyballers
```

A small reusable module, `scripts/db.mjs`, reads that URL and creates a connection pool:

```js
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})
```

Every other script and the API server import `pool` from this one file, so the connection logic only exists in one place.

## Building the tables

The table structure is written once as plain SQL in `db/schema.sql`, then run against the empty database to create everything. Five tables, matching the shape of the old JSON files:

| Table | What it holds | Notes |
| --- | --- | --- |
| `teams` | id, name, color, logo, venue | id is a readable slug, e.g. `jacque-jons` |
| `players` | id, team, name, number, position, height, weight, age, experience, photo | id is `team-lastname`, e.g. `grit-dela-cruz` |
| `games` | id, date, time, venue, home/away teams, status, scores, winner | id is `g1`, `g2`, ... |
| `boxscore_lines` | one row per player per game: pts, reb, ast, blk, stl, 3PA/3PM, FTA/FTM | replaces the old per-game JSON files |
| `news` | id, title, date, excerpt, body, tag | currently unused on the live site |

A sixth table, `users`, was added later for admin logins (see the Login section below).

A key idea for a beginner: most ids here are **natural keys** — readable slugs like `grit` or `g1` — rather than random database-generated numbers, because they're already unique, stable, and used as references elsewhere (a player's `team` field points at a team's id). The one exception is `users`, which gets a plain auto-incrementing `id`, since a username isn't guaranteed to stay the same the way a slug is.

Tables also reference each other with **foreign keys** — e.g. every `players.team` value must match a real row in `teams`. This is what stops a player from ever pointing at a team that doesn't exist.

## Importing the existing JSON into Postgres

Once the empty tables existed, `scripts/import-data.mjs` moved the real data in:

1. Reads every existing JSON file (`teams.json`, `players.json`, `schedule.json`, every file in `boxscores/`, `news.json`)
2. Inserts them in dependency order — `teams` first, then `players` (which reference a team), then `games`, then `boxscore_lines` (which reference both a game and a player)
3. Uses `INSERT ... ON CONFLICT DO UPDATE` (an **upsert**) for every row, so the script is safe to run again any time — it updates existing rows instead of creating duplicates
4. Runs everything inside one database **transaction**, so if anything fails partway through, nothing gets partially saved — it's all-or-nothing

Run with:

```
node scripts/import-data.mjs
```

Final result after import: 12 teams, 149 players, 49 games, 777 individual box-score stat lines, and 6 news items — all now living in Postgres instead of scattered JSON files.

## The API server

A browser can't talk to a database directly — there's no driver for it, and the database password would be exposed to anyone visiting the site. So `server/index.mjs`, built with **Express** (a Node.js web framework), sits in between:

```mermaid
sequenceDiagram
  participant Vue as Vue app (browser)
  participant API as Express server
  participant DB as Postgres
  Vue->>API: fetch('/api/teams')
  API->>DB: SELECT * FROM teams
  DB-->>API: rows
  API-->>Vue: JSON response
```

Each **endpoint** is one URL the server understands, e.g.:

```js
app.get('/api/teams', async (req, res) => {
  const result = await pool.query('SELECT * FROM teams ORDER BY name')
  res.json(result.rows)
})
```

During local development, two things run side by side in separate terminals: `npm run server` (the API, on port 3001) and `npm run dev` (the Vue app, via Vite, on port 5173). Vite is configured to forward any request starting with `/api` to port 3001, so the browser only ever talks to one address and never hits a cross-origin (CORS) issue.

Endpoints built so far: `teams`, `players`, `games`, `standings` (computed live from game results), `player-stats` (season averages computed live from box scores), plus one endpoint per game for its box score.

## Login and the admin dashboard

The public site (Teams, Players, Schedule, Standings) needs no login — anyone can read it. Only *changing* data (entering a score, adding a player) requires being logged in.

How it works, in order:

1. **`users` table** — holds a username and a password hash. There's no public sign-up form; accounts are created directly with `node scripts/create-user.mjs <username> <password>`.
2. **Password hashing (`bcrypt`)** — the real password is never stored. `bcrypt.hash()` turns it into a one-way scrambled value; even with full database access, the original password can't be recovered from it.
3. **Logging in** (`POST /api/login`) — checks the submitted password against the stored hash with `bcrypt.compare()`. If it matches, the server signs a **JWT** (JSON Web Token, a small tamper-proof note saying "this is user X") and sends it back as an **httpOnly cookie** — a cookie JavaScript in the browser can't read, but that the browser automatically resends on every request.
4. **Checking who's logged in** — any protected endpoint runs a small checkpoint function (`requireAuth`) first: it reads that cookie, verifies the token hasn't been tampered with, and only then lets the request through. No valid cookie means an automatic `401 Unauthorized`.
5. **The dashboard itself** lives at `/admin` in the same Vue app, just behind a login check — no separate project, so it shares all the same styling and tooling, while its code is lazy-loaded so visitors browsing the public site never download any of it.

## What the dashboard can do now

Everything below replaces a manual JSON edit with a login-protected form:

| Action | Dashboard page | What happens |
| --- | --- | --- |
| Enter/edit a box score | `/admin/games/:id/boxscore` | Saves every player's stat line; the game's final score is auto-calculated by summing each team's points, and the game is marked "final" |
| Update game status | `/admin/games/:id/status` | Directly set scheduled / final / forfeit / cancelled, with only the fields that make sense for that status |
| Add a game | `/admin/games/new` | Creates a new scheduled matchup, auto-numbered (`g50`, `g51`, ...) |
| Add/edit a player | `/admin/players` | New players get an auto-generated id like `grit-dela-cruz`; picking a position auto-fills its full label |
| Add/edit a team | `/admin/teams` | New teams get an id from their name, e.g. "River Kings" → `river-kings` |

Everything the public pages show — Players' averages, the Home page's league leaders, standings, the Game Detail box-score view — is computed live from this same data, so a change made in the dashboard shows up immediately across the whole site.

## One request, traced through every file

The fastest way to actually *hold* this system in your head — rather than knowing the files individually — is to trace one action through every layer it touches, in order. Here's "an admin edits a box score":

```mermaid
sequenceDiagram
  participant You as Admin (browser)
  participant Vue as Vue component (src/)
  participant API as server/index.mjs
  participant Auth as requireAuth middleware
  participant Pool as scripts/db.mjs (pool)
  participant DB as Postgres

  You->>Vue: fills form, clicks Save
  Vue->>API: fetch POST /api/games/:id/boxscore (cookie attached automatically)
  API->>Auth: requireAuth(req, res, next)
  Auth-->>API: cookie's JWT is valid → next()
  API->>Pool: pool.query('INSERT ... ON CONFLICT DO UPDATE ...')
  Pool->>DB: runs SQL over the connection from DATABASE_URL
  DB-->>Pool: rows written
  Pool-->>API: result
  API-->>Vue: res.json({ ok: true })
  Vue-->>You: UI updates, no page reload
```

Every "where is X called" question collapses once this chain is automatic:

- `server/index.mjs` is called by **whoever started the Node process** — `npm run server` locally, `pm2` on the droplet (see `DEPLOYING-CHANGES.md`). It is never `import`ed by other app code; it's the entry point.
- `scripts/db.mjs` is called by **every file that needs to touch the database** — `server/index.mjs` and the one-off scripts in `scripts/` (`import-data.mjs`, `run-schema.mjs`, `create-user.mjs`, `test-db.mjs`). It exports one shared `pool` so the connection logic exists in exactly one place.
- Which actual database `pool` talks to isn't decided by the code at all — it's decided by **which machine `DATABASE_URL` in `.env` points at**, which is why identical code produces different results depending on whether it's running on your PC or the droplet (see `DEPLOYING-CHANGES.md`'s "two separate databases" note).

If you can redraw that diagram from memory and explain the last bullet, you can answer almost any "how does this app work" question about the backend.

## Cheat-sheet: answers to the questions that come up most

Quick Q&A format — these are the two things that actually trip people up in practice, worth being able to answer without hesitating.

**Q: If I add a schedule/game in the local admin (`localhost:5173/admin`), does it show up on the live site?**
A: No. Local and production are two completely separate Postgres databases — same table names, different machines, no sync between them. Your local admin only ever writes to the Postgres running on your own PC.

**Q: Why not? They're running the same code.**
A: Because `DATABASE_URL=postgres://postgres:...@localhost:5432/cgyballers` uses `localhost`, and `localhost` doesn't mean "Noel's computer" — it means "whatever machine this process is currently running on." The exact same line of code connects to a different database depending on where `server/index.mjs` is running: your PC when you run `npm run server`, the droplet when `pm2` runs it there. Each machine also has its own `.env` file (`.env` is git-ignored, so it never gets pushed) with its own password.

**Q: So how do I get a schedule entry onto the live site?**
A: Add it directly in the production admin, `https://cgyballers.gacs.me/admin`. That writes straight to the droplet's Postgres, which is what the live site reads from. There's no "sync" step — you're just choosing which admin panel to type into.

**Q: Does deploying (`git push` → pull on droplet → rebuild) move my local data to production?**
A: No — deploying only ships *code* (component changes, new API routes, bug fixes). It has zero effect on rows already sitting in either database. Code and data travel through completely different paths: code moves through GitHub + `git pull`; data is typed directly into whichever admin panel (local or prod) you're logged into.

**Q: When would I actually need to deploy for a data-entry feature to work in prod?**
A: Only if the feature needs a **new column or table** that doesn't exist yet — e.g. adding a "playoff round" field to games. Then you'd deploy the code *and* separately run the matching `ALTER TABLE` by hand against the droplet's database via `psql` (see `DEPLOYING-CHANGES.md` → "Database schema changes"). Ordinary data entry using fields that already exist never needs a deploy.

**One-line summary to remember:** *code* travels through GitHub; *data* never does — each database only holds what was typed into its own admin panel.

## What's next

**Update, 2026-09-20:** this has since happened — the app is live in production. See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the hosting setup and [`DEPLOYING-CHANGES.md`](./DEPLOYING-CHANGES.md) for the ongoing routine of shipping new changes to it.

~~Everything above runs locally only — on your own machine, for free, with nothing exposed to the internet yet. The planned next step is hosting it live: DigitalOcean will run the Express API server and Postgres database continuously, and a GoDaddy domain's DNS will be pointed at it.~~
