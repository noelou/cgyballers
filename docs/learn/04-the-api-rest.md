# 4. The API (REST)

## In one sentence
The API is the Node/Express program in `server/` that the Vue app talks
to for **all data**: games, teams, players, stats, and admin logins.

## What "REST" means
REST is a common **style** for designing an API. In plain terms:

1. **Every thing has a URL.** A game is `/api/games/g12`; all games are
   `/api/games`.
2. **The HTTP method is the action.**

   | Method | Means | Example |
   |---|---|---|
   | `GET` | read | `GET /api/games` → list the games |
   | `POST` | create | `POST /api/games` → add a game |
   | `PUT` | update | `PUT /api/games/g12` → edit game g12 |
   | `DELETE` | remove | `DELETE /api/games/g12` → delete it |

3. **Data goes in and out as JSON.**
4. **Each request stands alone.** The server doesn't "remember" you
   between requests, so every admin request carries the login cookie.

(The name stands for *REpresentational State Transfer*: sending a copy of
a thing's current data, as JSON, back and forth.)

## One request, start to finish (adding a game)
1. **Browser:** the admin form sends `POST /api/games` with the game as
   JSON, plus the login cookie.
2. **Nginx** sees `/api/` and passes it to the API.
3. **`requireAuth`** checks the cookie. Not logged in → answers `401`
   and stops.
4. **The route** checks the data (date present? two different teams?).
   Bad data → `400` with a message.
5. **The database** saves the game.
6. **The answer:** `201 Created` with the new game's id.

The server re-checks everything, even if the form already did, because
anyone can send requests without using your form.

## Status codes you'll see
| Code | Meaning |
|---|---|
| `200` / `201` / `204` | Worked (OK / created / done, nothing to send) |
| `400` | Bad request: something's missing or wrong |
| `401` | Not logged in |
| `404` | That thing doesn't exist |
| `500` | Bug on the server: check `pm2 logs` |

## Is it good practice today?
Yes. REST with JSON is still the most common way to build an API. You'll
also hear about **GraphQL** and **tRPC**; they're useful for bigger apps
but not needed here.

## Where it lives
| File | Handles |
|---|---|
| `server/index.mjs` | Starts the server, plugs in all routes |
| `server/auth.mjs` | Login, logout, `requireAuth` |
| `server/routes/games.mjs` | Schedule, results, box scores |
| `server/routes/teams.mjs`, `players.mjs` | Teams, players, photos |
| `server/routes/public.mjs` | Stats, standings, playoffs, sitemap |

## Go deeper
- [`../SERVER-FLOW.md`](../SERVER-FLOW.md) — step by step, with the login
  flow and a table of every route

Next: [5. The database →](./05-the-database.md)
