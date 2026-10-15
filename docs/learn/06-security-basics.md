# 6. Security basics

## In one sentence
Security here means: only admins can change data, nobody can sneak in
through a "side door", and if something goes wrong, the data can be
restored.

## What's already in place

| Protection | What it stops | Where |
|---|---|---|
| **HTTPS** (Certbot) | Others reading passwords or cookies in transit | Nginx; renews itself |
| **Firewall (UFW)** | Access to anything except SSH (22), HTTP (80), HTTPS (443) | On the droplet: `ufw status` |
| **API on 127.0.0.1 only** | Reaching the API directly, skipping Nginx | `server/index.mjs` (bottom) |
| **Database on localhost only** | Connecting to Postgres from the internet | Postgres default |
| **SSH with a key, no password** | Password guessing on the server login | Droplet SSH settings |
| **Hashed passwords** (bcrypt) | Reading admin passwords from a leaked database | `server/auth.mjs` |
| **Session cookies** | JavaScript stealing the login (`httpOnly`); use over plain HTTP (`secure`) | `server/auth.mjs` |
| **`requireAuth` on every change** | Logged-out people saving or deleting anything | All `POST`/`PUT`/`DELETE` routes |
| **Parameterized SQL** (`$1, $2`) | SQL injection attacks | Every `pool.query` call |
| **Automatic security updates** | Known bugs in the server's software | Ubuntu `unattended-upgrades` |
| **Nightly backups** | Losing data to a mistake | See [5. The database](./05-the-database.md) |

## What's still open
These are known and written down. None of them is an emergency for a
small league site, but they're worth doing:

1. **No limit on login attempts.** Someone could keep guessing the admin
   password. *Fix:* rate limiting on `/api/login`.
2. **No security headers** (e.g. stop other sites embedding ours in a
   frame). *Fix:* a few lines in Nginx or the `helmet` package.
3. **Backups stay on the same server.** *Fix:* copy them off regularly,
   or turn on DigitalOcean Backups (about $1–2/month).
4. **Running as `root` with a database "superuser"** (found in the
   2026-09-29 review). If the app were ever hacked, the attacker would
   have full control. *Fix:* a separate, limited Linux user and database
   user.

Items 1 and 2 are tracked in [`../FUTURE-IMPROVEMENTS.md`](../FUTURE-IMPROVEMENTS.md).

## Habits that matter more than any tool
- **Use a strong, unique admin password.**
- **Never commit `.env`**, and never paste passwords or keys into chats
  or screenshots.
- **Guard your SSH key** (the file on your computer that logs you in to
  the server). Whoever has it has the server.
- **Know the emergency door:** if you're ever locked out of SSH,
  DigitalOcean dashboard → droplet → **Access → Launch Droplet Console**.

## Is this good practice today?
Yes. Firewall + HTTPS + private API + hashed passwords + backups is the
standard baseline for a small site. Closing the four open items above
would put it in good shape.

## Go deeper
- [`../HOW-THE-LIVE-SITE-WORKS.md`](../HOW-THE-LIVE-SITE-WORKS.md),
  sections 2.6–2.7 — backups and firewall, with check commands

Next: [7. Review checklist →](./07-review-checklist.md)
