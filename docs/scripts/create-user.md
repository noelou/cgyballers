# `scripts/create-user.mjs`: add an admin login

[← All scripts](./README.md)

```js
import bcrypt from 'bcryptjs';
import { pool } from './db.mjs';

const [, , username, password] = process.argv;     // read the two arguments

if (!username || !password) {                      // forgot one? print usage and stop
  console.error('Usage: node scripts/create-user.mjs <username> <password>');
  process.exit(1);                                 // non-zero exit code = "failed"
}

const passwordHash = await bcrypt.hash(password, 10);   // scramble the password

await pool.query(
  `INSERT INTO users (username, password_hash) VALUES ($1, $2)
   ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
  [username, passwordHash]
);

console.log(`User "${username}" created/updated.`);
await pool.end();
```

**What it's for:** the admin dashboard has no sign-up page on purpose. This
script is the only way to create an account.

**When to run:** someone new needs to enter scores, or someone forgot their
password. Because of the upsert, running it with an **existing** username
just **resets that user's password**.

**How to run:** `node scripts/create-user.mjs noel "a-strong-password"`.
Run it on the droplet to create a production login, or locally for a local
one. They're separate databases.

**Why `bcrypt.hash`:** the database never stores the real password, only a
one-way scrambled version (a **hash**). At login, the server hashes what
was typed and compares the two (`bcrypt.compare` in `server/index.mjs`). If
the database ever leaked, the actual passwords still wouldn't. The `10` is
the "cost": how slow hashing is on purpose, which makes guessing millions of
passwords impractical.

**Safety:** safe. One small heads-up: the password you type is saved in
your terminal's command history. Pick a password you're fine with living
there, or clear your history afterward.
