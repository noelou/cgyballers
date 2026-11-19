# Learn how CGYBallers works — start here

A short learning path for someone new to web servers. Each file is one
topic and takes a minute or two to read. Read them in order.

| # | File | You'll learn |
|---|---|---|
| 1 | [The big picture](./01-the-big-picture.md) | The pieces of the live site and how a visit flows through them |
| 2 | [What is Node](./02-what-is-node.md) | The program that runs the API, the build and the scripts, and why Vue doesn't run in it |
| 3 | [Why Nginx](./03-why-nginx.md) | The "front door", and what happens without it |
| 3b | [Our Nginx config, line by line](./03b-nginx-config-explained.md) | Every instruction in our config, explained |
| 4 | [Why pm2](./04-why-pm2.md) | What keeps the API running |
| 5 | [The API (REST)](./05-the-api-rest.md) | What REST means and how one request travels |
| 6 | [The database](./06-the-database.md) | Where the league data lives, and backups |
| 7 | [Security basics](./07-security-basics.md) | What protects the site, and what's still open |
| 8 | [Review checklist](./08-review-checklist.md) | Things to check and understand yourself |
| 9 | [When one server isn't enough](./09-growing-the-site.md) | Extra, for curiosity: load balancers, scaling, and when sites need many servers |

## The whole site in one picture

```
Visitor's browser
      │  https://cgyballers.gacs.me
      ▼
┌─────────────── DigitalOcean droplet (the server) ───────────────┐
│  Firewall ── lets in only ports 22, 80, 443                     │
│      ▼                                                          │
│  Nginx ──── website files (dist/), photos (uploads/)            │
│      │                                                          │
│      └─ /api/... ──► Node API (Express), kept alive by pm2      │
│                          │                                      │
│                          ▼                                      │
│                      PostgreSQL database                        │
└─────────────────────────────────────────────────────────────────┘
```

Every file in this folder has the same shape: **what it is → why we need
it → what if we didn't have it → is it heavy / is it normal today → where
it lives in this project → go deeper**.

These files explain the *why*. For exact commands and details, they link to
the other folders in `docs/` (for example
[`../deploy/02-deploying-changes.md`](../deploy/02-deploying-changes.md)
for shipping updates).
