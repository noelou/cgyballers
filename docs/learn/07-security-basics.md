# 7. Security basics

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
| **Nightly backups** | Losing data to a mistake | See [6. The database](./06-the-database.md) |

## The doors: ports 22, 80, 443
The firewall (`ufw`) is the **gate guard at the fence**: it only lets
people through to doors 22, 80 and 443. Behind each door is a different
program:

| Port | Who uses it | Behind the door | Login? |
|---|---|---|---|
| **22** | You, from cmd | `sshd`: the server's command line | Yes, with your **SSH key** |
| **80** | Visitors typing `http://` | Nginx: redirects to `https://` | No |
| **443** | Visitors on `https://` | Nginx → the website and API | Only the `/admin` login, checked by the API |

So there are **two separate logins**, and neither uses port 80: the
**server login** (SSH, port 22) and the **admin panel login** (`/admin`,
port 443). The API (3001) and Postgres (5432) aren't on the list on
purpose: they only listen inside the droplet.

### When is port 22 used?
Every time your PC connects to the droplet:

| What you do | Command | Port 22? |
|---|---|---|
| Log in to the server | `ssh root@159.223.81.97` | Yes |
| Run one command from your PC | `ssh root@159.223.81.97 "pm2 status"` | Yes |
| Copy files to/from the server | `scp root@159.223.81.97:/root/backups/... .` | Yes (`scp` goes through SSH) |
| Open the website, log in to `/admin` | the browser | No, that's 443 |

What happens when you run `ssh`:
```
Your PC ──► knocks on door 22
              │
         1. ufw (gate guard): "Door 22 is on my list." → lets you through
              │
         2. sshd (doorman): "Show me your key."
              │   your PC proves it has the private key (in C:\Users\ACER\.ssh\)
              │
         3. Key matches → you're in: root@...:~#
```
Two checks: ufw checks **which door**, sshd checks **who you are**.

**Bots knock on door 22 all day.** They scan every IP on the internet and
try common logins like `root / 123456`. They fail because the server only
accepts keys. To see them, on the droplet:
```bash
journalctl -u ssh --since today | grep -i "invalid user" | head
sshd -T | grep -i passwordauthentication   # "no" = passwords are refused
```

**Never remove 22 from `ufw`**, or the gate guard locks you out too. The
way back in is the DigitalOcean console (see [Habits](#habits-that-matter-more-than-any-tool)).

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
- [`../deploy/01-how-the-live-site-works.md`](../deploy/01-how-the-live-site-works.md),
  sections 2.6–2.7 — backups and firewall, with check commands

Next: [8. Review checklist →](./08-review-checklist.md)
