// Everything about logging in: reading the cookie, sessions, requireAuth,
// and the /api/login, /api/logout and /api/me routes.
import express from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool } from '../scripts/db.mjs';

const router = express.Router();

const COOKIE_NAME = 'cgyballers_session';

// The browser sends every cookie in one header: "a=1; b=2". Pull out the
// one we want. Split on the first "=" only (values may contain "="), and
// treat bad %-encoding as "no cookie" rather than a 500.
function readCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i === -1 || part.slice(0, i).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}

// Logins are sessions: the cookie holds a long random token, and the
// `sessions` table says which user it belongs to and until when. Only a
// SHA-256 hash of the token is stored, so a leaked database or backup
// can't be used to log in.
const SESSION_DAYS = 7;
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Attach this to any route that should require being logged in.
// It looks up the cookie's token in `sessions` and only lets the request
// continue if it exists and hasn't expired.
export async function requireAuth(req, res, next) {
  const token = readCookie(req, COOKIE_NAME);
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  const result = await pool.query(
    `SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hashToken(token)]
  );
  if (!result.rows[0]) return res.status(401).json({ error: 'Invalid or expired session' });
  req.user = result.rows[0];
  next();
}

router.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  const user = result.rows[0];

  const valid = user && (await bcrypt.compare(password, user.password_hash));
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // crypto.randomBytes, never Math.random(): the token must be unguessable.
  // A fresh token on every login, so an old one can't be reused.
  const token = crypto.randomBytes(32).toString('hex');
  await pool.query('DELETE FROM sessions WHERE expires_at <= now()'); // tidy up old logins
  await pool.query(
    `INSERT INTO sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, now() + make_interval(days => $3))`,
    [hashToken(token), user.id, SESSION_DAYS]
  );
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // JavaScript in the browser can't read this cookie — only the browser sends it automatically
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production', // only require HTTPS once deployed
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
  res.json({ username: user.username });
});

// Deleting the row is what actually logs out: even a copy of the cookie
// stops working. Clearing the cookie just tidies up the browser.
router.post('/api/logout', async (req, res) => {
  const token = readCookie(req, COOKIE_NAME);
  if (token) await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(token)]);
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

// Lets the Vue app ask "am I logged in?" on page load.
router.get('/api/me', requireAuth, (req, res) => {
  res.json({ username: req.user.username });
});

export default router;
