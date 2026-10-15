# 5. The database

## In one sentence
**PostgreSQL** ("Postgres") stores all the league data: teams, players,
games, box scores, admin users and login sessions.

## Why we need it
Early on, the data lived in JSON files inside the project. That meant
every score change was a code edit and a redeploy. With a database:
- Admins enter scores on the live site, and **they show up instantly**.
- Stats and standings are **calculated from the box scores**, so they're
  never out of sync.
- Two saves at the same time can't corrupt each other.

## What if we didn't have it?
We'd be back to editing files by hand and redeploying for every game.
There'd be no admin panel.

## Is it heavy?
For our size, no. Postgres runs happily on a small droplet. It's built for
far more data than a basketball league will ever have.

## Is it good practice today?
Yes. Postgres is one of the most popular and trusted databases, free and
open source. Some sites use a *managed* database (DigitalOcean, Supabase,
Neon) so someone else handles backups and updates, but it costs extra.

## The tables (in `db/schema.sql`)
| Table | Holds |
|---|---|
| `teams` | Team names, logos, featured photo |
| `players` | Players and which team they're on |
| `games` | Schedule, scores, status, stage (elimination / playoffs) |
| `boxscore_lines` | One row per player per game: points, rebounds, ... |
| `users` | Admin accounts (passwords stored as hashes, not plain text) |
| `sessions` | Who's logged in, and until when |
| `news` | News posts (hidden on the site for now) |

## How the API connects
`scripts/db.mjs` creates a **connection pool** using `DATABASE_URL` from
the `.env` file. The `.env` file holds the database password, so it's
**never put in git**. Local and live each have their own `.env`, and their
own separate database.

## Backups (important)
- **Every night at 03:00 PH time**, `scripts/backup.sh` saves the
  database and the uploaded photos to `/root/backups/cgyballers` on the
  droplet. The last 14 days are kept.
- **Weak spot:** the backups are on the **same server**. If the droplet
  were lost, the backups would be lost too. Copy them to your computer now
  and then (command in `HOW-THE-LIVE-SITE-WORKS.md`, section 2.6).
- A backup you've never restored is a guess. The restore steps are in
  `DEPLOYING-CHANGES.md` → **Restoring**.

## Go deeper
- [`../BACKEND_SETUP.md`](../BACKEND_SETUP.md) — why we moved off JSON,
  and how the database was set up
- [`../DEPLOYING-CHANGES.md`](../DEPLOYING-CHANGES.md) — schema changes,
  backups, restoring

Next: [6. Security basics →](./06-security-basics.md)
