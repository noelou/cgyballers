# How the live site works — a beginner's guide

This guide explains, in plain language, how the live CGYBallers site is put
together and **everything that was changed on 2026-09-29**: what each
change is, why it was needed, where it lives, how to check it's working,
and how to undo it if you ever need to.

You don't need to memorise any of this. Read it once to get the picture,
then come back to the "How to check" parts when you want to look at
something.

Related docs (more detailed, more technical):

- [`DEPLOYING-CHANGES.md`](./DEPLOYING-CHANGES.md): the routine for shipping
  code changes, plus **Backups** and **Restoring**
- [`DEPLOYMENT.md`](./DEPLOYMENT.md): how the server was first set up, and the
  full Nginx config
- [`DNS-SUBDOMAIN-SETUP.md`](./DNS-SUBDOMAIN-SETUP.md): how the domain points
  at the server

---

## 1. The big picture

When someone opens `https://cgyballers.gacs.me`, this is the path their
request takes:

```
 Visitor's phone / computer
          │
          ▼
 ┌────────────────────────────────────────────────────────────────────┐
 │ DigitalOcean droplet  (your server, IP 159.223.81.97)              │
 │                                                                    │
 │  🧱 Firewall (UFW) ── only lets in: 22 (SSH), 80 (HTTP), 443 (HTTPS)│
 │          │                                                         │
 │          ▼                                                         │
 │  🚪 Nginx (the front door, ports 80/443)                           │
 │     ├─ /                → website files in /opt/cgyballers/dist    │
 │     ├─ /uploads/...     → uploaded photos in /opt/cgyballers/uploads│
 │     ├─ /api/...  ─┐                                                │
 │     └─ /sitemap.xml ┤                                              │
 │                    ▼                                               │
 │  ⚙️  API (Node.js, run by pm2) — only reachable from inside,        │
 │      at 127.0.0.1:3001                                             │
 │                    │                                               │
 │                    ▼                                               │
 │  🗄️  PostgreSQL database — teams, players, games, box scores        │
 │                                                                    │
 │  🕒 Every night 03:00 PH time: backup script copies the database   │
 │     and photos to /root/backups/cgyballers                         │
 └────────────────────────────────────────────────────────────────────┘
          │
          └─ Visitor's browser also sends an anonymous "page viewed"
             ping to Cloudflare Web Analytics (for your visitor counts)
```

### Words you'll see

| Word | What it means here |
|---|---|
| **Droplet** | Your rented server at DigitalOcean. Everything live runs on it. |
| **SSH** | How you log in to the droplet from your computer: `ssh root@159.223.81.97`. Uses a key file on your computer, not a password. |
| **Nginx** | The "front door" program. It receives every visit and decides what to send back: a website file, a photo, or a hand-off to the API. |
| **API** | The Node.js program in `server/index.mjs`. It reads and writes the database (scores, players, and so on) and handles admin login. |
| **pm2** | Keeps the API running, and restarts it if it crashes or the server reboots. |
| **PostgreSQL / database** | Where all league data lives. |
| **Port** | A numbered "door" on the server. 443 = HTTPS website, 80 = plain HTTP, 22 = SSH, 3001 = our API, 5432 = the database. |
| **Firewall (UFW)** | A guard that blocks every port except the ones we allow. |
| **127.0.0.1 / localhost** | "This same machine". Something listening only on 127.0.0.1 can't be reached from the internet. |
| **Cron** | The server's built-in scheduler ("run this every night at 3 AM"). |
| **Build** (`npm run build`) | Turns the source code in `src/` into the final website files in `dist/`, which Nginx serves. |
| **Deploy** | Getting new code live: push to GitHub → `git pull` on the droplet → build and/or restart. |

---

## 2. What changed on 2026-09-29

Each item follows the same pattern: **What**, **Why**, **Where**, **How to
check**, **How to undo**.

### 2.1 JME-JES dropout: forfeit wins

- **What:** JME-JES dropped out. Their 5 games that were never scheduled
  (vs A-Team, Maranding Autoparts, Jacque Jons, GLQ, Young Chow) were added
  as **forfeit wins** for the opponent: games `g63`–`g67`, dated Sep 11,
  with no time or venue. Their Sep 11 game vs ETS x RLT (`g40`) was already
  a forfeit.
- **Why:** so every team ends with the right number of games and wins in
  the standings.
- **Where:** data only, in the live database (`games` table). Also a small
  code fix so a game **without a time** shows "—" instead of crashing the
  Schedule page (`src/utils/date.js`).
- **How to check:** Schedule page → filter by JME-JES; the Standings page
  shows JME-JES with 11 games played.
- **How to undo:** Admin → Dashboard → find the game → **Score / status**,
  or **Delete**.

### 2.2 Featured player photos are now editable in the admin

- **What:** the photo on each team's side of the home-page matchup cards
  can now be changed in **Admin → Teams → Edit → Featured player photo**.
  Before, changing one required editing code and redeploying.
- **Why:** so you can swap photos yourself, anytime, with no deploy.
- **Where:**
  - database: new `featured_photo` column on the `teams` table
  - uploaded files: `/opt/cgyballers/uploads/featured-photos/` on the droplet
  - code: `src/pages/admin/TeamForm.vue`, `server/index.mjs`
- **How to check:** upload a photo, save, refresh the Home page.
- **How to undo:** click **Remove** on the team's edit page; the card goes
  back to showing the team logo.
- **Two server fixes found along the way:**
  1. Nginx had **no rule for `/uploads/`**, so uploaded photos never
     showed. It now serves them.
  2. Nginx rejected uploads over **1 MB** (most phone photos). The limit
     is now 6 MB, which matches the "up to 5 MB" message in the form.

  Both also fix **player** photo uploads, which had the same problems.

### 2.3 Admin pages redesigned

- **What:**
  - **Dashboard:** games grouped by date, with tabs *Needs result /
    Upcoming / Completed / All*, a team filter, and quick links.
  - **Players:** search (by name or jersey number) and a team filter.
  - **Teams:** logos, and tidier spacing.
  - **All forms:** bigger, clearer inputs.
- **Why:** easier and quicker to use on game day, on a phone or a laptop.
- **Where:** `src/pages/admin/` (shared styles in `admin.css`).
- **How to undo:** it's a design change only; no data changed. Old versions
  are in git history.

### 2.4 Google: making the site searchable

- **What:**
  - Every page has its own **title and description**, e.g.
    "GLQ · CGYBallers", or "Cahilog #18 · GLQ · CGYBallers" with their
    season averages.
  - **Link previews:** sharing the link on Facebook or Messenger shows the
    banner image, a title and a description.
  - **`robots.txt`:** tells search engines what they may crawl (everything
    except `/admin` and `/api`).
  - **`sitemap.xml`:** a list of every page (teams, players, games with box
    scores), built automatically from the database, so new players show up
    without any work.
  - Admin pages and 404 pages are marked "don't show in Google".
- **Why:** so people searching "CGYBallers" (and player and team names)
  find the site.
- **Where:** `index.html`, `src/utils/seo.js`, `src/router/index.js`,
  `public/robots.txt`, `public/og-image.jpg`, and the `/sitemap.xml` route
  in `server/index.mjs` (Nginx passes `/sitemap.xml` to the API).
- **How to check:** open
  <https://cgyballers.gacs.me/sitemap.xml> and
  <https://cgyballers.gacs.me/robots.txt>; the browser tab title changes as
  you move between pages.
- **Still to do (you):** register in **Google Search Console**. Steps are in
  section 5.

### 2.5 Cloudflare Web Analytics: fixed

- **What:** your Cloudflare dashboard showed **no page views**, because the
  tracking snippet was written into the page in a broken way (the browser
  couldn't read your site token). It's now inserted exactly as Cloudflare
  provides it, and page views are reaching Cloudflare.
- **Where:** `vite.config.js` (added to the page only in production builds,
  so your local testing isn't counted).
- **Good to know:**
  - Visits before 2026-09-29 were never recorded; counting starts from the
    fix.
  - **Ad blockers** (Brave, uBlock Origin, AdBlock and so on) block the
    tracking script, so Cloudflare **undercounts**, roughly 10–30%. The
    site still works fine for those visitors. For exact numbers, the Nginx
    logs on the droplet record every visit.

### 2.6 Nightly automatic backups

- **What:** every night at **03:00 Philippine time**, a script saves:
  - the whole database → `/root/backups/cgyballers/db-<date>.dump`
  - all uploaded photos → `/root/backups/cgyballers/uploads-<date>.tar.gz`

  It keeps the last **14 days** and deletes older ones.
- **Why:** if a game is deleted or a box score overwritten by mistake, you
  can get it back.
- **Where:** the script is `scripts/backup.sh`; the schedule is
  `/etc/cron.d/cgyballers-backup`; the log is
  `/var/log/cgyballers-backup.log`.
- **Tested:** the first backup was restored into a separate test database
  and matched the live data exactly.
- **How to check** (on the droplet):
  ```bash
  tail -5 /var/log/cgyballers-backup.log     # one "ok" line per night
  ls -lh /root/backups/cgyballers/           # the backup files
  ```
- **How to restore:** see **Restoring** in
  [`DEPLOYING-CHANGES.md`](./DEPLOYING-CHANGES.md).
- **Limit:** backups are stored **on the droplet itself**. If the whole
  droplet were lost, they'd go with it. Now and then, copy them to your own
  computer (PowerShell):
  ```bash
  scp "root@159.223.81.97:/root/backups/cgyballers/*" ./cgyballers-backups/
  ```
- **How to turn off:** `rm /etc/cron.d/cgyballers-backup`

### 2.7 Firewall on, and the API closed to the internet

- **What:**
  1. The **API** now only listens on `127.0.0.1` (inside the server).
     Before, anyone could reach it directly at
     `http://159.223.81.97:3001`, skipping Nginx and HTTPS.
  2. The **firewall (UFW)** is on. It lets in only SSH (22), HTTP (80) and
     HTTPS (443), and blocks everything else.
- **Why:** closes a "side door" into the server. Anything accidentally left
  open in future is blocked by default.
- **Where:** `server/index.mjs` (bottom of the file), Nginx config
  (`proxy_pass http://127.0.0.1:3001`), and the UFW rules on the droplet.
- **How to check** (on the droplet):
  ```bash
  ufw status              # should say "Status: active" with 22, 80, 443
  ```
- **Important for the future:** if you ever install something on the
  server that needs another port, the firewall will block it until you
  allow it, e.g. `ufw allow 8080/tcp`.
- **If you're ever locked out of SSH:** DigitalOcean dashboard → your
  droplet → **Access → Launch Droplet Console** gets you in through the
  browser. Then run `ufw allow 22/tcp`, or `ufw disable` to turn the
  firewall off.

### Server config backups

Every time the Nginx config was changed, the previous version was saved
first as `/root/cgyballers.nginx.bak-<date-time>`. To go back to one:

```bash
cp /root/cgyballers.nginx.bak-YYYYMMDDHHMMSS /etc/nginx/sites-available/cgyballers
nginx -t && systemctl reload nginx     # test first; only reloads if the config is valid
```

---

## 3. Does any of this cost money?

**No.** Everything above is free: it uses software already on the droplet
(Nginx, UFW, cron, PostgreSQL) and free services (Cloudflare Web Analytics,
Let's Encrypt HTTPS, Google Search Console). Your bill is unchanged: the
droplet's monthly price, plus the domain's yearly renewal.

Optional paid extras that are **not** turned on (they only start if you
enable them yourself):

| Option | Cost | What it adds |
|---|---|---|
| DigitalOcean Backups | about $1–2/month | Weekly snapshot of the **whole server**, stored off the droplet. Protects against losing the droplet itself. |

---

## 4. Simple routine

| When | What to do |
|---|---|
| **After each game day** | Enter scores and box scores as usual. Glance at Admin → Dashboard → **Needs result**; it should be 0. |
| **Once a week** | On the droplet: `tail -3 /var/log/cgyballers-backup.log` (expect recent "ok" lines). Glance at your Cloudflare dashboard for visitor trends. |
| **Once a month** | Copy the backups to your computer (the `scp` command in 2.6). |
| **Before a risky change** | Take a backup on demand: `/opt/cgyballers/scripts/backup.sh` |

---

## 5. Still to do

1. **Google Search Console** (you, about 10 minutes, free). This is the
   step that gets Google to actually find the site.
   1. Go to <https://search.google.com/search-console> and sign in.
   2. **Add property → URL prefix** → `https://cgyballers.gacs.me`
   3. Choose the **HTML tag** verification method and send the tag to
      Claude to add to the site.
   4. After verifying: **Sitemaps** → enter `sitemap.xml` → Submit.
   5. **URL Inspection** → paste the home page address → **Request
      indexing**.
2. **Add the league's city** to the site description, to help local
   searches.
3. **Security, remaining items** (free, quick):
   - limit failed admin-login attempts (stops password guessing)
   - security headers in Nginx (e.g. stops other sites embedding yours in a
     frame)
4. **Optional:** DigitalOcean Backups (see section 3).
