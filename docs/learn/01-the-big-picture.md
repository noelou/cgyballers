# 1. The big picture

## In one sentence
The site is four programs working together on one rented server: **Nginx**
(front door), the **Node API** (the logic), **pm2** (keeps the API alive),
and **PostgreSQL** (the data).

## Why there are layers at all
Each layer does **one job**. A restaurant works the same way:

| Restaurant | This project | Job |
|---|---|---|
| Host at the door | **Nginx** | Greets every visitor, sends them to the right place |
| Menu already printed | **Website files** (`dist/`) | Handed out as-is, no cooking needed |
| Kitchen | **Node API** | Does the actual work: logins, saving scores, stats |
| Manager | **pm2** | If the kitchen stops, gets it running again |
| Storage room | **PostgreSQL** | Where all the ingredients (data) are kept |

One program *could* do everything, but then one problem breaks
everything. Split up, each piece is simpler and can fail on its own.

## What happens when someone visits
1. The browser asks for `https://cgyballers.gacs.me`.
2. The domain points to the droplet's IP address (`159.223.81.97`).
3. The **firewall** lets the request in (port 443 = HTTPS).
4. **Nginx** looks at the URL:
   - A page or file → sends it from `dist/`, done.
   - A photo → sends it from `uploads/`, done.
   - `/api/...` → passes it to the Node API.
5. The **API** asks **PostgreSQL** for data (e.g. the standings).
6. The API sends JSON back through Nginx to the browser.
7. The Vue app in the browser turns that JSON into the page you see.

## Two important words
- **Frontend** = the Vue app (`src/`). It runs **in the visitor's browser**.
- **Backend** = the API + database. It runs **on the server**.

The frontend can't touch the database directly. It always asks the API.
That's on purpose: the API decides who's allowed to do what.

## Local vs. live
On your computer (local) there's no Nginx and no pm2. You run Vite and
the API yourself in terminals. The live server adds Nginx, pm2, the
firewall and HTTPS. **The two databases are separate**: data entered on
`localhost` never shows up on the live site.

## Go deeper
- [`../HOW-THE-LIVE-SITE-WORKS.md`](../HOW-THE-LIVE-SITE-WORKS.md) — a
  bigger diagram plus a glossary of words like SSH, port and cron
- [`../APP-STRUCTURE.md`](../APP-STRUCTURE.md) — what each folder is for

Next: [2. Why Nginx →](./02-why-nginx.md)
