# 2. Why Nginx

## In one sentence
Nginx (say "engine-x") is the **front door** of the server. Every visit
reaches it first, and it decides what to send back.

## What it does for us
1. **Serves the website files** from `dist/` (very fast).
2. **Passes `/api/...` requests** to the Node API. This is called a
   *reverse proxy*. The API itself is hidden from the internet.
3. **Handles HTTPS** (the padlock). Certbot set up a free certificate
   that renews itself.
4. **Sets caching rules** so browsers don't re-download unchanged files,
   but always get the newest version after a deploy.
5. **Sends every unknown URL to `index.html`**, so refreshing
   `/players/some-name` works instead of showing "404 Not Found".

## What if we didn't have it?
If you just turned Nginx off, **the site would go down**: the API only
listens inside the server, and nothing would serve the website or
handle HTTPS.

To run with Node alone, you'd have to write all of the above yourself:
serving files, HTTPS and certificate renewal, redirects, caching. And
you'd have one big weak spot: **if Node crashes, the whole site is
down**. With Nginx, the pages still load while pm2 restarts the API.

## Is it heavy?
No. Nginx uses a few MB of memory and is built to handle thousands of
visitors at once. It's lighter than the Node API.

## Is it good practice today?
Yes. "Nginx in front of an app" is one of the most common setups for a
single server like ours. The main alternatives:
- **Caddy**: like Nginx, with HTTPS fully automatic. Also a fine choice.
- **Hosting platforms** (Render, Railway, Vercel, Fly.io): they run their
  own "Nginx" for you, so you never see it. Easier, but less control and
  usually costs more as you grow.

## Does Nginx handle TCP packets?
Not directly. **Linux** (the droplet's operating system) handles the
packets, and Nginx only gets the finished message.

**Analogy: a letter sent as postcards.** A visitor's request
(`GET /standings`) is a letter. The internet can't carry a whole letter
at once, so it's cut into small numbered postcards. Those postcards are
the **TCP packets**.
1. The visitor's phone cuts the letter into postcards and sends them.
2. They cross the internet, maybe by different routes, maybe out of order.
3. The droplet's post office (Linux) collects them, asks again for any
   lost ones, and puts them back in order.
4. Linux hands **the whole letter** to Nginx, which reads it: "they want
   `/standings`."

Where TCP shows up in our setup:

| Thing you know | The TCP part |
|---|---|
| `listen 443` | 443 is a **TCP port**. Nginx tells Linux: "give me letters for door 443" |
| `proxy_pass http://127.0.0.1:3001` | Nginx opens a **new TCP connection** to Node, inside the droplet |
| Node → Postgres | Another TCP connection, on port 5432 |
| `ufw` firewall (allows 22/80/443) | Works at the **postcard level**: packets for other doors are thrown away before Nginx ever sees them |

The layers, bottom to top:
```
HTTP   "GET /standings"          ← Nginx and Node read this
TLS    the encryption (HTTPS)    ← Nginx unlocks it with the Certbot certificate
TCP    numbered packets          ← Linux handles this
IP     addresses (159.223.81.97) ← Linux and the routers
```
We never configure TCP ourselves. We only see it as **port numbers**
(80, 443, 3001, 5432). Every one of those is a TCP door.

## Where it lives
- **Live file (the real one):** `/etc/nginx/sites-available/cgyballers`
  on the droplet. View it with
  `ssh root@159.223.81.97` then `cat /etc/nginx/sites-available/cgyballers`.
- **Copy in the repo (reference only):** `docs/DEPLOYMENT.md`, step 9.
  The live file is longer because Certbot added the HTTPS lines.

**After editing the live file:** run `nginx -t` (checks for mistakes)
*before* `systemctl reload nginx`. A typo then can't take the site down.

## Go deeper
- [2b. Our Nginx config, line by line](./02b-nginx-config-explained.md) — every instruction explained for beginners
- [`../DEPLOYMENT.md`](../DEPLOYMENT.md) — the full config with comments
- [`../STATIC-ASSET-ROUTE-COLLISIONS.md`](../STATIC-ASSET-ROUTE-COLLISIONS.md)
  — a real bug caused by how Nginx matches folders vs. pages

Next: [3. Why pm2 →](./03-why-pm2.md)
