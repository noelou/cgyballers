// Shared photo-upload setup, used by the team and player photo routes.
import multer from 'multer';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';

// Admin-uploaded files live outside dist/ and public/ so `npm run build` and
// `git pull` never touch them. Served at /uploads/... (proxied by Nginx in
// production, by Vite's dev proxy locally). Not in git — back it up separately.
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'uploads');
export const PLAYER_PHOTO_DIR = path.join(UPLOAD_DIR, 'player-photos');
export const FEATURED_PHOTO_DIR = path.join(UPLOAD_DIR, 'featured-photos');
await mkdir(PLAYER_PHOTO_DIR, { recursive: true });
await mkdir(FEATURED_PHOTO_DIR, { recursive: true });

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
});

// Middleware: reads the "photo" file from the form into req.file, turning
// "too big" into a friendly 400 instead of a 500.
export function acceptPhoto(req, res, next) {
  photoUpload.single('photo')(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Photo must be 5 MB or smaller' });
    if (err) return next(err);
    next();
  });
}
