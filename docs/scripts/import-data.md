# `scripts/import-data.mjs`: seed the database from the old JSON files ⚠️

[← All scripts](./README.md)

**What it's for:** the one-time move from JSON files to Postgres. It reads
`src/data/teams.json`, `players.json`, `schedule.json`, `news.json`, and
every file in `src/data/boxscores/`, then writes them all into the
database.

**When to run:** only when setting up a **fresh** database (right after
`run-schema.mjs`) and you want some data to start from.

**How to run:** `node scripts/import-data.mjs`

**What it does, step by step:**

1. **Lines 4–16: read every JSON file.** `readJson` is a small helper that
   reads a file and parses it. For box scores it lists the folder
   (`readdir`), keeps only `.json` files, and reads them all at once with
   `Promise.all` (start every read at the same time, then wait for all of
   them).
2. **Lines 18–21: start a transaction.** Either the whole import lands, or
   none of it does.
3. **Lines 23–32: teams**, then **34–51: players**, then **53–65: games**,
   one upsert per row. The order matters: a player row points at a team
   (`team_id REFERENCES teams(id)` in the schema), so teams must exist
   first. The same goes for games before box scores.
4. **Lines 67–83: box scores.** For each game file, it records the source
   image path on the game, then upserts one `boxscore_lines` row per player.
   `Object.entries(b.lines)` turns `{ "grit-bardos": {pts: 12, ...} }` into
   `[["grit-bardos", {pts: 12, ...}]]` so it can loop over player/stats
   pairs.
5. **Lines 85–95: news.**
6. **Lines 97–104:** `COMMIT` if everything worked, `ROLLBACK` if anything
   threw, and always release the client and close the pool.

**Notice the renaming:** JSON uses `camelCase` (`positionLabel`, `homeScore`)
while database columns use `snake_case` (`position_label`, `home_score`).
The arrays passed to each query line the two up. The API does the reverse
(`AS "positionLabel"`) when reading, so the Vue pages still get the
camelCase shape they were written for.

**⚠️ Why it's dangerous on a live database:** every insert is an upsert,
so any row that exists in both places gets **overwritten with the old JSON
version**. Run it against production and every score or roster change made
in the admin dashboard since the move would be reverted to whatever the JSON
files said. It also doesn't delete anything, so you'd get a mix of old and
new. **Never run it on the droplet.** The JSON files are frozen legacy data
now; the database is the source of truth.
