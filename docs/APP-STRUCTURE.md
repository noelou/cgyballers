# App structure: folder-by-folder map and startup order

A step-by-step guide to what each top-level folder is for, and — the part
that's easy to get confused about — **what actually executes first** when
the app starts, since two independent programs (the frontend and the API)
run side by side, not one calling the other.

For the backend's internal logic (endpoints, auth, database) in more
depth, see [`BACKEND_SETUP.md`](./BACKEND_SETUP.md). This doc is the
higher-level map: where everything lives, and in what order it runs.

## The seven top-level folders

| Folder | What's in it | Who reads it, and when |
| --- | --- | --- |
| `src/` | The Vue app — every page, component, and route the browser shows | Built by Vite into `dist/`; the browser only ever runs the built output, never these files directly |
| `server/` | The Express API (`index.mjs`) — the one long-running backend process | Run directly by Node (`npm run server` locally, `pm2` in production) |
| `scripts/` | One-off maintenance scripts, not part of the running app | Run manually, by you, from a terminal, when needed |
| `db/` | `schema.sql` — the database blueprint (tables, columns, foreign keys) | Run once against an empty database via `scripts/run-schema.mjs`; not touched again unless the schema changes |
| `public/` | Static files served as-is — images (logos, player photos, sponsors), `favicon.svg` | Copied verbatim into `dist/` on build; referenced directly by URL, e.g. `/logos/team.png` |
| `docs/` | Project documentation (this file and its siblings) | Read by humans; never loaded by the running app |
| `dist/` | **Generated**, not written by hand — Vite's build output | What Nginx actually serves in production; deleted and rebuilt by `npm run build` |

A quick way to tell them apart: `src/`, `server/`, `scripts/`, and `db/`
hold **source** — things you edit. `public/` and `dist/` hold **assets and
output** — things that get served or copied, not edited as code.

### Inside `src/` (the Vue app)

| Subfolder | Purpose |
| --- | --- |
| `pages/` | One file per route — `Home.vue`, `Schedule.vue`, `Players.vue`, etc. |
| `pages/admin/` | The login-protected dashboard pages (`Dashboard.vue`, `BoxScoreEntry.vue`, `GameNew.vue`, ...) — lazy-loaded, see below |
| `components/` | Small reusable pieces used across multiple pages — `Navbar.vue`, `Footer.vue`, `PlayerCard.vue`, `TeamBadge.vue` |
| `router/` | `index.js` — the single file mapping every URL path to a page component |
| `utils/` | Plain JS helper functions — `standings.js`, `playerStats.js`, `date.js` — used by both pages and (via a copy of the logic) the API server |
| `data/` | Legacy static JSON (`teams.json`, `players.json`, etc.) — mostly superseded by Postgres now; see `BACKEND_SETUP.md` for what still uses it |

### Inside `server/` and `scripts/`

| File | Purpose |
| --- | --- |
| `server/index.mjs` | The whole API — every `/api/...` route, plus the login/auth logic |
| `scripts/db.mjs` | Exports the one shared Postgres connection `pool`, built from `DATABASE_URL` in `.env` |
| `scripts/run-schema.mjs` | One-time: applies `db/schema.sql` to create tables in an empty database |
| `scripts/import-data.mjs` | One-time: seeds the database from the legacy JSON files (never re-run against production — see `DEPLOYING-CHANGES.md`) |
| `scripts/create-user.mjs` | Creates an admin login (`node scripts/create-user.mjs <username> <password>`) |
| `scripts/test-db.mjs` | Manual connectivity check — confirms `pool` can reach Postgres |
| `scripts/generate-data.mjs` | Older data-generation script, predates the Postgres move |

## What executes first? Two different answers, for two different setups

The frontend and the backend are **two separate processes that don't
start each other** — you (or `pm2`) start both independently. "What runs
first" also looks different in local dev vs. production, because in
production a *third* program, Nginx, is involved.

### In local dev — three things run at once, in three terminals

Nothing here starts anything else automatically; you run all three:

1. **`npm run server`** → executes `server/index.mjs` directly → it
   imports `scripts/db.mjs` → connects to your local Postgres. Listens on
   port `3001`.
2. **`npm run dev`** → starts the Vite dev server on port `5173`. Vite
   reads `vite.config.js`, which tells it to proxy any `/api/...` request
   to `http://localhost:3001` (step 1) — this is *why* you need step 1
   running too, or every API call in the browser fails.
3. **You open `localhost:5173`** in a browser → the browser requests
   `index.html` → that file's one line, `<script type="module"
   src="/src/main.js">`, is the actual first line of *your* code that
   runs → `main.js` creates the Vue app, attaches the router, and mounts
   it into `<div id="root">` → the router (`src/router/index.js`) looks
   at the current URL and renders the matching page from `src/pages/`.

So, precisely: **`server/index.mjs` and `src/main.js` are each "first" in
their own process** — neither calls the other into existence. They only
meet at the network boundary, when a page's `fetch('/api/...')` call
reaches Vite's proxy.

### In production — Nginx decides where each request goes; nothing is "started" per request

Two long-running processes are already up at all times (not started per
visit — they were started once and just keep running):

- **Nginx**, listening on port 80/443
- **`server/index.mjs`**, kept alive by `pm2`, listening on port `3001`

There's no dev server or Vite proxy in production — `npm run build` ahead
of time already turned `src/` into static files in `dist/`, and Nginx's
config (`docs/DEPLOYMENT.md`) points straight at them:

```
root /opt/cgyballers/dist;
location /api/ { proxy_pass http://localhost:3001; }   # → server/index.mjs, via pm2
location /    { try_files $uri $uri/ /index.html; }     # → everything else
```

So when someone visits `cgyballers.gacs.me`:

1. Nginx receives the request first (it's the only thing listening on
   the public port).
2. If the path starts with `/api/` → Nginx forwards it to the already-running `server/index.mjs` process (started once, by `pm2`, and never restarted per request).
3. Otherwise → Nginx just hands back the pre-built `dist/index.html`
   (or the matching static file), exactly like `public/` files do — no
   process runs per page load; it's a static file being read off disk.
4. That `index.html` is the same one from local dev, structurally — its
   `<script>` tag still loads the bundled `main.js`, which still boots
   Vue and the router, now running in the visitor's browser rather than
   yours.

**The one-line version:** in production, nothing "starts" when a visitor
arrives — Nginx and `server/index.mjs` are already running continuously.
A page visit is Nginx handing over a static file; an API call is Nginx
forwarding to the process that was started once, ahead of time, by `pm2`.

## See also

- [`BACKEND_SETUP.md`](./BACKEND_SETUP.md) — the backend's internal
  layers (auth, database, endpoints) in depth, plus a request traced
  through every file for one admin action
- [`DEPLOYING-CHANGES.md`](./DEPLOYING-CHANGES.md) — the routine for
  shipping a change through local → GitHub → droplet, and which of
  `npm run build` / `pm2 restart` a given change actually needs
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — the full Nginx config and the
  one-time droplet setup this doc references
