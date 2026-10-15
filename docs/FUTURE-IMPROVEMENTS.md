# Future improvements

Things worth doing later. Nothing here is broken or unsafe today — each
item says why it can wait. Strike an item through (`~~like this~~`) and
add the date when it's done.

## Router guard for all `/admin/*` pages

**Now:** only the Dashboard (`src/pages/admin/Dashboard.vue`) calls
`/api/me` on load and sends you to `/admin/login` if you're logged out.
The other admin pages (`/admin/teams`, `/admin/players/new`, ...) don't
check. If you open one directly while logged out, the page shows, and you
only find out when Save/Delete fails with a 401.

**Why it can wait:** the data is still safe. Every POST/PUT/DELETE route
on the server has `requireAuth`, so a logged-out save changes nothing.
This is a user-experience fix, not a security fix.

**The fix:** add a `router.beforeEach` in `src/router/index.js` that runs
before any `/admin/*` route except `/admin/login`, calls
`fetch('/api/me', { credentials: 'include' })`, and redirects to
`/admin/login` if it isn't `ok`. Then the check in `Dashboard.vue` can go
(it still needs `/api/me` for the username, or the guard can pass it along).

## Login rate limit

**Now:** `/api/login` accepts unlimited attempts, so someone could keep
guessing passwords.

**The fix:** count failed attempts per IP and answer `429 Too Many
Requests` after a few failures for some minutes (e.g. the
`express-rate-limit` package on the login route, or an Nginx
`limit_req` rule).

## Security headers

**Now:** responses don't set headers like `Content-Security-Policy`,
`X-Frame-Options` or `Strict-Transport-Security`.

**The fix:** add them in the Nginx config (see `DEPLOYMENT.md`, step 9)
or with the `helmet` package in `server/index.mjs`.
