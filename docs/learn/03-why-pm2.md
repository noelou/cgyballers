# 3. Why pm2

## In one sentence
pm2 is a **babysitter for the Node API**: it keeps it running in the
background and restarts it if it stops.

pm2 is **not** part of Node or Nginx. It's a separate program, installed
once on the droplet with `npm install -g pm2`. Nginx forwards requests to
port 3001; pm2 makes sure something is actually listening there.

## First: two different computers
It's easy to mix these up, so keep this picture in mind:

```
 Your laptop (Windows)                 The droplet (DigitalOcean, Ubuntu)
 ─────────────────────                 ──────────────────────────────────
 Code editor, Claude Code              Nginx
 Terminal ── SSH connection ────────▶  Node API (cgyballers-api)
                                       Postgres
                                       Runs 24/7 in a data center
```

The droplet is always on. Your laptop is just a **remote control** for it.
Turning your laptop off does **not** take the site down.

## What "running" means
When you type `node server/index.mjs`, the computer starts a **process**:
a running program with its own memory. The API *is* that process, sitting
on port 3001 waiting for Nginx to hand it requests.

A process doesn't live forever. It stops when:
- whoever started it goes away (your login session ends),
- it crashes, or
- the machine restarts.

Each of those is a scenario below.

## Scenarios: what goes wrong without pm2

### 1. "I logged out"
> You SSH into the droplet, type `node server/index.mjs`, see "API server
> running", and close the terminal.

SSH gives you a **login session** on the droplet. Anything started by hand
inside that session belongs to it. When the session ends (you close the
window, your laptop sleeps, Wi-Fi drops), the droplet stops everything
that was started inside it.

The droplet stays on, but the API process is gone.

- **Visitors see:** pages still load (Nginx serves those), but scores,
  standings, stats and admin login fail. Every `/api/...` request gets a
  **502 Bad Gateway**, because nothing is listening on 3001.
- **With pm2:** the API is started in the background, owned by pm2 and not
  by your session. Log out all you like.

### 2. "A crash at 11 PM"
> Saturday night after games. Postgres briefly drops a connection, or some
> code path throws an error nobody caught. Node prints the error and exits.

A Node process that hits an uncaught error **stops completely**. It doesn't
recover by itself.

- **Without pm2:** the API stays down until someone notices, maybe the next
  morning when a player says "the site's broken."
- **With pm2:** pm2 sees it exit and starts a new one in a second or two.
  Maybe one request fails. The error is saved in `pm2 logs`.

This is the big one. pm2 turns "down all night" into "a hiccup nobody
noticed."

### 3. "The server rebooted"
> DigitalOcean does maintenance, or you `sudo reboot` after an Ubuntu update.

After a reboot, Nginx and Postgres come back on their own (see the tree
below). The API is just a program somebody once typed, so it does **not**.

- **With pm2:** `pm2 startup` registers pm2 to start at boot, and `pm2 save`
  records which apps it was running. On boot, pm2 brings `cgyballers-api`
  back.

### 4. "Something broke an hour ago, what happened?"
A background process has no terminal to print to, so without a manager its
output is lost. pm2 saves it to log files, so `pm2 logs cgyballers-api`
shows the actual error and when it happened.

### 5. "I deployed new code"
> You `git pull` a fix on the droplet.

The running process still has the **old code in memory**. It read the files
once, when it started. `pm2 restart cgyballers-api` stops it and starts it
again on the new code.

### Summary

| Event | Without pm2 | With pm2 |
|---|---|---|
| You log out | API dies, 502s | Keeps running |
| Crash | Down until a human notices | Back in ~1 sec |
| Reboot | Down until a human notices | Back on boot |
| Something went wrong | Output lost | In `pm2 logs` |
| New code | Kill and start by hand | `pm2 restart` |

## Who keeps what alive
Every long-running program on the droplet has a babysitter:

```
 DigitalOcean          keeps the machine on
 └── systemd           (built into Ubuntu)
      ├── Nginx
      ├── Postgres
      └── pm2          (set up by `pm2 startup`)
           └── Node API (cgyballers-api)
```

Nginx and Postgres got a babysitter (systemd) when they were installed.
The API is our own code, so nobody watches it automatically. pm2 fills
that gap.

Nginx can't do this job: it can serve files and **forward** requests, but
it can't run, watch or restart Node code.

## Is it heavy?
No. It's a small Node program that mostly sleeps and watches.

## Is it good practice today?
Yes, for a single server running Node. Alternatives you may hear about:
- **systemd**: you could have systemd watch the API directly, the same way
  it watches Nginx. No extra install, but a little more setup.
- **Docker**: packages the app in a container with restart rules. Popular
  on bigger setups; more to learn.
- **Managed hosting** (DigitalOcean App Platform, Render, Railway): they run
  and restart the app for you. You don't manage a server, but it costs more.
- **Don't use** `nohup node server/index.mjs &` (or `screen`/`tmux`) for the
  live site. It survives logout but not a crash or a reboot.

Any of the first three is fine. pm2 is the easiest for a Node beginner.

## Where it lives
On the droplet. The API is registered under the name `cgyballers-api`.

| Command | What it does |
|---|---|
| `pm2 status` | Is the API running? Look for `online` |
| `pm2 logs cgyballers-api --lines 30` | Recent output and errors. **Look here first when something's wrong** |
| `pm2 restart cgyballers-api` | Load new server code after a deploy |

**Gotcha:** after changing `.env`, a plain `pm2 restart` may keep the old
values. Use the full command in `DEPLOYING-CHANGES.md`, step 5.

## Try it yourself (on your laptop, not the droplet)
This shows scenarios 1 and 2 with your own eyes. It's safe: it only
touches your laptop, and the live site isn't involved. You need your local
Postgres running, like when you normally use `npm run server`.

Run all commands from the project folder in **PowerShell**.

### Part A: without pm2
1. Open a terminal and start the API by hand:
   ```
   npm run server
   ```
   You'll see `API server running at http://127.0.0.1:3001`.
2. Open <http://127.0.0.1:3001/api/teams> in your browser. You get JSON
   with the teams. ✅
3. **Close that terminal window** (the X button, not Ctrl+C).
4. Refresh the browser tab. It fails ("can't reach this page"). ❌

   That's scenario 1: the API belonged to the terminal, so it died with it.

### Part B: with pm2
1. Install pm2 on your laptop (one time):
   ```
   npm install -g pm2
   ```
2. Start the API under pm2. Use a test name, so it's obviously not the
   live one:
   ```
   pm2 start server/index.mjs --name cgy-test
   pm2 status
   ```
   `cgy-test` shows as `online`. Note the **pid** and **↺** (restarts)
   columns.
3. Refresh <http://127.0.0.1:3001/api/teams>. It works. ✅
4. **Close the terminal window.** Open a new one and refresh the browser.
   It **still works.** ✅ pm2 owns the API now, not the terminal.
5. Now fake a crash. In the new terminal, kill the process with the pid
   from `pm2 status`:
   ```
   taskkill /PID <the pid> /F
   pm2 status
   ```
   It's `online` again with a **new pid**, and **↺ went up by 1**. pm2
   noticed it died and started a new one. Refresh the browser and it
   works. ✅ That's scenario 2.
6. Look at what pm2 recorded:
   ```
   pm2 logs cgy-test --lines 20 --nostream
   ```
   You'll see the startup line twice, once for each start.

### Clean up
```
pm2 delete cgy-test
pm2 kill
```
After this, nothing from the exercise is left running, and you go back to
using `npm run server` like before.

(The reboot part, scenario 3, isn't in the exercise: `pm2 startup` is for
Linux servers and doesn't work on Windows. On the droplet it's already set
up.)

## Go deeper
- [`../DEPLOYING-CHANGES.md`](../DEPLOYING-CHANGES.md): when to restart,
  and troubleshooting

Next: [4. The API (REST) →](./04-the-api-rest.md)
