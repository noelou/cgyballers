# Deploying CGYBallers to DigitalOcean

Status as of 2026-09-19: droplet is fully set up and serving the site over
plain HTTP at `http://159.223.81.97`. **Not done yet:** pointing the GoDaddy
domain at it, and enabling HTTPS (required before login/admin works in a
real browser — see "Known gotchas" below).

## Server info

- Droplet: DigitalOcean, Ubuntu 24.04 LTS, Basic $6/mo (1GB RAM), Singapore region
- IP: `159.223.81.97`
- Login: `ssh root@159.223.81.97` (SSH key auth)
- Project path on server: `/opt/cgyballers`
- Postgres, the Node API (via pm2), and Nginx all run on this one droplet

## Full setup sequence (already done)

```bash
# 1. System update
apt-get update -y && apt-get upgrade -y

# 2. Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 3. PostgreSQL
apt-get install -y postgresql postgresql-contrib
systemctl status postgresql   # sanity check
pg_lsclusters                 # confirms the actual DB cluster is "online"

# 4. Set a Postgres password + create the database
sudo -u postgres psql
#   ALTER USER postgres WITH PASSWORD '...';   -- use ALPHANUMERIC ONLY, see gotcha #1
#   CREATE DATABASE cgyballers;
#   \q

# 5. Get the code
cd /opt
git clone -b vue3-migration https://github.com/noelou/cgyballers.git
cd cgyballers
npm install

# 6. Production .env (create with `nano .env`, see gotcha #2 about verifying it saved)
#   DATABASE_URL=postgres://postgres:PASSWORD@localhost:5432/cgyballers
#   JWT_SECRET=<generate via: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
#   NODE_ENV=production

# 7. Build the DB + load data
node scripts/run-schema.mjs
node scripts/import-data.mjs
node scripts/create-user.mjs <admin-username> <admin-password>

# 8. Build the frontend
npm run build

# 9. Nginx — install, then create /etc/nginx/sites-available/cgyballers:
apt-get install -y nginx
```

Nginx config (`/etc/nginx/sites-available/cgyballers`):

```nginx
server {
    listen 80;
    server_name _;

    root /opt/cgyballers/dist;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/cgyballers /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# 10. Run the API persistently with pm2
npm install -g pm2
cd /opt/cgyballers
pm2 start server/index.mjs --name cgyballers-api
pm2 startup            # run the command IT prints, then:
pm2 save
```

## Known gotchas (all fixed, but worth knowing for next time)

1. **Postgres password must be plain alphanumeric.** A password containing
   `@`, `:`, `/`, etc. breaks how `DATABASE_URL` gets parsed as a URL —
   `pg` ended up trying to connect to a hostname literally called
   `postgres` (`getaddrinfo EAI_AGAIN postgres`) instead of `localhost`,
   because the special character shifted where the parser thought the
   host started. Fix: regenerate the password with
   `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`
   (hex output is always safe) and update both Postgres
   (`ALTER USER postgres WITH PASSWORD '...'`) and `.env` to match.

2. **`nano` over SSH can silently drop pasted content.** Both the Nginx
   config and `JWT_SECRET`'s value went missing this way — the file got
   created, but the paste didn't fully land. Always verify after saving:
   `cat` the file back (fine for non-secret files like Nginx config) or,
   for `.env`, check specific things without printing the whole file:
   ```bash
   cut -d= -f1 .env                                  # which vars exist
   grep '^JWT_SECRET=' .env | awk -F= '{print length($2)}'   # is it empty?
   ```
   For editing `.env` remotely going forward, prefer `cat > file << 'EOF' ... EOF`
   (heredoc) over interactive `nano` paste — it's a single shot, no paste
   truncation risk.

3. **pm2 needs `pm2 kill` (not just `pm2 restart`) to fully pick up an
   `.env` change.** `pm2 restart <name> --update-env` was not reliable
   during setup. The safe sequence after editing `.env`:
   ```bash
   pm2 kill
   cd /opt/cgyballers && pm2 start server/index.mjs --name cgyballers-api
   pm2 save
   ```

4. **The login cookie has `Secure: true` in production**, meaning it only
   works over HTTPS. Login will succeed at the API level over plain HTTP
   (confirmed via `curl`), but a real browser won't actually store/send
   the cookie until HTTPS is set up. Don't be alarmed if `/admin` login
   seems broken before that step.

## Useful commands for checking on things later

```bash
ssh root@159.223.81.97

pm2 status                          # is the API running?
pm2 logs cgyballers-api --lines 30 --nostream   # recent errors
pm2 flush                           # clear logs before reproducing an issue

systemctl status nginx
systemctl status postgresql
pg_lsclusters

nginx -t                            # check config syntax before reloading
systemctl reload nginx
```

## What's left

1. **Point the GoDaddy domain at `159.223.81.97`** — add an "A record" in
   GoDaddy's DNS settings pointing to that IP.
2. **Enable HTTPS** via Certbot/Let's Encrypt, once the domain resolves to
   the droplet (needed to verify domain ownership).
3. Final end-to-end test on the real domain: public pages + admin login.
