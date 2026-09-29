#!/usr/bin/env bash
# Nightly backup of the production database and admin-uploaded photos.
# Runs on the droplet from /etc/cron.d/cgyballers-backup (see
# docs/DEPLOYING-CHANGES.md → "Backups"). Keeps the last KEEP_DAYS days.
#
# Backups live on the same droplet, so they protect against mistakes
# (a deleted game, an overwritten box score), not against losing the
# droplet itself — copy one to your computer now and then for that.
set -euo pipefail

APP_DIR=/opt/cgyballers
BACKUP_DIR=/root/backups/cgyballers
KEEP_DAYS=14

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
cd "$BACKUP_DIR"

STAMP=$(date -u +%Y-%m-%d_%H%M)
DB_URL=$(grep '^DATABASE_URL=' "$APP_DIR/.env" | cut -d= -f2-)

# Custom format (-Fc): compressed, and restorable with pg_restore.
# Written to .tmp first so a failed dump never looks like a good backup.
pg_dump -Fc --no-owner "$DB_URL" > "db-$STAMP.dump.tmp"
mv "db-$STAMP.dump.tmp" "db-$STAMP.dump"

tar -czf "uploads-$STAMP.tar.gz.tmp" -C "$APP_DIR" uploads
mv "uploads-$STAMP.tar.gz.tmp" "uploads-$STAMP.tar.gz"

find "$BACKUP_DIR" -maxdepth 1 \( -name 'db-*.dump' -o -name 'uploads-*.tar.gz' \) -mtime +"$KEEP_DAYS" -delete
find "$BACKUP_DIR" -maxdepth 1 -name '*.tmp' -mmin +60 -delete

echo "$(date -u '+%F %T') ok db-$STAMP.dump ($(du -h "db-$STAMP.dump" | cut -f1)), uploads-$STAMP.tar.gz ($(du -h "uploads-$STAMP.tar.gz" | cut -f1))"
