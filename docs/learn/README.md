# Learn how CGYBallers works — start here

A short learning path for someone new to web servers. Each file is one
topic and takes a minute or two to read. Read them in order.

| # | File | You'll learn |
|---|---|---|
| 1 | [The big picture](./01-the-big-picture.md) | The pieces of the live site and how a visit flows through them |
| 2 | [Why Nginx](./02-why-nginx.md) | The "front door", and what happens without it |
| 2b | [Our Nginx config, line by line](./02b-nginx-config-explained.md) | Every instruction in our config, explained |
| 3 | [Why pm2](./03-why-pm2.md) | What keeps the API running |
| 4 | [The API (REST)](./04-the-api-rest.md) | What REST means and how one request travels |
| 5 | [The database](./05-the-database.md) | Where the league data lives, and backups |
| 6 | [Security basics](./06-security-basics.md) | What protects the site, and what's still open |
| 7 | [Review checklist](./07-review-checklist.md) | Things to check and understand yourself |

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
the older docs in `docs/` (for example `DEPLOYING-CHANGES.md` for shipping
updates).
