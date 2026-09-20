# Bug: /players and /standings returned 403 on refresh

Found right after going live. Worth understanding fully since the same
mistake is easy to reintroduce with a new route or a new asset folder.

## Symptom

Clicking around the site (using the in-app nav links) worked completely
fine. But **directly loading or refreshing** `https://cgyballers.gacs.me/standings`
or `.../players` returned a **403 Forbidden**, and the browser's address
bar would silently gain a trailing slash (`/standings` → `/standings/`)
right before the error.

## Root cause

Vite copies everything under `public/` **verbatim** into the build output
(`dist/`) at the exact same path. Two folders under `public/` happened to
share their name with an actual app route:

- `public/players/` (player photo images) — collides with the `/players` route
- `public/standings/` (an unused reference image) — collides with the `/standings` route

Nginx's config serves the built app like this:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

`try_files` checks, in order: is there a *file* at this exact path? Is
there a *directory* at this path? If neither, fall back to `index.html`
(which is what makes client-side routing work for a single-page app).

The problem: `dist/players/` and `dist/standings/` **are real
directories** on disk. So the second check (`$uri/`) succeeds before ever
reaching the SPA fallback. And a bare request for a directory without a
trailing slash is, by Nginx's default behavior, met with a 301 redirect
to add the slash — which is the trailing-slash flash we saw — followed by
an attempt to serve an `index.html` *inside* that directory. There isn't
one (only images live there), and directory listing (`autoindex`) is
off, so Nginx returns `403 Forbidden`.

In short: **a same-named static folder can silently hijack an SPA
route**, and it only shows up on a direct load/refresh, not on
client-side navigation — which is exactly why it wasn't caught earlier
(local dev via `npm run dev` never hits real Nginx directory-matching
behavior, so this only surfaces once deployed).

## The fix

Renamed both folders so they no longer share a name with any route:

- `public/players/` → `public/player-photos/`
- `public/standings/` → `public/standings-photo/`

And updated everything that referenced the old path:

1. `src/data/players.json` — all 59 players' `pic` fields changed from
   `/players/...` to `/player-photos/...`.
2. `src/pages/admin/PlayerForm.vue` — the photo-path input's placeholder
   text, so future admin edits use the right convention.
3. **The database** — both local dev and production Postgres already had
   the *old* `/players/...` paths (imported earlier from `players.json`),
   so a direct `UPDATE` was run against the `players` table's `pic`
   column on both, rather than re-running the whole import script (which
   would risk overwriting other data that has since diverged from the
   static JSON files, like game statuses set through the live admin
   panel).

`public/standings/standings.jfif` wasn't referenced anywhere in the code
(it looks like a leftover reference image), so that one just needed the
folder rename with no other changes.

## How to avoid this going forward

**Never name a folder directly under `public/` the same as a top-level
route.** Current top-level routes, as of this writing:

```
/, /news, /schedule, /games, /standings, /players, /teams, /admin
```

A sub-path like `/players/some-id` is fine — only an *exact* top-level
segment match causes this (`dist/players` colliding with `/players`, not
`dist/players/some-id` colliding with anything, since no file is
literally named `some-id` there). But it's simplest to just avoid the
exact route names entirely for any new folder under `public/`.

## How this was diagnosed and verified

The dev server (`npm run dev`) doesn't reproduce this — Vite's dev server
doesn't do Nginx-style directory matching. To actually reproduce and then
confirm the fix, `npm run preview` was used instead (serves the real
`dist/` build, much closer to production behavior):

```bash
npm run build
npm run preview -- --port 4173
curl -I http://localhost:4173/standings   # 403 before the fix, 200 after
curl -I http://localhost:4173/players     # same
```

Worth reaching for `vite preview` again for any future "works in dev, not
sure about production" question — it's the closest thing to a local
production environment without needing the actual droplet.
