# 7. Review checklist

Claude built and deployed most of this site. You're the owner, so these are
the things you should **understand, check, or have access to yourself**.
Tick them off as you go. You don't need to do them all in one day.

## Access: could you run the site without Claude?
- [ ] I can log in to the **DigitalOcean** account, and it has 2-factor
      login turned on.
- [ ] I can log in to **GoDaddy** (the domain `gacs.me`), and I know when
      it renews.
- [ ] I can log in to **GitHub**, and the code there matches what's live.
- [ ] I can SSH to the server: `ssh root@159.223.81.97`.
- [ ] I know where my **SSH key** file is, and it's backed up somewhere
      safe.
- [ ] I know the **admin password** for the site's `/admin`.
- [ ] I know how to open the **Droplet Console** if SSH ever fails.

## Understanding: can you explain each piece?
- [ ] What Nginx, pm2, the API and Postgres each do (files 1–5).
- [ ] The difference between **local** and **live**, and that their
      databases are separate.
- [ ] Why `.env` is never in git, and what's in it.

## Checks: run these on the droplet now and then
- [ ] `pm2 status` → `cgyballers-api` is `online`.
- [ ] `ufw status` → active, with only 22, 80, 443.
- [ ] `tail -3 /var/log/cgyballers-backup.log` → recent "ok" lines.
- [ ] `certbot renew --dry-run` → the HTTPS certificate can renew.
- [ ] `df -h` → the disk isn't nearly full (backups take space).

## Practice: do these once, so you're not learning in an emergency
- [ ] **Ship a small change** by following `DEPLOYING-CHANGES.md` yourself.
- [ ] **Read the logs** after an error: `pm2 logs cgyballers-api --lines 30`.
- [ ] **Copy the backups** to your computer (command in
      `HOW-THE-LIVE-SITE-WORKS.md`, section 2.6).
- [ ] **Restore a backup into a test database**, following
      `DEPLOYING-CHANGES.md` → Restoring. This is the step people skip
      and regret.

## Decisions only you can make
- [ ] Turn on **DigitalOcean Backups** (~$1–2/month) for an off-server copy?
- [ ] Close the open security items in
      [6. Security basics](./06-security-basics.md#whats-still-open)?
- [ ] Who else, if anyone, should have admin or server access?

## Questions to ask Claude (or anyone) when reviewing code
When you read a change, these catch most problems:
1. **What does this change, in one sentence?**
2. **Does any new route that changes data use `requireAuth`?**
3. **Does it touch the database schema?** If so, follow the
   "schema changes" section of `DEPLOYING-CHANGES.md` and take a backup
   first.
4. **What needs to happen on the server after deploying:** build, restart,
   or both?
5. **How do I undo it if it goes wrong?**

← Back to [the start](./README.md)
