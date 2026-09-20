# Deploying changes to production

The one-time setup (`DEPLOYMENT.md`) is already done — the site is live
at `https://cgyballers.gacs.me`. This doc is the routine you follow
**every time** you have new changes to ship, from now on.

## The big picture

Three separate things exist, and none of them update each other
automatically:

1. **Your local code** (this repo, on your own machine)
2. **GitHub** (`https://github.com/noelou/cgyballers`, branch `vue3-migration`)
3. **The droplet** (`159.223.81.97`, running the live site)

Shipping a change means moving it through all three, in order:
local → GitHub → droplet. There's no auto-deploy set up — every step
below is manual, on purpose (no surprises).

Also important: **the local dev database and the production database are
two completely separate Postgres databases.** Anything you enter through
the admin panel at `localhost:5173/admin` (a new game, a box score, a
forfeit) only affects your local copy. Anything you enter at
`https://cgyballers.gacs.me/admin` only affects production. They don't
sync. Do real season data entry (schedule, scores, box scores) directly
on the **live** site once it's up — treat local as just a place to test
code changes before shipping them.

## Step 1 — Make and test your changes locally

Usual local dev loop:

```bash
npm run dev       # frontend, http://localhost:5173
npm run server    # API, http://localhost:3001
```

Test whatever you changed here first.

## Step 2 — Commit and push

```bash
git add <files>
git commit -m "describe the change"
git push origin vue3-migration
```

## Step 3 — SSH into the droplet

```bash
ssh root@159.223.81.97
cd /opt/cgyballers
```

## Step 4 — Pull the new code

```bash
git pull origin vue3-migration
```

## Step 5 — Do the right follow-up steps for what actually changed

Not every change needs every step below — pick based on what you
touched:

| What changed | What to run on the droplet |
|---|---|
| Anything in `src/`, `public/`, or `index.html` (frontend) | `npm run build` — rebuilds `dist/`, which Nginx serves. **Nothing shows up live without this.** |
| `server/index.mjs` or anything it imports (e.g. `src/utils/*.js`) | `pm2 restart cgyballers-api` |
| `package.json` (new dependency added) | `npm install` (before building/restarting) |
| `.env` (new/changed environment variable) | Don't just `pm2 restart` — it doesn't reliably pick up env changes. Instead: `pm2 kill && pm2 start server/index.mjs --name cgyballers-api && pm2 save` |
| `db/schema.sql` (new table/column) | No automatic step — see "Database schema changes" below, this needs care |
| Only data files like `players.json`/`teams.json` | These aren't read by the live site directly (see note below) — a plain rebuild is enough if a frontend page imports them statically; if the change should reach the *database*, you need a manual `UPDATE`/`INSERT`, not a re-import (see below) |

When in doubt, it's always safe to run all three:
```bash
npm install && npm run build && pm2 restart cgyballers-api
```

## Step 6 — Verify

```bash
pm2 status                                   # "online", no crash loop
curl -I http://localhost:3001/api/games      # 200, API responding
curl -I https://cgyballers.gacs.me/          # 200, site responding
```

Then actually open `https://cgyballers.gacs.me` in a browser and click
through whatever you changed. For anything involving direct-URL loads
(not just in-app navigation), also try a hard refresh on a couple of
pages — see `STATIC-ASSET-ROUTE-COLLISIONS.md` for why that specifically
matters here.

## Database schema changes — handle with care

`scripts/run-schema.mjs` and `scripts/import-data.mjs` were only meant
for the **initial** one-time setup. Do not re-run `import-data.mjs`
against production once it's live — it upserts based on static JSON
files (`src/data/*.json`) that no longer reflect reality (production has
its own game results, statuses, and box scores entered through the admin
panel that aren't in those files). Re-running it risks silently
overwriting real season data with stale JSON.

If you need to add a new column/table:
1. Write the schema change (`ALTER TABLE ...` etc.) as a one-off SQL
   command.
2. Test it against your local database first.
3. Run the *exact same* SQL directly against production via `psql`, not
   through the import scripts. Example pattern used for a one-off fix:

   ```bash
   DB_URL=$(grep '^DATABASE_URL=' .env | cut -d= -f2-)
   psql "$DB_URL" -c "ALTER TABLE players ADD COLUMN nickname text;"
   ```

## Quick troubleshooting

- **Changes not showing up on the live site** — did you run `npm run
  build` on the droplet after pulling? The site serves `dist/`, a
  pre-built snapshot, not your source files directly.
- **API changes not showing up / old behavior persists** — did you `pm2
  restart cgyballers-api`? Check with `pm2 logs cgyballers-api --lines 30
  --nostream` for errors.
- **A page 403s or 404s only when loaded directly / refreshed, but works
  via in-app navigation** — check for a folder under `public/` that
  shares a name with a route. See `STATIC-ASSET-ROUTE-COLLISIONS.md`.
- **Data you entered isn't showing up** — check you entered it on the
  right site (local vs. production — they're separate databases, see
  above).
