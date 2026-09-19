// One-time account creation. There is no public sign-up form on purpose —
// run this yourself whenever a new organizer/scorekeeper needs a login.
//
// Usage: node scripts/create-user.mjs <username> <password>

import bcrypt from 'bcryptjs';
import { pool } from './db.mjs';

const [, , username, password] = process.argv;

if (!username || !password) {
  console.error('Usage: node scripts/create-user.mjs <username> <password>');
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 10);

await pool.query(
  `INSERT INTO users (username, password_hash) VALUES ($1, $2)
   ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
  [username, passwordHash]
);

console.log(`User "${username}" created/updated.`);
await pool.end();
