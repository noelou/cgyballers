# Connecting the domain: cgyballers.gacs.me

How the site went from "just an IP address" (`159.223.81.97`) to a real,
secure URL: `https://cgyballers.gacs.me`. Written up in case this ever
needs to be redone (new subdomain, new droplet, DNS troubleshooting).

## The starting situation

- The domain `gacs.me` is registered at **GoDaddy**.
- But its DNS was actually being *managed* by **Cloudflare**, set up by a
  friend. GoDaddy's own DNS records panel is inactive while this is the
  case — it shows a message like "DNS is currently managed elsewhere."
- We didn't have login access to that Cloudflare account.
- The domain wasn't using anything Cloudflare-specific (no email/MX
  records, no other subdomains, no proxy/CDN in active use) — so it was
  safe to move DNS management fully back to GoDaddy instead of asking the
  friend to make changes on our behalf.

## Step 1 — Move DNS control back to GoDaddy

In GoDaddy's domain settings, there's a prompt/link along the lines of
*"change your nameservers to GoDaddy's default nameservers"* when DNS is
managed elsewhere. Clicking that and confirming switches the domain's
**nameservers** (not just a record) back to GoDaddy.

Gotcha: nameserver changes propagate slower than a single DNS record
change — usually the GoDaddy DNS panel itself becomes usable within
minutes, but full worldwide propagation can take a few hours (rarely up
to 24–48h).

## Step 2 — Decide: root domain or subdomain?

We chose a **subdomain**, `cgyballers.gacs.me`, rather than putting the
app on the bare root domain (`gacs.me`). This leaves `gacs.me` itself free
for something else later (a different site, a landing page, etc.) without
any conflict.

## Step 3 — Add the DNS record in GoDaddy

Once GoDaddy's "Add New Record" button appears (confirms the nameserver
switch has taken effect on GoDaddy's side), add:

| Type | Name / Host  | Value            | TTL     |
|------|--------------|------------------|---------|
| A    | `cgyballers` | `159.223.81.97`  | default |

Notes on the fields, since these tripped us up initially:
- **Name/Host is `cgyballers`, not `cgyballers.gacs.me`** — GoDaddy already
  knows the base domain from context and appends it automatically. Typing
  the full domain here creates a broken record like
  `cgyballers.gacs.me.gacs.me`.
- **The Value is supposed to be an IP address** — that's the whole point
  of an "A" record (Address record): it maps the name to a server's
  numeric IP. This is normal, not something to change.
- Only **one** record was needed here — no `www` variant, since this is a
  subdomain setup, not a root-domain one.

## Step 4 — Verify propagation

DNS propagation isn't instant everywhere, and your own local machine/ISP
is often the slowest to catch up (it caches old answers). Don't rely on
your own browser first — check with tools that query DNS directly:

```bash
nslookup cgyballers.gacs.me 8.8.8.8    # ask Google's DNS directly
```

or use [whatsmydns.net](https://www.whatsmydns.net/#A/cgyballers.gacs.me)
to see resolution status from ~30 locations worldwide. Once most/all of
those show the correct IP, it's working — your own machine will catch up
shortly after (or immediately after `ipconfig /flushdns` on Windows).

## Step 5 — Point Nginx at the new domain name

On the droplet, the Nginx site config
(`/etc/nginx/sites-available/cgyballers`) originally had a wildcard:

```nginx
server_name _;
```

This needs to be the actual domain so Certbot can find and configure the
right server block automatically:

```bash
sed -i 's/server_name[^;]*;/server_name cgyballers.gacs.me;/' /etc/nginx/sites-available/cgyballers
nginx -t                    # must say "syntax is ok" / "test is successful"
systemctl reload nginx
```

Gotcha: a naive `sed 's/server_name _;/server_name cgyballers.gacs.me;/'`
can silently do nothing if there's unexpected whitespace in the original
line (no error is raised — it just doesn't match). Always `cat` the file
afterward to confirm the line actually changed before moving on.

## Step 6 — Get HTTPS via Certbot

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d cgyballers.gacs.me
```

Answer its prompts: email address, agree to terms, and choose the
**redirect HTTP → HTTPS** option.

If it says something like *"You have an existing certificate ... isn't
close to expiry"* and asks to reinstall vs. renew — choose **reinstall
the existing certificate**. This just wires Nginx to the cert that's
already there, with no request made to Let's Encrypt (renewing instead
would count against Let's Encrypt's rate limits for no benefit, since the
existing cert is still valid).

Certbot edits the Nginx config itself (adds the SSL cert paths and the
redirect block) and reloads Nginx — no manual reload needed after this
step.

## Step 7 — Verify end to end

```bash
curl -I https://cgyballers.gacs.me/          # expect 200
curl -I http://cgyballers.gacs.me/           # expect 301 (redirect to https)
```

Then in an actual browser: confirm the padlock/valid HTTPS, browse a few
pages, and test logging into `/admin` — the login cookie is
`Secure: true` in production, so it will not work at all over plain HTTP,
only HTTPS.

## Reference

- Droplet IP: `159.223.81.97`
- Domain: `cgyballers.gacs.me` (root `gacs.me` is unused/free)
- Nginx config: `/etc/nginx/sites-available/cgyballers`
- Certificates live under `/etc/letsencrypt/` and auto-renew via a
  systemd timer Certbot installs — worth an occasional
  `certbot renew --dry-run` to confirm renewal still works, but no
  routine action needed.
