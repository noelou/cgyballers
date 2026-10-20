# 2b. Our Nginx config, line by line

You don't need to read all of the Nginx docs. Our site uses about 10
different instructions, and this page explains each one. If you
understand this page, you understand our Nginx.

Think of the config as **instructions for the front-desk guard**: "when
someone asks for X, do Y."

## Where the file is
- **Live (the real one):** `/etc/nginx/sites-available/cgyballers` on the droplet
- **Copy in the repo:** `docs/DEPLOYMENT.md`, step 9 (no HTTPS lines,
  see [the HTTPS part](#the-https-part-written-by-certbot) below)

This page was checked against the live file on 2026-10-20. The rules are
the same; the live file lists them in a different order, which doesn't
matter (see [How Nginx picks a rule](#how-nginx-picks-a-rule)).

## The shape of the file

```nginx
server {                 # one website
    ...settings for the whole site...

    location /api/ {     # a rule for URLs that start with /api/
        ...
    }

    location / {         # a rule for everything else
        ...
    }
}
```

- `server { }` = one website.
- `location something { }` = a rule for certain URLs.
- Every line ends with `;`. Forgetting it is the most common typo.
- `#` starts a comment (a note for humans, ignored by Nginx).

## The whole-site settings

```nginx
listen 80;
```
Listen on door (port) 80, plain HTTP. That's the repo copy. On the live
file, Certbot replaced it with `listen 443 ssl;` (HTTPS) and moved port 80
into a separate redirect block (see the HTTPS part below).

```nginx
server_name _;
```
Which domain this is for. `_` means "any name." On the live file it's
`server_name cgyballers.gacs.me;`.

```nginx
root /opt/cgyballers/dist;
index index.html;
```
"The website files are in this folder" (`dist/`, created by `npm run build`).
If someone asks for a folder, give them its `index.html`.

## Rule 1: `/api/` → send it to the Node API

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 6m;
}
```

| Line | Meaning |
|---|---|
| `proxy_pass http://127.0.0.1:3001;` | "Don't answer this yourself. Pass it to the API inside this computer, port 3001." This is the *reverse proxy* |
| `proxy_set_header ...` (4 lines) | Pass along who the visitor is (their IP, the domain, HTTP vs HTTPS). Without these, the API would think every request came from Nginx itself |
| `client_max_body_size 6m;` | Allow uploads up to 6 MB (for photos). Nginx's default is 1 MB |

**Analogy:** the guard doesn't answer stats questions. They walk you to
the scorer's room in the back (the API).

## Rule 2: `/sitemap.xml` → also from the API

```nginx
location = /sitemap.xml {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
}
```
The sitemap (for Google) is built from the database, so the API makes it.
The `=` means "exactly this URL, nothing else."

## Rule 3: `/uploads/` → uploaded photos

```nginx
location /uploads/ {
    alias /opt/cgyballers/uploads/;
    try_files $uri =404;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

| Line | Meaning |
|---|---|
| `alias /opt/cgyballers/uploads/;` | Photos are in this folder (not in `dist/`) |
| `try_files $uri =404;` | If the photo exists, send it. If not, a real "404 Not Found" |
| `add_header Cache-Control "... max-age=31536000, immutable";` | "Browser, keep this for 1 year (31,536,000 seconds), it will never change." Safe because new photos get new, timestamped names |

## Rule 4: `index.html` → always check for updates

```nginx
location = /index.html {
    add_header Cache-Control "no-cache";
}
```
`no-cache` does **not** mean "don't save." It means "save it, but ask me
before each use." `index.html` lists the current JS/CSS files, so after
a deploy every visitor must get the new list.

## Rule 5: `/assets/` → the built JS/CSS

```nginx
location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```
Keep for 1 year. Each build gives these files new names
(`index-a8f3c2.js`), so an old copy can never get stuck.

## Rule 6: everything else → `index.html`

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```
Read it left to right: "Is there a **file** with this name? A **folder**?
If neither, send `index.html`." Then Vue reads the URL and shows the right
page, or the 404 page (`src/pages/NotFound.vue`) if there's no match.

That's why refreshing `/players/some-name` works: there's no such file,
so Nginx sends `index.html` and Vue shows that player.

**Warning:** because a real file or folder wins, never name a folder in
`public/` the same as a page (e.g. `public/players/`). See
[`../STATIC-ASSET-ROUTE-COLLISIONS.md`](../STATIC-ASSET-ROUTE-COLLISIONS.md).

## How Nginx picks a rule

When a URL could match more than one rule:
1. `location = /exact` (with `=`) wins first, if it matches exactly.
2. Otherwise the **longest** matching start wins: `/uploads/x.webp`
   matches both `/uploads/` and `/`, and `/uploads/` is longer.
3. `location /` matches everything, so it's the fallback.

## The HTTPS part (written by Certbot)

We didn't type these. `certbot --nginx -d cgyballers.gacs.me` added them
(see [`../DNS-SUBDOMAIN-SETUP.md`](../DNS-SUBDOMAIN-SETUP.md), step 6).
Each one ends with `# managed by Certbot`.

**Inside the main `server { }` block:**

```nginx
listen 443 ssl; # managed by Certbot
ssl_certificate /etc/letsencrypt/live/cgyballers.gacs.me/fullchain.pem; # managed by Certbot
ssl_certificate_key /etc/letsencrypt/live/cgyballers.gacs.me/privkey.pem; # managed by Certbot
include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
```

| Line | Meaning |
|---|---|
| `listen 443 ssl;` | Open door 443 for HTTPS |
| `ssl_certificate` | The certificate (the site's public "ID") |
| `ssl_certificate_key` | The secret key that goes with it. Never share it |
| `include .../options-ssl-nginx.conf;` | Pull in Certbot's recommended security settings from another file |
| `ssl_dhparam` | Extra numbers used to set up the encryption safely |

**A second, small `server { }` block** for plain HTTP (port 80):

```nginx
server {
    if ($host = cgyballers.gacs.me) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name cgyballers.gacs.me;
    return 404;
}
```
"If someone comes in on `http://cgyballers.gacs.me/...`, send them to the
same page on `https://`." `301` means "moved permanently," so browsers
remember it. Any other name on port 80 gets a 404.

Leave all of these lines alone. Certbot manages and renews them.

## Cheat sheet

| Word | Meaning |
|---|---|
| `server { }` | One website |
| `listen` | Which door (port) |
| `server_name` | Which domain |
| `root` / `alias` | Which folder the files are in |
| `location` | A rule for some URLs |
| `try_files` | "Try these in order" |
| `proxy_pass` | "Pass this to another program" |
| `add_header` | Attach a note to the response (e.g. caching) |
| `=` after `location` | Exact match only |

## Changing the config safely

```bash
ssh root@159.223.81.97
nano /etc/nginx/sites-available/cgyballers   # edit
nginx -t                                     # check for typos FIRST
systemctl reload nginx                       # apply (no downtime)
```
If `nginx -t` shows an error, fix it before reloading. The old config
keeps running until a reload succeeds, so a typo can't take the site down.

Also update the copy in `docs/DEPLOYMENT.md` so the repo stays accurate.

## When you need something new
Search for it in plain words, e.g. "nginx redirect www to non-www" or
"nginx limit login requests," or ask Claude. The official reference
([nginx.org/en/docs](https://nginx.org/en/docs/)) is for looking up one
word at a time, like a dictionary.

Next: [3. Why pm2 →](./03-why-pm2.md)
