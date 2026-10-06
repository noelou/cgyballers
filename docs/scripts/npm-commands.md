# `package.json` scripts (`npm run ...`)

[← All scripts](./README.md)

`npm run <name>` looks up `<name>` under `"scripts"` in `package.json` and
runs that command. They're just shortcuts:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "server": "node server/index.mjs"
}
```

## `npm run dev`: the website, for development

Starts **Vite**, the dev server, at `http://localhost:5173`. It serves your
Vue files straight from `src/` and **hot-reloads**: save a `.vue` or `.css`
file and the browser updates instantly.

`vite.config.js` also sets up a **proxy**:

```js
proxy: {
  '/api': 'http://localhost:3001',
  '/uploads': 'http://localhost:3001',
},
```

So when a page calls `fetch('/api/teams')`, Vite forwards it to the API
server. **This is why `npm run server` must be running too**; otherwise
every page that loads data shows an error.

## `npm run server`: the API

Runs `node server/index.mjs`, which starts the Express API on port 3001
(see the [server tour](./server.md)). Unlike Vite, it does **not** reload when you edit it. After changing
`server/index.mjs`, stop it (`Ctrl+C`) and start it again.

In production, `pm2` runs this same file and keeps it alive (restarting it
if it crashes). That's why deploying a server change needs
`pm2 restart cgyballers-api`; see [`DEPLOYING-CHANGES.md`](../DEPLOYING-CHANGES.md).

## `npm run build`: produce the production website

Compiles everything in `src/` into plain HTML/CSS/JS in `dist/`, and
copies `public/` in alongside. Nginx serves `dist/` in production. Only the
**frontend** is built. The server runs as-is and has no build step.

## `npm run preview`: test the build locally

Serves the already-built `dist/` folder (on port 4173) so you can click
through exactly what production will serve. Optional, but handy when
something works in `dev` and breaks after `build`.
