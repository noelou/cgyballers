// The API server's entry point: creates the app, plugs in each group of
// routes, and starts listening. The routes themselves live in:
//   auth.mjs           login, logout, /api/me, requireAuth
//   routes/teams.mjs   teams + featured photos
//   routes/players.mjs players + player photos
//   routes/games.mjs   schedule, game status, box scores
//   routes/public.mjs  player stats, standings, playoffs, sitemap
import express from 'express';
import cors from 'cors';
import { UPLOAD_DIR } from './uploads.mjs';
import authRoutes from './auth.mjs';
import teamRoutes from './routes/teams.mjs';
import playerRoutes from './routes/players.mjs';
import gameRoutes from './routes/games.mjs';
import publicRoutes from './routes/public.mjs';

const app = express();
// credentials: true is required for the browser to send/receive the login
// cookie — without it, fetch() silently drops it.
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '365d', immutable: true }));

app.use(authRoutes);
app.use(teamRoutes);
app.use(playerRoutes);
app.use(gameRoutes);
app.use(publicRoutes);

const port = process.env.API_PORT || 3001;
// Loopback only: Nginx (production) and Vite's dev proxy reach the API
// from the same machine, so there's no reason to expose it to the network.
const host = process.env.API_HOST || '127.0.0.1';
app.listen(port, host, () => {
  console.log(`API server running at http://${host}:${port}`);
});
