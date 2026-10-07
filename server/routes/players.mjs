// Players: list, create, edit, and player photos.
import express from 'express';
import sharp from 'sharp';
import path from 'node:path';
import { unlink } from 'node:fs/promises';
import { pool } from '../../scripts/db.mjs';
import { requireAuth } from '../auth.mjs';
import { acceptPhoto, PLAYER_PHOTO_DIR } from '../uploads.mjs';
import { slugify } from '../slugify.mjs';

const router = express.Router();

router.get('/api/players', async (req, res) => {
  const result = await pool.query(`
    SELECT
      p.id, p.name, p.team_id AS team, t.name AS "teamName",
      p.number, p.position, p.position_label AS "positionLabel",
      p.height_cm AS "heightCm", p.height_display AS "heightDisplay",
      p.weight_kg AS "weightKg", p.age, p.experience, p.pic
    FROM players p
    JOIN teams t ON t.id = p.team_id
    ORDER BY p.name
  `);
  res.json(result.rows);
});

// New players get an id in the same style as the existing data,
// e.g. team "grit" + name "Dela Cruz" -> "grit-dela-cruz". If that id is
// already taken (e.g. two players with the same last name), -2, -3, ... is
// appended until it's unique.
async function generatePlayerId(team, name) {
  const base = `${team}-${slugify(name)}`;
  let id = base;
  let n = 2;
  while (true) {
    const existing = await pool.query('SELECT 1 FROM players WHERE id = $1', [id]);
    if (existing.rows.length === 0) return id;
    id = `${base}-${n}`;
    n++;
  }
}

// Creates a new player on a team's roster. Requires login.
router.post('/api/players', requireAuth, async (req, res) => {
  const { team, name, number, position, positionLabel, heightCm, heightDisplay, weightKg, age, experience, pic } =
    req.body;

  if (!team || !name) {
    return res.status(400).json({ error: 'team and name are required' });
  }

  const teamExists = await pool.query('SELECT 1 FROM teams WHERE id = $1', [team]);
  if (teamExists.rows.length === 0) return res.status(400).json({ error: 'Unknown team' });

  const id = await generatePlayerId(team, name);

  await pool.query(
    `INSERT INTO players
       (id, team_id, name, number, position, position_label, height_cm, height_display, weight_kg, age, experience, pic)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [id, team, name, number || null, position || null, positionLabel || null, heightCm || null, heightDisplay || null, weightKg || null, age || null, experience || null, pic || null]
  );

  res.status(201).json({ id });
});

// Edits an existing player. Requires login.
router.put('/api/players/:playerId', requireAuth, async (req, res) => {
  const { playerId } = req.params;
  const { team, name, number, position, positionLabel, heightCm, heightDisplay, weightKg, age, experience, pic } =
    req.body;

  if (!team || !name) {
    return res.status(400).json({ error: 'team and name are required' });
  }

  const result = await pool.query(
    `UPDATE players SET
       team_id = $1, name = $2, number = $3, position = $4, position_label = $5,
       height_cm = $6, height_display = $7, weight_kg = $8, age = $9, experience = $10, pic = $11
     WHERE id = $12
     RETURNING id`,
    [team, name, number || null, position || null, positionLabel || null, heightCm || null, heightDisplay || null, weightKg || null, age || null, experience || null, pic || null, playerId]
  );

  if (result.rows.length === 0) return res.status(404).json({ error: 'Player not found' });
  res.json({ id: playerId });
});

// Deletes a previously uploaded photo file. Photos committed under
// public/player-photos are left alone — only /uploads/ files are ours to remove.
async function removeUploadedPhoto(pic) {
  if (!pic?.startsWith('/uploads/player-photos/')) return;
  await unlink(path.join(PLAYER_PHOTO_DIR, path.basename(pic))).catch(() => {});
}

// Uploads/replaces a player's photo. Requires login. The image is cropped to
// a 400x400 square and re-encoded as WebP; the filename carries a timestamp
// so a replaced photo never shows a stale cached copy.
router.post('/api/players/:playerId/photo', requireAuth, acceptPhoto, async (req, res) => {
  const { playerId } = req.params;
  if (!req.file) return res.status(400).json({ error: 'Choose a JPG, PNG or WebP image' });

  const existing = await pool.query('SELECT pic FROM players WHERE id = $1', [playerId]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Player not found' });

  const filename = `${playerId}-${Date.now()}.webp`;
  try {
    await sharp(req.file.buffer)
      .rotate() // respect phone EXIF orientation
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 82 })
      .toFile(path.join(PLAYER_PHOTO_DIR, filename));
  } catch {
    return res.status(400).json({ error: 'That file could not be read as an image' });
  }

  const pic = `/uploads/player-photos/${filename}`;
  await pool.query('UPDATE players SET pic = $1 WHERE id = $2', [pic, playerId]);
  await removeUploadedPhoto(existing.rows[0].pic);
  res.json({ pic });
});

// Removes a player's photo (falls back to initials). Requires login.
router.delete('/api/players/:playerId/photo', requireAuth, async (req, res) => {
  const { playerId } = req.params;
  const existing = await pool.query('SELECT pic FROM players WHERE id = $1', [playerId]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Player not found' });

  await pool.query('UPDATE players SET pic = NULL WHERE id = $1', [playerId]);
  await removeUploadedPhoto(existing.rows[0].pic);
  res.json({ pic: null });
});

export default router;
