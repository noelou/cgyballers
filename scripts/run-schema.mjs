import { readFile } from 'node:fs/promises';
import { pool } from './db.mjs';

const sql = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf-8');

await pool.query(sql);
console.log('Schema applied.');

await pool.end();
