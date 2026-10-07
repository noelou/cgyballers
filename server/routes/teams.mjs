// Teams: list, create, edit, and the home page featured photo.
import express from 'express';
import sharp from 'sharp';
import path from 'node:path';
import { unlink } from 'node:fs/promises';
import { pool } from '../../scripts/db.mjs';
import { requireAuth } from '../auth.mjs';
import { acceptPhoto, FEATURED_PHOTO_DIR } from '../uploads.mjs';
import { slugify } from '../slugify.mjs';

const router = express.Router();

// Proof of concept: teams, shaped the same way teams.json is,
// so the Vue side barely has to change.
router.get('/api/teams', async (req, res) => {
  const result = await pool.query(`
    SELECT
      t.id, t.name, t.color, t.logo, t.venue, t.featured_photo AS "featuredPhoto",
      t.ranked_last AS "rankedLast",
      COALESCE(array_agg(p.id ORDER BY p.id) FILTER (WHERE p.id IS NOT NULL), '{}') AS "playerIds"
    FROM teams t
    LEFT JOIN players p ON p.team_id = t.id
    GROUP BY t.id
    ORDER BY t.name
  `);
  res.json(result.rows);
});

// New teams get an id from their name, e.g. "River Kings" -> "river-kings".
// If that id is already taken, -2, -3, ... is appended until it's unique.
async function generateTeamId(name) {
  const base = slugify(name);
  let id = base;
  let n = 2;
  while (true) {
    const existing = await pool.query('SELECT 1 FROM teams WHERE id = $1', [id]);
    if (existing.rows.length === 0) return id;
    id = `${base}-${n}`;
    n++;
  }
}

// Creates a new team. Requires login.
router.post('/api/teams', requireAuth, async (req, res) => {
  const { name, color, logo, venue } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const id = await generateTeamId(name);
  await pool.query('INSERT INTO teams (id, name, color, logo, venue) VALUES ($1, $2, $3, $4, $5)', [
    id,
    name,
    color || null,
    logo || null,
    venue || null,
  ]);

  res.status(201).json({ id });
});

// Edits an existing team (its id never changes, even if the name does —
// same as editing a player). Requires login.
router.put('/api/teams/:teamId', requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const { name, color, logo, venue, rankedLast } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const result = await pool.query(
    'UPDATE teams SET name = $1, color = $2, logo = $3, venue = $4, ranked_last = $5 WHERE id = $6 RETURNING id',
    [name, color || null, logo || null, venue || null, !!rankedLast, teamId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Team not found' });
  res.json({ id: teamId });
});

// Only deletes files this server uploaded — the original featured photos in
// public/featured/ ship with the code and are never removed.
async function removeUploadedFeaturedPhoto(pic) {
  if (!pic?.startsWith('/uploads/featured-photos/')) return;
  await unlink(path.join(FEATURED_PHOTO_DIR, path.basename(pic))).catch(() => {});
}

// Uploads/replaces a team's featured photo (home page matchup cards).
// Requires login. Cropped to a 640x640 square to match the card, re-encoded
// as WebP, timestamped filename so a replaced photo never shows stale.
router.post('/api/teams/:teamId/featured-photo', requireAuth, acceptPhoto, async (req, res) => {
  const { teamId } = req.params;
  if (!req.file) return res.status(400).json({ error: 'Choose a JPG, PNG or WebP image' });

  const existing = await pool.query('SELECT featured_photo FROM teams WHERE id = $1', [teamId]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Team not found' });

  const filename = `${teamId}-${Date.now()}.webp`;
  try {
    await sharp(req.file.buffer)
      .rotate() // respect phone EXIF orientation
      .resize(640, 640, { fit: 'cover' })
      .webp({ quality: 82 })
      .toFile(path.join(FEATURED_PHOTO_DIR, filename));
  } catch {
    return res.status(400).json({ error: 'That file could not be read as an image' });
  }

  const featuredPhoto = `/uploads/featured-photos/${filename}`;
  await pool.query('UPDATE teams SET featured_photo = $1 WHERE id = $2', [featuredPhoto, teamId]);
  await removeUploadedFeaturedPhoto(existing.rows[0].featured_photo);
  res.json({ featuredPhoto });
});

// Removes a team's featured photo (the card falls back to the logo). Requires login.
router.delete('/api/teams/:teamId/featured-photo', requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const existing = await pool.query('SELECT featured_photo FROM teams WHERE id = $1', [teamId]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Team not found' });

  await pool.query('UPDATE teams SET featured_photo = NULL WHERE id = $1', [teamId]);
  await removeUploadedFeaturedPhoto(existing.rows[0].featured_photo);
  res.json({ featuredPhoto: null });
});

export default router;
