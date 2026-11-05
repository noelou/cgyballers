# Changelog

Running log of updates to the CGYBallers site. Newest entry on top.

## 2026-11-05 — Fairer playoff stat leaders, semifinal box scores

**Playoff stat leaders**
- Problem: playoff averages only needed 1 game, so a player from a team knocked out in the play-in (Aguhar, 36 pts in 1 game) led ahead of players on deep runs
- New rule: playoff averages (PPG, RPG, APG, SPG, BPG) need at least **half as many playoff games as the team that has played the most, rounded up**. It starts at 1 and grows on its own (3 after the semifinals)
- Totals (3-pointers made) only need 1 playoff game, since they already reward playing more
- Elimination round minimums are unchanged (5 games, 6 for rebounds)
- Rule shown on the Players page, the home leaders, and a new "Playoff Rules" card on the Playoffs page (with twice-to-beat / best-of-3 explained)
- Code: `playoffMinGp()` in `src/utils/leaders.js`, passed through `src/data/statsPhase.js`

**League data** (local database only, not yet pushed to live)
- Box scores entered from the scoresheets for `g78`–`g84`: Oct 18 (GLQ–Howon QF, Jacque Jons–ETS SF), Oct 21 and Oct 23 (both semis), Nov 4 (GLQ–Stampede SF game 3). Every playoff game so far now has a box score
- Oct 23 Jacque Jons: Villanueva's steal entered as a 2nd 3-point attempt so the rows match the sheet's totals
- Sheet errors kept as printed: Gumera (Oct 21), Ucab (Oct 21), Paña (Oct 23) points don't fit their 3PM/FTM
- To push: `node scripts/push-boxscores.mjs g78 g79 g80 g81 g82 g83 g84`

## 2026-09-29 — Forfeits, featured photos, admin redesign, SEO, backups, firewall

Plain-language walkthrough of all of this: [`docs/deploy/01-how-the-live-site-works.md`](./docs/deploy/01-how-the-live-site-works.md).

**League data**
- JME-JES dropped out: their 5 unscheduled games added as forfeit wins for the opponent (`g63`–`g67`, Sep 11, no time/venue)
- Games with no time now show "—" instead of crashing Schedule / Team / Game pages

**Admin**
- Featured player photos (home matchup cards) editable in Admin → Teams → Edit; stored in `teams.featured_photo` + `uploads/featured-photos/`. `src/data/featuredPlayers.js` removed
- Dashboard redesigned: grouped by date, tabs (Needs result / Upcoming / Completed / All), team filter
- Players: search + team filter; Teams: logos, spacing; all forms get shared input styles (`src/pages/admin/admin.css`)

**Search engines & sharing**
- Per-page titles/descriptions/canonical (`src/utils/seo.js`), Open Graph preview image, structured data, `robots.txt`, database-generated `/sitemap.xml`

**Fixes**
- Cloudflare Web Analytics never recorded anything (broken `data-cf-beacon` attribute) — fixed
- Production Nginx: added `/uploads/` (uploaded photos 404'd) and 6 MB upload limit (was 1 MB)

**Server / security**
- Nightly DB + uploads backup, 14 days kept (`scripts/backup.sh`, cron 03:00 PH); test-restored OK
- API listens on 127.0.0.1 only; UFW firewall on (22/80/443 only)

## 2026-08-24 — Team logos, real schedule, standings script

**Team logos**
- Added 12 team logo images to `public/logos/` (named to match each team's `id`)
- Added a `logo` field to every team in `src/data/teams.json` (and to the generator, `scripts/generate-data.mjs`, so it survives regeneration)
- `TeamBadge` (`src/components/TeamBadge.jsx`) now renders the logo image, falling back to the old colored-initials badge if a logo is missing or fails to load
- Applied badges/logos to the Standings page and Home page's mini-standings table for visual consistency

**Real schedule (Season 4 — Amlan's Cup)**
- Replaced the placeholder 66-game mock schedule with the real 30-game fixture list (Aug 5–30, 2026), transcribed from the schedule graphic
- `scripts/generate-data.mjs` now builds the schedule from a static `REAL_FIXTURES` list instead of a random round-robin generator
- Home's "Upcoming Games" now filters by date (not just status), so already-passed dates without a reported score don't show as "upcoming"

**Standings**
- Added `scripts/generate-standings.mjs` (`npm run gen:standings`) — recomputes `standings.json` from whatever's currently in `schedule.json`, without touching the schedule or anything else. This is the tool to run after manually entering game scores.
- Standings team names now use the same white/default text color everywhere (removed a per-team color override that made Home's mini-standings inconsistent with the full Standings page)

**Workflow established**
- Scores are entered manually in `src/data/schedule.json` (set `homeScore`/`awayScore` and flip `"status"` to `"final"`), then `npm run gen:standings` is run to update the standings table
- `npm run gen:data` should only be used when editing `REAL_FIXTURES` in the generator script itself — running it after manual schedule edits will overwrite them
