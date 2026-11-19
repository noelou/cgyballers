# 9. When one server isn't enough

**Just for curiosity. Nothing here needs doing now.** This page explains
how sites grow from one server to many, so the words "load balancer" and
"scaling" make sense when you hear them.

## Where we are now
One droplet runs everything: Nginx, the Node API (via pm2), and Postgres.

Think of a **small carinderia with one cook**. The cook takes orders,
cooks, and keeps the ingredients. For a basketball league, that's plenty:
a few hundred visitors a day, and the whole database is only a few
megabytes.

## A subdomain is not a server
- A **subdomain** is a **name** in the phonebook (a DNS record at
  GoDaddy), like `cgyballers.gacs.me`.
- A **server** is a **machine**, like our droplet.

Creating a subdomain doesn't create a server. Many names can point to one
droplet: add an A record for `stats.gacs.me` → `159.223.81.97`, and a
second `server { }` block in Nginx. Nginx uses `server_name` to tell which
site the visitor asked for. (In Nginx, a `server { }` block means one
*website*, not one machine.)

It also works the other way: one site can run on many machines. That's
what the rest of this page is about.

## Many servers: why, what's inside, and which IP?
**Why:** two main reasons.
1. **Too many visitors for one machine.** One server has a limit, like
   one cook can only make so many dishes an hour. If one handles about
   1,000 visitors at a time and 5,000 come, 5 servers can share them.
2. **So the site doesn't go down.** With one server, if it breaks the
   site is gone. With 3, the other 2 keep working.

**What's inside each one: the same website.** Think of a chain like
Jollibee: every branch has the same menu and recipes, so you get the same
Chickenjoy at any branch. Each server has an exact copy of the same code
(for us: the same `dist/` files and Node API) and the same `.env`
settings. They usually **don't** each have their own database. They all
share **one**, so every copy sees the same players and scores.

**Which IP: each server has its own.** The domain points to the **load
balancer**, not to the servers:

```
                  cgyballers.gacs.me
                         │  (DNS points here)
                         ▼
               ┌───────────────────┐
               │   Load balancer   │   the only public address
               └───────────────────┘
                 │        │        │
                 ▼        ▼        ▼
            Server A  Server B  Server C   ← own IP each,
                 │        │        │          same website inside
                 └────────┼────────┘
                          ▼
                    ONE database            ← shared by all
```

The visitor only sees the domain. They don't know which server answered.

**How it helps:** the load balancer is like the chain's hotline. You
call one number, and it sends your order to a branch with room.
- **Spreads the work:** A, B, C, A, B, C… so no server gets overloaded.
- **Skips broken servers:** it keeps checking "are you alive?" If B stops
  answering, everyone goes to A and C, and nobody notices.
- **Updates without downtime:** update A while B and C keep serving, then
  B, then C.
- **Grows for busy days:** add servers D and E before a big sale, remove
  them after.

**Us, for comparison:**
```
cgyballers.gacs.me ──► ONE droplet 159.223.81.97 (website + API + database inside)
```
One branch, one address, everything inside. Enough for our league.

## Many visitors at once
Nginx doesn't finish visitor 1 before starting visitor 2. It handles
**thousands at the same time**.

- A **bad receptionist** takes customer 1's order, walks to the kitchen,
  and waits until the food is ready. Everyone else waits in line.
- **Nginx** passes customer 1's order to the kitchen and takes customer
  2's order while the kitchen cooks, then customer 3's, and so on. When
  food is ready, it hands it over. It never stands idle.

This is called **non-blocking** (or event-driven). Node works the same
way: while it waits for Postgres to answer visitor 1, it's already
working on visitor 2. So even our one droplet serves many people at once.

## Reverse proxy vs. load balancer
**What we have: a reverse proxy.** Nginx forwards `/api/` to **one**
address:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001;
}
```

The receptionist has one office to send people to, so there's nothing
to balance.

**A load balancer** needs an `upstream` block listing **two or more**
copies of the API:

```nginx
upstream cgyballers_api {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

location /api/ {
    proxy_pass http://cgyballers_api;
}
```

The default is **round robin**: Nginx takes turns, handing each *new*
request to the next server right away. It doesn't wait for a server to
finish first:

```
Visitor 1 ──► Server A   (still working…)
Visitor 2 ──► Server B   (still working…)
Visitor 3 ──► Server A   (A now works on 1 and 3 at once)
Visitor 4 ──► Server B
```

With several droplets, the load balancer is usually a **separate**
machine in front of them (a DigitalOcean Load Balancer, or another
Nginx). A load balancer on the same droplet it balances can't help when
that droplet dies.

**"Load balancer" is a job, not a program.** Nginx is one tool that can
do it. Others: a DigitalOcean Load Balancer (click to create, no config
file), HAProxy, or Cloudflare. Our Nginx today only does the **front
door** job. With many servers, Nginx often does **both** jobs, with
different config files:

```
           Nginx  (load balancer job)   ← spreads visitors to A, B, C
          /   |   \
   Server A  Server B  Server C
   (Nginx +  (Nginx +  (Nginx +        ← each still has its own Nginx
    Node)     Node)     Node)             in the front-door job, like ours
```

## Why one database + several app servers works
All the app servers still talk to the **same** database:

```
API server 1 ─┐
API server 2 ─┼──►  ONE database
API server 3 ─┘
```

That's fine, because the database is usually **not** the slow part. For
a standings page, Postgres hands over the games in a couple of
milliseconds. The API spends more time adding up wins, sorting teams,
and building the reply.

Restaurant version: the **storeroom clerk** (database) hands over
ingredients in seconds. The **cook** (app server) spends minutes on each
order. When customers pile up, you hire more cooks, not more clerks.
One clerk can serve many cooks, until one day the clerk becomes the
bottleneck too (see [lots of data](#lots-of-data-vs-lots-of-visitors)).

## The growth path
```
Now:     1 droplet, everything on it          ← we are here, and that's right
Step 1:  1 bigger droplet                      ← just resize in DigitalOcean
Step 2:  app droplet + separate database
Step 3:  several app droplets + load balancer + shared photo storage
```

| Step | When it makes sense | Why it helps |
|---|---|---|
| 1. Resize | Site gets slow; the droplet's CPU or RAM is maxed out | More CPU cores = more work at once. More RAM = Postgres keeps data in memory instead of reading the disk |
| 2. Separate DB | The API and database slow each other down | Each gets a whole machine. DigitalOcean's Managed Database also handles DB backups and updates |
| 3. Many app droplets | Even the biggest droplet isn't enough, or the site must stay up while one machine is down | More cooks, and if one kitchen burns down the others keep serving |

A bigger droplet is "more stoves in the same kitchen." More droplets is
"more kitchens." Step 1 is much simpler and is enough for most small
sites. Its weak spot: one kitchen means one place for things to break.

Move to the next step only when you **actually see** the problem, not
ahead of time.

## What would break today with many servers
- **Uploaded photos.** They're saved on the droplet's own disk
  (`/opt/cgyballers/uploads`). With two API servers, a photo uploaded
  through server A wouldn't exist on server B, so half the visitors would
  see a broken image. The fix is shared storage like **DigitalOcean
  Spaces**, which needs code changes.
- **Logins are fine.** Sessions are stored in the database, which every
  server can reach.

This is why "just add more servers" always comes with some work.

## Lots of data vs. lots of visitors
These are **different problems**. More servers don't fix a big
database.

**Lots of data is usually fine, even on one server.** Postgres handles
millions of rows. What matters:
1. **Disk space.** The droplet has about 25 GB. Uploaded photos and
   nightly backups will fill it long before the league data does.
2. **Indexes.** They let the database find rows fast. A library with a
   million books is fine **with a catalog**. Without one, even a thousand
   books take forever to search.
3. **Good queries.** A badly written query is slow even on a small table.

**When the database itself has to grow**, in order from easy to hard:
1. **A bigger database server:** more RAM, a faster disk. This solves
   most problems.
2. **Read copies ("replicas"):** extra database servers with a copy of
   the data that answer reads (like the standings). Writes still go to
   the main one. This works because sites read far more than they write.
3. **Splitting the data ("sharding"):** different users' data on
   different databases. Very complicated. Only giant companies do it.

| Problem | Fix |
|---|---|
| Lots of data | Indexes, enough disk space |
| Lots of visitors | Bigger droplet, then more app servers |
| Slow database | Bigger DB server, then replicas |

## Real-world examples
| Size | Examples | Why |
|---|---|---|
| **1 server** | Our league site, a restaurant's site, a personal blog | Few visitors; a short outage costs nothing |
| **A few (2–10)** | A small shop on a 11.11 sale, a school enrollment portal, local news during a typhoon | Sudden spikes when everyone comes at once |
| **Hundreds to thousands** | GCash and online banks, concert ticket sales, Grab/Foodpanda, Netflix/YouTube | Huge rushes, can't go down, big files for users everywhere |
| **Hundreds of thousands+** | Google, Facebook, TikTok | Billions of users, worldwide, 24/7. They build their own data centers |

Enrollment portals crash because they're built for normal days, and then
every student logs in on the same morning. Netflix and YouTube also put
copies of videos on servers **near you**, so they load fast instead of
coming from the other side of the world.

## The realistic next step for us
Not more servers for the live site, but maybe a **test server**: a second
cheap droplet at something like `test.cgyballers.gacs.me` for trying
changes before they go live. It's just a separate copy, with no load
balancer.

## Go deeper
- [3. Why Nginx](./03-why-nginx.md): the front door, and why it's light
- [6. The database](./06-the-database.md): where the league data lives
- Search in plain words, e.g. "nginx upstream load balancing" or
  "postgres read replica," or ask Claude.

← Back to [the start](./README.md)
