# `server/index.mjs`: the API server, section by section

[← All scripts](./README.md)

This is the one script that **keeps running**. It starts, listens on port
3001, and answers requests until you stop it. The layers (auth, database,
endpoints) and one request traced end to end are explained in
[`BACKEND_SETUP.md`](../BACKEND_SETUP.md). This page is a map of the file
itself, top to bottom, so you know where to look.

## Express in 30 seconds

**Express** is the library that turns "a request arrived for URL X" into
"run this function." Every endpoint follows the same shape:

```js
app.get('/api/teams', async (req, res) => {
//  ^^^  ^^^^^^^^^^   the handler: runs each time this URL is requested
//  HTTP method + path
  const result = await pool.query('SELECT ...');   // get data
  res.json(result.rows);                           // send it back as JSON
});
```

- `req` (**request**) is what came in: `req.params` (the `:gameId` part of
  the URL), `req.body` (JSON the browser sent), `req.cookies`.
- `res` (**response**) is what goes out: `res.json(...)`,
  `res.status(404).json({ error: ... })`.
- **Method** is the intent: `GET` reads, `POST` creates, `PUT` replaces or
  edits, `DELETE` removes.
- **Middleware** is a function that runs before the handler and can stop
  the request early. `requireAuth` is the important one here.

## The file, top to bottom

| Lines | Section | What it does |
| --- | --- | --- |
| 1–13 | Imports | Libraries, plus `pool` from `scripts/db.mjs` and `buildStandings` / `buildBracket` / `STAGES` / `buildPlayerStats` from `src/utils/`. The server reuses the **same** calculation files the Vue app uses, so standings, the bracket and stats are computed identically on both sides |
| 15–20 | App setup | Creates the app. `cors(...)` allows the Vite dev site (`localhost:5173`) to call it with cookies. `express.json()` parses JSON request bodies into `req.body`. `cookieParser()` fills `req.cookies` |
| 22 | `COOKIE_NAME` | Name of the login cookie: `cgyballers_session` |
| 24–38 | Uploads setup | Creates `uploads/player-photos/` and `uploads/featured-photos/` if missing, serves them at `/uploads/...`, and configures **multer** (handles file uploads): keep in memory, max 5 MB, only JPG/PNG/WebP |
| 40–52 | `requireAuth` | Middleware: reads the login cookie, verifies it with `JWT_SECRET`. Valid: `next()` continues to the handler. Missing or forged: `401 Not logged in` |
| 54–74 | `POST /api/login` | Looks up the user, `bcrypt.compare`s the password, and if it matches, signs a **JWT** (a tamper-proof token saying "this is user X," valid 7 days) and stores it in an `httpOnly` cookie that page JavaScript can't read |
| 76–84 | `/api/logout`, `/api/me` | Clear the cookie; "who am I?" check the admin pages call on load |
| 86–146 | Teams | `GET` lists teams with their player ids. `POST` creates (id generated from the name via `slugify`, with `-2`, `-3` added if taken). `PUT` edits, including the `rankedLast` setting |
| 148–197 | Team featured photos | `POST` uploads the home page matchup-card photo: **sharp** rotates it upright, crops to 640×640, converts to WebP, saves with a timestamp in the name so browsers don't show an old cached photo, then deletes the previous upload. `DELETE` removes it (the card falls back to the logo) |
| 199–282 | Players | Same pattern as teams: list, create (id = `team-name`, e.g. `grit-bardos`), edit |
| 284–333 | Player photos | Same as featured photos, but cropped to 400×400. `DELETE` removes the photo (falls back to initials) |
| 335–397 | Games | `GET` lists all games (plus `hasBoxscore`). `POST` adds one (ids continue `g1, g2, ...`; `stage` must be one of `STAGES`). `DELETE` removes one, and its box score goes with it (`ON DELETE CASCADE` in the schema) |
| 399–405 | `GET /api/player-stats` | Pulls every box-score line and runs `buildPlayerStats` to produce season averages |
| 407–445 | `PUT /api/games/:id/status` | Manually set a game to `scheduled` / `final` / `forfeit` / `cancelled`, and optionally its `stage`. Only the fields that make sense are kept: a forfeit keeps a winner but no score, a cancelled game keeps neither |
| 447–458 | `loadStandingsInputs` | Helper: loads the teams and games that standings and the bracket are computed from |
| 460–490 | `GET /sitemap.xml` | Builds the sitemap for Google from the database (Nginx proxies `/sitemap.xml` here). Games are listed only once they have a box score |
| 492–495 | `GET /api/standings` | Runs `buildStandings` on the loaded teams and games |
| 497–501 | `GET /api/playoffs` | The playoff bracket: `buildBracket`, seeded from the standings and advanced by playoff games |
| 503–541 | `GET /api/games/:id/boxscore` | Everything the box-score form needs: the game, both rosters, and any lines already saved (so reopening a scored game pre-fills the form) |
| 543–596 | `POST /api/games/:id/boxscore` | Saves every player's line in **one transaction**, adds up points per team to get the final score, and marks the game `final` |
| 598–604 | Start listening | `app.listen(3001, '127.0.0.1')`. Loopback only, so just Nginx and Vite's proxy on the same machine can reach it. From here the process stays alive, waiting for requests |

## Patterns worth noticing

- **Public vs. protected:** every `GET` is public (the website needs to
  read data without logging in). Every route that **changes** data has
  `requireAuth` before the handler. When you add a new write endpoint, add
  `requireAuth`.
- **Validate, then act:** handlers check input first and return early with
  a `400` (bad request) or `404` (not found) before touching the database.
- **Errors in `async` handlers:** this project uses Express 5, which
  automatically catches an error thrown inside an `async` handler and
  answers with a `500` instead of crashing the server. That's why the code
  can `throw err` after a `ROLLBACK`.
- **Hard-coded CORS origin:** `cors({ origin: 'http://localhost:5173' })`
  only matters locally. In production, Nginx serves the site and the API
  from the same domain, so the browser doesn't apply CORS at all.

## After editing the server

| Where | What to do |
| --- | --- |
| Locally | `Ctrl+C` in the `npm run server` terminal, then `npm run server` again |
| Production | `git pull`, then `pm2 restart cgyballers-api` (see [`DEPLOYING-CHANGES.md`](../DEPLOYING-CHANGES.md)). No `npm run build` needed for a server-only change |
