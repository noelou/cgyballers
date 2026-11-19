# 3b. Our Nginx config, line by line

You don't need to read all of the Nginx docs. Our site uses about 10
different instructions, and this page explains each one. If you
understand this page, you understand our Nginx.

Think of the config as **instructions for the front-desk guard**: "when
someone asks for X, do Y."

## Where the file is
- **Live (the real one):** `/etc/nginx/sites-available/cgyballers` on the droplet
- **Copy in the repo:** `docs/deploy/03-first-time-setup.md`, step 9 (no HTTPS lines,
  see [the HTTPS part](#the-https-part-written-by-certbot) below)

This page was checked against the live file on 2026-10-20. The rules are
the same; the live file lists them in a different order, which doesn't
matter (see [How Nginx picks a rule](#how-nginx-picks-a-rule)).

## How this file got onto the server

Nginx isn't "connected" to DigitalOcean. The droplet is just a rented
Linux computer, and Nginx is a program **installed inside it**. Think of
the droplet as a rented house and Nginx as the receptionist living there.
The domain name is a separate thing: a phonebook entry (at GoDaddy) that
gives out the house's address.

This is how it was set up, once. The full commands are in
[`../deploy/03-first-time-setup.md`](../deploy/03-first-time-setup.md) (step 9) and
[`../deploy/04-dns-subdomain-setup.md`](../deploy/04-dns-subdomain-setup.md) (steps 3–6).

1. **Log in to the droplet** from cmd on your computer:
   `ssh root@159.223.81.97`. This is the only command that runs on your
   PC. After it, every command runs **on the droplet**.
2. **Install Nginx:** `apt-get install -y nginx`. (`apt-get` is
   Ubuntu's app store.)
3. **Write the config:** `nano /etc/nginx/sites-available/cgyballers`,
   then paste in the rules. At this point it only had `listen 80`
   (plain HTTP, no encryption).
4. **Turn it on:** `ln -s` puts a shortcut to the file in
   `/etc/nginx/sites-enabled/`. Nginx only reads what's in
   `sites-enabled`. `sites-available` is just the drawer where configs
   are kept. Then `nginx -t` and `systemctl reload nginx`.
5. **Point the domain at the droplet.** This is done on the GoDaddy
   website, not with a command: add an **A record**, `cgyballers` →
   `159.223.81.97`. This is the actual link between the name and the
   droplet. Then `server_name _;` in the config was changed to
   `server_name cgyballers.gacs.me;`.
6. **Add HTTPS:** `certbot --nginx -d cgyballers.gacs.me`. Certbot gets
   the certificate from Let's Encrypt and **edits this file for you**:
   it adds the `ssl` lines and the HTTP→HTTPS redirect. That's why
   those lines say `# managed by Certbot` (see
   [the HTTPS part](#the-https-part-written-by-certbot)).

```
Your PC (cmd) ──ssh──► Droplet (Ubuntu)
                         ├─ apt-get install nginx     → install the receptionist
                         ├─ nano sites-available/...  → write its instructions
                         ├─ ln -s + reload            → turn them on
                         └─ certbot --nginx           → adds the HTTPS lines
GoDaddy website ───────► A record: cgyballers → 159.223.81.97
```

You don't need to repeat any of this. To change the config later, see
[Changing the config safely](#changing-the-config-safely).

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

## Hiding the version: `server_tokens off;`

Every response carries a name tag, the `Server` header. By default
Nginx writes its exact version on it:

```
Server: nginx/1.24.0 (Ubuntu)
```

That's like a guard wearing a badge that says which lock model the
building uses. If a weakness is ever found in 1.24.0, attackers know
we have it. `server_tokens off;` shortens the tag to just `Server: nginx`.

This line is **not in our site file**. It's in the main Nginx settings,
`/etc/nginx/nginx.conf`, inside the `http { }` block, so it covers every
`server { }` block at once (including Certbot's redirect block). Ubuntu
ships it already written but switched off with a `#` in front.

To turn it on (see [Changing the config safely](#changing-the-config-safely)):

```bash
ssh root@159.223.81.97
sed -i 's/# *server_tokens off;/server_tokens off;/' /etc/nginx/nginx.conf
grep -n server_tokens /etc/nginx/nginx.conf   # should show it with no "#"
nginx -t
systemctl reload nginx
```

`sed` finds `# server_tokens off;` and rewrites it without the `#`. If
`grep` shows nothing at all, the line isn't there: open the file with
`nano /etc/nginx/nginx.conf` and add `server_tokens off;` on its own line
just under `http {`.

Check it worked, from your laptop:
```bash
curl -sI https://cgyballers.gacs.me | grep -i server
```
You should see `Server: nginx` with no number. (Or in Chrome: F12 →
Network → refresh → click the first row → Response Headers.)

## How Nginx knows a file is CSS, HTML, or a photo: `mime.types`

We didn't set this up. It came with Nginx when it was installed. Like
`server_tokens`, it's in the main settings file `/etc/nginx/nginx.conf`,
inside the `http { }` block:

```nginx
include /etc/nginx/mime.types;
default_type application/octet-stream;
```

`mime.types` is a ready-made table that pairs **file extensions** with
**content types**:

```nginx
types {
    text/html                 html htm;
    text/css                  css;
    application/javascript    js;
    image/jpeg                jpeg jpg;
    image/png                 png;
    ...
}
```

Think of it as a label maker at the guard's desk. Before handing over a
file, Nginx looks at its name: `.css` gets the label "this is CSS," `.jpg`
gets "this is a JPEG photo." The label goes to the browser as a header:

```
Content-Type: text/css
```

The browser reads the label to decide what to do: apply it as styles, run
it as JavaScript, or show it as a picture. `default_type` is the fallback
for an extension that isn't in the table. `application/octet-stream`
means "unknown file," and the browser usually just downloads it.

**The API is different.** For `/api/` and `/sitemap.xml`, Nginx doesn't
serve a file. It passes the request to Node
([Rule 1](#rule-1-api--send-it-to-the-node-api)), and **Node writes the
label itself** (e.g. `Content-Type: application/json`). Nginx passes it
along unchanged.

| What | Who sets `Content-Type` |
|---|---|
| Files: `index.html`, `/assets/`, `/uploads/` | Nginx, from `mime.types` |
| `/api/...`, `/sitemap.xml` | The Node API |

Nothing to change here. To see it, from your laptop:
```bash
curl -sI https://cgyballers.gacs.me | grep -i content-type   # text/html
```
On the droplet, `cat /etc/nginx/mime.types` shows the whole table.

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

### What is `http://127.0.0.1:3001`?

`127.0.0.1` (nickname: **localhost**) always means **"this same
computer."** It's like the word "me" (Bisaya: *"ako"*): the same word
for everyone, but it points to whoever says it.

| Where | Who's saying it | Means |
|---|---|---|
| Live Nginx config | Nginx on the droplet | The Node API **on the droplet**, door 3001 |
| `vite.config.js` | Vite on your laptop | The Node API **on your laptop**, door 3001 |

That's why the same line works in both places. Each machine talks to its
own API (and its own database).

Reading the full address:
- `http://`: the language (protocol)
- `127.0.0.1`: which computer ("myself")
- `:3001`: which door. This number isn't an official standard. Our code
  picked it, in `server/index.mjs` (`process.env.API_PORT || 3001`)

On the live site, the request never leaves the droplet. Nginx just walks
down the hallway to door 3001 in the same building. That's why plain
`http` is fine for this step: nobody is in between to snoop.

A visitor's phone can't use this address. On their phone, `127.0.0.1`
would mean *their phone*. They have to use `cgyballers.gacs.me`, which
takes them to Nginx's front door.

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
[`../deploy/05-bug-static-asset-routes.md`](../deploy/05-bug-static-asset-routes.md).

## How Nginx picks a rule

When a URL could match more than one rule:
1. `location = /exact` (with `=`) wins first, if it matches exactly.
2. Otherwise the **longest** matching start wins: `/uploads/x.webp`
   matches both `/uploads/` and `/`, and `/uploads/` is longer.
3. `location /` matches everything, so it's the fallback.

## The HTTPS part (written by Certbot)

We didn't type these. `certbot --nginx -d cgyballers.gacs.me` added them
(see [`../deploy/04-dns-subdomain-setup.md`](../deploy/04-dns-subdomain-setup.md), step 6).
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
| `server_tokens off` | Hide the Nginx version number (set in `nginx.conf`) |
| `mime.types` | Extension → content type table, e.g. `.css` → `text/css` (set in `nginx.conf`) |

## Changing the config safely

```bash
ssh root@159.223.81.97
nano /etc/nginx/sites-available/cgyballers   # edit
nginx -t                                     # check for typos FIRST
systemctl reload nginx                       # apply (no downtime)
```
If `nginx -t` shows an error, fix it before reloading. The old config
keeps running until a reload succeeds, so a typo can't take the site down.

Also update the copy in `docs/deploy/03-first-time-setup.md` so the repo stays accurate.

## When you need something new
Search for it in plain words, e.g. "nginx redirect www to non-www" or
"nginx limit login requests," or ask Claude. The official reference
([nginx.org/en/docs](https://nginx.org/en/docs/)) is for looking up one
word at a time, like a dictionary.

Next: [4. Why pm2 →](./04-why-pm2.md)
