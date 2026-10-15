# 3. Why pm2

## In one sentence
pm2 is a **babysitter for the Node API**: it keeps it running in the
background and restarts it if it stops.

pm2 is **not** part of Nginx. They're separate tools that don't know about
each other. Nginx forwards requests to port 3001; pm2 makes sure
something is actually listening there.

## Why we need it
You could start the API by typing `node server/index.mjs`. On a server,
that has three problems:

| Problem | What pm2 does |
|---|---|
| Close your SSH window → the API stops | Runs it in the background, separate from your login |
| The API crashes (a bug) → it stays down | Restarts it automatically within a second or two |
| The server reboots → the API doesn't come back | Starts it again at boot (set up with `pm2 startup` + `pm2 save`) |

## What if we didn't have it?
The site would work only until the first crash, reboot, or the moment you
log out. Then the pages would still load (thanks to Nginx), but every
score, standing and login would fail until someone noticed and restarted
it by hand.

## Is it heavy?
No. It's a small Node program that mostly sleeps and watches.

## Is it good practice today?
Yes, for a single server running Node. Alternatives you may hear about:
- **systemd**: Linux's built-in service manager. It does the same job
  with no extra install, but is a little more setup.
- **Docker**: packages the app in a container with restart rules. Popular
  on bigger setups; more to learn.

Any of these is fine. pm2 is the easiest for a Node beginner.

## Where it lives
On the droplet. The API is registered under the name `cgyballers-api`.

| Command | What it does |
|---|---|
| `pm2 status` | Is the API running? Look for `online` |
| `pm2 logs cgyballers-api --lines 30` | Recent output and errors. **Look here first when something's wrong** |
| `pm2 restart cgyballers-api` | Load new server code after a deploy |

**Gotcha:** after changing `.env`, a plain `pm2 restart` may keep the old
values. Use the full command in `DEPLOYING-CHANGES.md`, step 5.

## Go deeper
- [`../DEPLOYING-CHANGES.md`](../DEPLOYING-CHANGES.md) — when to restart,
  and troubleshooting

Next: [4. The API (REST) →](./04-the-api-rest.md)
