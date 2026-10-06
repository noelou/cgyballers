# `scripts/backup.sh`: the nightly backup (runs on the droplet)

[← All scripts](./README.md)

**What it's for:** every night it saves a copy of the **live database** and
the **admin-uploaded photos** (`uploads/`), so a mistake like a deleted
game or an overwritten box score can be undone.

Unlike the other scripts, this is a **bash** script (`.sh`), not Node. It
only runs on the droplet (it uses the droplet's paths like
`/opt/cgyballers`), never on your laptop.

**When it runs:** automatically, every night at 03:00 Philippine time
(19:00 UTC). The schedule is in `/etc/cron.d/cgyballers-backup` (**cron**
is Linux's "run this at a set time" service). Each run adds one line to
`/var/log/cgyballers-backup.log`.

**How to run it by hand** (e.g. right before a risky change), on the
droplet:

```
/opt/cgyballers/scripts/backup.sh
```

## What it does

```bash
set -euo pipefail                  # stop at the first error instead of carrying on

APP_DIR=/opt/cgyballers            # where the live site lives
BACKUP_DIR=/root/backups/cgyballers
KEEP_DAYS=14

STAMP=$(date -u +%Y-%m-%d_%H%M)                                   # e.g. 2026-10-06_1900
DB_URL=$(grep '^DATABASE_URL=' "$APP_DIR/.env" | cut -d= -f2-)    # read the live DB address from .env

pg_dump -Fc --no-owner "$DB_URL" > "db-$STAMP.dump.tmp"           # 1. dump the whole database...
mv "db-$STAMP.dump.tmp" "db-$STAMP.dump"                          #    ...and only then give it its real name

tar -czf "uploads-$STAMP.tar.gz.tmp" -C "$APP_DIR" uploads         # 2. zip up the uploaded photos
mv "uploads-$STAMP.tar.gz.tmp" "uploads-$STAMP.tar.gz"

find ... -mtime +"$KEEP_DAYS" -delete                             # 3. delete backups older than 14 days
find ... -name '*.tmp' -mmin +60 -delete                          #    and leftovers from failed runs
```

- **`pg_dump -Fc`** saves the entire database in Postgres's compressed
  "custom" format. You restore it with `pg_restore`.
- **The `.tmp` trick:** each file is written under a `.tmp` name and only
  renamed when it's complete. If a dump fails halfway, you never end up
  with a broken file that looks like a good backup.
- **`set -euo pipefail`** makes the script stop at the first failed command
  instead of carrying on and reporting `ok`.

Each night produces two files in `/root/backups/cgyballers/`:
`db-<date>.dump` and `uploads-<date>.tar.gz`.

## Good to know

- The backups are stored **on the droplet itself**. They protect against
  mistakes, not against losing the droplet. Copy them to your computer now
  and then (see "Backups" in [`DEPLOYING-CHANGES.md`](../DEPLOYING-CHANGES.md)).
- **Restoring** a backup is covered step by step in
  [`DEPLOYING-CHANGES.md`](../DEPLOYING-CHANGES.md) → "Restoring". Take a fresh
  backup before restoring, so the restore itself can be undone.

**Safety:** safe. It only reads the database and writes new backup files.
The only thing it deletes is its own backups older than 14 days.
