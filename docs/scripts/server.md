# `server/`: the API server, file by file

[← All scripts](./README.md)

This is the one script that **keeps running**. It starts, listens on port
3001, and answers requests until you stop it. The layers (auth, database,
endpoints) and one request traced end to end are explained in
[`BACKEND_SETUP.md`](../BACKEND_SETUP.md). This page is a map of the
`server/` folder, so you know which file to open.

## The files

```
server/
  index.mjs           entry point: creates the app, plugs in the routes, starts listening
  auth.mjs            login, logout, /api/me, and requireAuth
  uploads.mjs         photo upload setup shared by teams and players
  slugify.mjs         "River Kings" -> "river-kings", for new ids
  routes/
    teams.mjs         teams + home page featured photos
    players.mjs       players + player photos
    games.mjs         schedule, game status, box scores
    public.mjs        player stats, standings, playoffs, sitemap
```

**Where to look:** a bug with logging in → `auth.mjs`. Player photos →
`routes/players.mjs`. Standings wrong → `routes/public.mjs` (and the
calculation itself in `src/utils/standings.js`).

`npm run server` (and `pm2` on the droplet) still start `server/index.mjs`;
it imports the rest.

## Express in 30 seconds

**Express** is the library that turns "a request arrived for URL X" into
"run this function." Every endpoint follows the same shape:

```js
router.get('/api/teams', async (req, res) => {
//     ^^^  ^^^^^^^^^^   the handler: runs each time this URL is requested
//     HTTP method + path
  const result = await pool.query('SELECT ...');   // get data
  res.json(result.rows);                           // send it back as JSON
});
```

- `req` (**request**) is what came in: `req.params` (the `:gameId` part of
  the URL), `req.body` (JSON the browser sent), `req.headers` (e.g. the raw
  `Cookie` header that `readCookie` reads).
- `res` (**response**) is what goes out: `res.json(...)`,
  `res.status(404).json({ error: ... })`.
- **Method** is the intent: `GET` reads, `POST` creates, `PUT` replaces or
  edits, `DELETE` removes.
- **Middleware** is a function that runs before the handler and can stop
  the request early. `requireAuth` is the important one here.

### Routers: how the files fit together

Each route file makes its own mini-app with `express.Router()`, adds its
routes to it, and exports it:

```js
// routes/teams.mjs
const router = express.Router();
router.get('/api/teams', ...);
export default router;
```

`index.mjs` then plugs each one into the main app:

```js
app.use(teamRoutes);
```

A request for `/api/teams` is checked against each plugged-in router in
turn until one has a matching route. To add a new group of routes, make a
new file the same way and add one `app.use(...)` line.

## The imports: who does what

Each file imports only what it uses. Packages without `./` or `../` come
from `node_modules/` (listed under `"dependencies"` in `package.json`). The
`node:` prefix means it's built into Node itself, no install needed.

**In one sentence:** **Express** runs the server, **cors** lets the
browser talk to it, **crypto + bcrypt** handle logins, **multer + sharp**
handle photos, **pool** talks to the database, and the **build...**
functions do the basketball maths.

| Import | Used in | Its job |
| --- | --- | --- |
| `express` | every file | **The server framework.** Listens for requests like `/api/teams` and decides which code answers them. `express.Router()` groups routes per file |
| `cors` | `index.mjs` | Lets the **dev website** (`localhost:5173`) call the server (`localhost:3001`). Browsers block calls between different ports unless the server allows it. Only matters locally; in production both are on the same domain |
| `crypto` (`node:crypto`) | `auth.mjs` | Built into Node. After a successful login, `crypto.randomBytes` makes a long **random session token** that goes into the cookie, and `createHash('sha256')` hashes it before it's saved in the `sessions` table |
| `bcryptjs` | `auth.mjs` | **Password hashing.** At login, `bcrypt.compare` checks the typed password against the scrambled one stored in `users` (the same library `create-user.mjs` uses to scramble it) |
| `multer` | `uploads.mjs` | Receives a **file upload** from the browser (the photo picker on Edit Player / Edit Team). Express can't read uploaded files on its own |
| `sharp` | `routes/teams.mjs`, `routes/players.mjs` | **Edits images:** rotates the photo upright, crops it square, shrinks it, and converts it to `.webp` |
| `path` (`node:path`) | `uploads.mjs`, photo routes | Joins folder names into paths safely, e.g. `uploads` + `player-photos`, with the right slashes on both Windows and Linux |
| `mkdir`, `unlink` (`node:fs/promises`) | `uploads.mjs`, photo routes | `mkdir` **creates a folder** (the upload folders, on startup). `unlink` **deletes a file** (the previous photo, when a new one is uploaded) |
| `pool` (`scripts/db.mjs`) | every file that queries | **The database connection.** Every `pool.query(...)` uses it. See [`db.md`](./db.md) |
| `buildStandings`, `buildBracket`, `buildPlayerStats` (`src/utils/`) | `routes/public.mjs` | Calculate standings, the playoff bracket, and season averages |
| `STAGES` (`src/utils/playoffs.js`) | `routes/games.mjs` | The list of allowed game stages, used to reject a bad `stage` when a game is added or edited |

bcrypt and the session work as a pair: **bcrypt checks your password
once**, at login; **the session remembers you're logged in** after that, so
you don't send your password on every click.

The `src/utils/` files are the **same files the website uses**. The server
borrows them so standings, the bracket and stats are calculated exactly the
same way everywhere.

## Each file, top to bottom

### `index.mjs`: the entry point

| Section | What it does |
| --- | --- |
| Imports | `express`, `cors`, `UPLOAD_DIR` from `uploads.mjs`, and the five routers |
| App setup | Creates the app. `cors(...)` allows the Vite dev site (`localhost:5173`) to call it with cookies. `express.json()` parses JSON request bodies into `req.body`. `express.static` serves uploaded photos at `/uploads/...` |
| `app.use(...Routes)` | Plugs in each router |
| Start listening | `app.listen(3001, '127.0.0.1')`. Loopback only, so just Nginx and Vite's proxy on the same machine can reach it. From here the process stays alive, waiting for requests |

### `auth.mjs`: logging in

Read this file top to bottom to follow a login from start to finish.

| Section | What it does |
| --- | --- |
| `COOKIE_NAME` | Name of the login cookie: `cgyballers_session` |
| `readCookie` | The browser sends all cookies in one `Cookie` header (`a=1; b=2`). This splits it and returns the one asked for. Splits on the first `=` only (values can contain `=`), and treats badly encoded values as "no cookie" so they get a `401`, not a `500`. Written by hand instead of using the `cookie-parser` package, since the server only ever reads this one cookie |
| `SESSION_DAYS`, `hashToken` | How long a login lasts, and the function that turns a token into its SHA-256 hash. Only the hash is stored, so a leaked database or backup can't be used to log in |
| `requireAuth` | Middleware (exported for the route files): reads the token with `readCookie`, hashes it, and looks it up in `sessions` (joined to `users`), checking it hasn't expired. Found: puts `{ id, username }` on `req.user` and calls `next()`. Missing, unknown or expired: `401` |
| `POST /api/login` | Looks up the user, `bcrypt.compare`s the password, and if it matches, makes a fresh random token, saves its hash in `sessions` (valid 7 days, and old expired rows are cleaned up), and stores the token in an `httpOnly` cookie that page JavaScript can't read |
| `POST /api/logout` | Deletes the session row (so even a copied cookie stops working) and clears the cookie |
| `GET /api/me` | "Who am I?" check the admin pages call on load |

### `uploads.mjs`: photo upload setup

| Section | What it does |
| --- | --- |
| Folders | `UPLOAD_DIR`, `PLAYER_PHOTO_DIR`, `FEATURED_PHOTO_DIR`. Creates `uploads/player-photos/` and `uploads/featured-photos/` on startup if missing |
| `photoUpload` | Configures **multer**: keep the file in memory, max 5 MB, only JPG/PNG/WebP |
| `acceptPhoto` | Middleware the photo routes put before their handler: reads the `photo` file into `req.file`, and turns "too big" into a friendly `400` |

### `slugify.mjs`

One function: `"River Kings"` → `"river-kings"`. Used by teams and players
to make new ids.

### `routes/teams.mjs`

| Section | What it does |
| --- | --- |
| `GET /api/teams` | Lists teams with their player ids |
| `POST /api/teams` | Creates a team (id generated from the name via `slugify`, with `-2`, `-3` added if taken) |
| `PUT /api/teams/:teamId` | Edits a team, including the `rankedLast` setting |
| `POST /api/teams/:teamId/featured-photo` | Uploads the home page matchup-card photo: **sharp** rotates it upright, crops to 640×640, converts to WebP, saves with a timestamp in the name so browsers don't show an old cached photo, then deletes the previous upload |
| `DELETE /api/teams/:teamId/featured-photo` | Removes it (the card falls back to the logo) |

### `routes/players.mjs`

| Section | What it does |
| --- | --- |
| `GET /api/players` | Lists every player with their team name |
| `POST /api/players` | Creates a player (id = `team-name`, e.g. `grit-bardos`) |
| `PUT /api/players/:playerId` | Edits a player |
| `POST /api/players/:playerId/photo` | Same as featured photos, but cropped to 400×400 |
| `DELETE /api/players/:playerId/photo` | Removes the photo (falls back to initials) |

### `routes/games.mjs`

| Section | What it does |
| --- | --- |
| `GET /api/games` | Lists all games (plus `hasBoxscore`) |
| `POST /api/games` | Adds a game (ids continue `g1, g2, ...`; `stage` must be one of `STAGES`) |
| `DELETE /api/games/:gameId` | Removes a game, and its box score goes with it (`ON DELETE CASCADE` in the schema) |
| `PUT /api/games/:gameId/status` | Manually set a game to `scheduled` / `final` / `forfeit` / `cancelled`, and optionally its `stage`. Only the fields that make sense are kept: a forfeit keeps a winner but no score, a cancelled game keeps neither |
| `GET /api/games/:gameId/boxscore` | Everything the box-score form needs: the game, both rosters, and any lines already saved (so reopening a scored game pre-fills the form) |
| `POST /api/games/:gameId/boxscore` | Saves every player's line in **one transaction**, adds up points per team to get the final score, and marks the game `final` |

### `routes/public.mjs`

| Section | What it does |
| --- | --- |
| `GET /api/player-stats` | Pulls every box-score line and runs `buildPlayerStats` to produce season averages |
| `loadStandingsInputs` | Helper: loads the teams and games that standings and the bracket are computed from |
| `GET /api/standings` | Runs `buildStandings` on the loaded teams and games |
| `GET /api/playoffs` | The playoff bracket: `buildBracket`, seeded from the standings and advanced by playoff games |
| `GET /sitemap.xml` | Builds the sitemap for Google from the database (Nginx proxies `/sitemap.xml` here). Games are listed only once they have a box score |

## Patterns worth noticing

- **Public vs. protected:** every `GET` is public (the website needs to
  read data without logging in). Every route that **changes** data has
  `requireAuth` before the handler. When you add a new write endpoint,
  import `requireAuth` from `auth.mjs` and add it.
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
