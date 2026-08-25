# Changelog

Running log of updates to the CGYBallers site. Newest entry on top.

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
