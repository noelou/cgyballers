import { pool } from './db.mjs';

const result = await pool.query('SELECT NOW()');
console.log('Connected. Server time:', result.rows[0].now);
await pool.end();
