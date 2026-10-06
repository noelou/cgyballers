# `scripts/migrate-images-to-webp.mjs`: point image paths at the `.webp` files

[← All scripts](./README.md)

**What it's for:** the site's images were converted to **WebP**, a much
smaller image format (21.8 MB down to 1.1 MB in total). The new `.webp`
files sit next to the old `.jpg`/`.png` ones in `public/`. But the
database still stores image paths like `/logos/grit.png`, so the site would
keep loading the big old files. This script updates those paths to
`/logos/grit.webp`.

It updates three columns:

| Column | What it holds |
| --- | --- |
| `teams.logo` | Team logos (`/logos/...`) |
| `teams.featured_photo` | Home page matchup-card photos (`/featured/...`) |
| `players.pic` | Player photos (`/player-photos/...`) |

**When to run:** once per database, after the `.webp` files are in place.
On the droplet, that means after a `git pull` that brought in the `.webp`
files. Run it on your laptop for your local database too.

**How to run:** it does a **dry run** by default, so you see what it would
change before anything happens.

```
node scripts/migrate-images-to-webp.mjs           # 1. dry run: shows the changes, writes nothing
node scripts/migrate-images-to-webp.mjs --apply   # 2. actually write them
```

## What it does

```js
const apply = process.argv.includes('--apply');      // dry run unless you pass --apply
const targets = [['teams', 'logo'], ['teams', 'featured_photo'], ['players', 'pic']];

for (const [table, column] of targets) {
  // find paths under /logos, /featured or /player-photos that end in .png/.jpg/.jpeg
  const { rows } = await pool.query(`SELECT id, ${column} AS path FROM ${table} WHERE ${column} ~* '...'`);

  for (const { id, path } of rows) {
    const next = path.trim().replace(/\.(png|jpe?g)$/i, '.webp');   // grit.png -> grit.webp
    if (!existsSync(`public${next}`)) { /* print SKIP */ continue; } // no .webp file? leave it alone
    if (apply) await pool.query(`UPDATE ${table} SET ${column} = $1 WHERE id = $2`, [next, id]);
  }
}
```

- **`~*`** is Postgres for "matches this pattern, ignoring upper/lower
  case." It picks out only paths that still end in `.png`, `.jpg` or
  `.jpeg`.
- **`existsSync`** checks the `.webp` file is really there before switching
  to it, so no image can end up pointing at a missing file. Those rows print
  as `SKIP` and keep their old path.
- **Admin uploads** (`/uploads/...`) are already WebP and aren't touched.
- At the end it prints how many rows it updated (or would update) and how
  many it skipped.

**Why the old `.jpg`/`.png` files are still in `public/`:** browsers and
pages cached before the switch may still ask for the old paths. They can be
deleted once every database (live and local) has been migrated and the
`SKIP` list is empty.

**Safety:** safe. Without `--apply` it changes nothing. With `--apply` it
only changes the paths of images whose `.webp` version exists, and running
it again finds nothing left to change.
