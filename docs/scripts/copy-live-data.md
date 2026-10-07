# Copy live data to your laptop (from the nightly backup)

[← All scripts](./README.md)

**What it's for:** your local database and the live one are separate.
Scores entered on the live site never show up locally on their own. This
copies the **whole live database** (teams, players, games, box scores,
news, logins) onto your laptop, using the backup that
[`backup.sh`](./backup.md) makes every night.

Use it to:

- **set up a new computer** (an empty local database), or
- **refresh** your local database so it matches live again.

It isn't a script. It's two commands: copy the backup file down, then load
it with `pg_restore`, a tool that comes with PostgreSQL.

> ⚠️ **A refresh replaces everything in your local database.** If you've
> entered box scores locally that aren't on live yet, send them first with
> [`push-boxscores.mjs`](./push-boxscores.md), or they'll be gone.

## Step 1: copy the latest backup to your laptop

On your laptop (PowerShell), from the project folder. First see which
backups exist; the newest is at the top:

```
ssh root@159.223.81.97 "ls -t /root/backups/cgyballers/db-*.dump | head -3"
```

Then copy it down (use the real file name from the list):

```
scp root@159.223.81.97:/root/backups/cgyballers/db-2026-10-05_1900.dump .
```

The backup is made at 03:00 Philippine time, so anything entered on live
after that won't be in it yet.

## Step 2: load it into your local database

`pg_restore` lives in PostgreSQL's install folder. It asks for your local
Postgres password (the one in your `.env`).

**Refreshing your existing local database:**

```
& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" --clean --if-exists --no-owner -U postgres -d cgyballers db-2026-10-05_1900.dump
```

**New computer:** first create an empty database named `cgyballers` in
pgAdmin, and set up `.env` (copy `.env.example` and fill in your password). Then run the same command without `--clean --if-exists`:

```
& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" --no-owner -U postgres -d cgyballers db-2026-10-05_1900.dump
```

You don't need [`run-schema.mjs`](./run-schema.md) first: the backup
creates the tables itself.

When it's done, delete the `.dump` file from the project folder. It's a
copy of live data and shouldn't be committed.

## What the options mean

| Option | Meaning |
| --- | --- |
| `--clean --if-exists` | Drop each table before re-creating it from the backup, so old local data is replaced instead of mixed in. `--if-exists` stops it complaining about tables that aren't there |
| `--no-owner` | Don't try to give the tables to the droplet's database user. Your local `postgres` user owns them instead |
| `-U postgres` | Log in to your local Postgres as the `postgres` user |
| `-d cgyballers` | Load into the database named `cgyballers` |

## After restoring

- Run `npm run server` and `npm run dev` as usual. The local site now
  shows the same data as live did at backup time.
- **Your live admin login now works locally too**, because the `users`
  table came along. Logins you created only locally are gone; recreate
  them with [`create-user.mjs`](./create-user.md) if you need them.
- Uploaded photos (`uploads/`) aren't in the database backup, so players
  with uploaded photos show initials locally. That's only cosmetic.

**Safety:** it only changes the database named in `-d`, on your laptop. It
can't change live. Just never run it on the droplet itself, where
`cgyballers` **is** the live database (restoring a backup there is covered
in [`DEPLOYING-CHANGES.md`](../DEPLOYING-CHANGES.md) → "Restoring").

*Tested on 2026-10-06: the restored copy matched live row for row, the API
served every page from it, and `--clean` correctly replaced edited data.*
