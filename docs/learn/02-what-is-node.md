# 2. What is Node

## In one sentence
Node is a program that runs **JavaScript outside the browser**, on a
computer or a server. In this project it runs the API, the build tool and
the scripts.

## First: the language vs. the worker
JavaScript is a **language**. On its own it can't do anything. Something
has to read it and carry it out.

- The **browser** (Chrome, Safari) is one worker that speaks JavaScript.
  It works at the shop counter: it can change the page the visitor sees,
  but it can't open files on the server or talk to the database.
- **Node** is another worker that speaks the same language. It works in
  the back office: it can read files, open network ports and talk to
  Postgres.

Same language, two different workplaces. That's the most important idea on
this page.

## Node does three jobs here

| Job | Files | How it behaves |
|---|---|---|
| **1. The API server** | `server/index.mjs`, `server/routes/*.mjs` | Starts and **keeps running**, waiting for requests on port 3001. |
| **2. The build tool** | Vite (`npm run dev`, `npm run build`) | Node runs Vite, which **prepares** the Vue code for the browser. |
| **3. One-off scripts** | `scripts/*.mjs` | Run, do one task (test the database, create a user), then **exit**. |

### The trap: Vue does not run in Node
`src/` (Vue) and `server/` are both JavaScript, so it's easy to think they
run in the same place. They don't:

```
 src/   (Vue pages)      ──► runs in the VISITOR'S BROWSER (their phone/laptop)
 server/ (the API)       ──► runs in NODE, on the droplet
 scripts/                ──► runs in NODE, when you type the command
```

Node only *builds* the Vue code (job 2). After `npm run build`, the result
is plain files in `dist/`. On the live site, Nginx hands those files to
the browser, and Node isn't involved at all. The two sides only talk
through `/api/...` requests.

## Why Node, and not something else?
The API could be written in PHP, Python or Java. Node was picked because
the frontend is already JavaScript, so **one language covers the whole
project**. You learn it once and can read every file.

## What if we didn't have Node?
- No API: the site couldn't save scores, log in admins or read live data
  from Postgres. It would be back to hand-edited JSON files.
- No Vite: the `.vue` files couldn't be turned into something a browser
  understands.
- No scripts: tasks like creating an admin user would mean typing SQL by
  hand.

## npm, `package.json` and `node_modules`
Node comes with **npm**, a tool that downloads packages (code other people
wrote).

| Thing | Analogy | What it is |
|---|---|---|
| `package.json` | The shopping list | Which packages the project needs, plus short commands like `npm run server` |
| `npm install` | Going shopping | Reads the list and downloads everything |
| `node_modules/` | The storeroom | Where the downloaded packages are kept. Huge, never edited by hand, not in git |

From our shopping list, these are used **by Node** (the API and scripts):

| Package | Job |
|---|---|
| `express` | Makes the API server: "when `/api/teams` is asked for, run this function" |
| `pg` | Talks to Postgres |
| `dotenv` | Reads `.env` into `process.env` |
| `bcryptjs` | Hashes passwords |
| `multer`, `sharp` | Receive uploaded photos and resize them |
| `cors` | Rules about which websites may call the API |

`vue` and `vue-router` are also on the list, but they end up running **in
the browser**. Vite just bundles them into `dist/`.

`npm run server` is only a shortcut. It looks up `"server"` in
`package.json` and runs `node server/index.mjs`.

## How one Node worker serves many people
Node handles all visitors with **one** worker. That sounds slow, but think
of a waiter, not a cook: the waiter takes table 1's order, gives it to the
kitchen, and **doesn't stand there waiting**. While the kitchen cooks, the
waiter takes table 2's order.

In this project the kitchen is Postgres. When the code says
`await pool.query(...)`, Node sends the question to Postgres and serves
other requests while waiting for the answer. That's what `await` means:
"come back here when the answer is ready."

The catch: if one request makes the worker **crash** (an error nobody
caught), the whole API stops for everyone. That's why pm2 exists
(see [4. Why pm2](./04-why-pm2.md)).

## Local vs. live

| | Your laptop | The droplet |
|---|---|---|
| Job 1, API | `npm run server`, in a terminal | Kept running by pm2 |
| Job 2, Vite | `npm run dev` (live preview at port 5173) | `npm run build` once per deploy, then not running |
| Job 3, scripts | Whenever you need one | Whenever you need one, over SSH |
| Node version | Check with `node -v` | Installed as Node 20 (see `../deploy/03-first-time-setup.md`, step 2) |

Locally, Vite also passes `/api/...` requests on to port 3001 (see
`vite.config.js`). On the live site, Nginx does that job instead.

> ⚠️ **Watch out:** your laptop and the droplet may have different Node
> versions. Something that works on a newer Node can fail on an older one.
> If code works locally but crashes on the droplet, compare `node -v` on
> both.

## Is it heavy?
No. The API is one small Node process that uses little memory and mostly
sits waiting for requests. Vite never runs on the droplet, apart from the
build step.

## Is it good practice today?
Yes. Node with Express is one of the most common ways to build a small
API, so most tutorials and answers online fit this project.

## Try it yourself (on your laptop, about 10 minutes)
Run these from the project folder in PowerShell.

1. **Is Node installed?**
   ```
   node -v
   ```
   You see a version like `v24.x.x`.
2. **Talk to Node directly:**
   ```
   node
   ```
   Type `1 + 1` and press Enter. Node answers `2`. You're running
   JavaScript with no browser at all. Press Ctrl+C twice to leave.
3. **A script (job 3):** with your local Postgres running,
   ```
   node scripts/test-db.mjs
   ```
   It prints `Connected. Server time: ...` and **gives the prompt back**.
   The script did its one task and exited.
4. **A server (job 1):**
   ```
   npm run server
   ```
   It prints `API server running at http://127.0.0.1:3001` and **does
   not give the prompt back**. It's waiting for requests. Open
   <http://127.0.0.1:3001/api/teams> in your browser to send it one.
   Press Ctrl+C to stop it.
5. **Prove Vue isn't in Node:** with the server from step 4 still
   running, open <http://127.0.0.1:3001/>. You get `Cannot GET /`, not
   the website. The API only knows `/api/...` (plus photos and the
   sitemap). The pages come from Vite (`npm run dev`) locally, or from
   `dist/` on the live site.

Steps 3 and 4 side by side are the whole difference between a script and
a server.

## Where it lives
- `package.json`: the shopping list and the `npm run` shortcuts
- `server/`: the API (job 1)
- `vite.config.js`: Vite's settings (job 2)
- `scripts/`: the one-off scripts (job 3)
- `node_modules/`: downloaded packages (don't edit)

## Go deeper
- [`../scripts/node-basics.md`](../scripts/node-basics.md): the Node
  syntax you'll see in every file (`import`, `await`, `process.env`)
- [`../scripts/npm-commands.md`](../scripts/npm-commands.md): what each
  `npm run` command does
- [`../architecture/app-structure.md`](../architecture/app-structure.md):
  what runs first when the app starts

Next: [3. Why Nginx →](./03-why-nginx.md)
