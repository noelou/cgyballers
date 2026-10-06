# `scripts/push-boxscores.mjs`: copy checked box scores up to the live site

[← All scripts](./README.md)

**What it's for:** you can type box scores into your **local** admin
dashboard, check them there, and then send the finished ones to the live
site in one go, instead of typing everything twice.

It doesn't touch the live database directly. It logs in to the live site
and sends each game through the live API, exactly like clicking **Save** on
the admin box score page. So the live site adds up the final score and
marks the game `final` itself, the same as always.

**When to run:** after you've entered and double-checked one or more box
scores locally.

**How to run:** from the project root, on your laptop. Name the games by
their id (`g52`, `g53`, ...; the id is in the game's URL).

```
node scripts/push-boxscores.mjs g52 g53 --check     # 1. compare only: no login, nothing sent
node scripts/push-boxscores.mjs g52 g53             # 2. push: asks for your live admin login
```

Always do the `--check` run first. If it shows only `✓` and `=` lines,
run it again without `--check`.

| Option | Meaning |
| --- | --- |
| `--check` | Compare local with live and report. Doesn't log in or send anything |
| `--overwrite` | Also replace games that **already have a different box score** on live. Without it, those games are refused |

The login is the same username and password you use for the live admin
dashboard. The password is hidden (`****`) as you type. You can also set
`LIVE_ADMIN_USER` and `LIVE_ADMIN_PASSWORD` in the environment to skip the
questions.

## What it does

The script works in two phases, and **nothing is sent unless every game
passes phase 1.**

**Phase 1: check every game (lines 50–139).** For each game id it loads
your local box score lines and the live game, then looks for problems:

| Output | Meaning |
| --- | --- |
| `✓ g52 ...: 18 players, 85-79` | Ready to send |
| `= g52 ...: already identical on live, skipping` | Live already has exactly this box score. Nothing to do |
| `✗ ... not found on live` | That game id doesn't exist on the live site |
| `✗ ... not in the local database` | That game id doesn't exist locally |
| `✗ ... teams differ` | The same id is a different matchup locally and on live. Your local schedule is out of date |
| `✗ ... no box score entered locally` | You haven't entered this game locally yet |
| `✗ ... players not on the live roster yet` | Someone is on the local roster but not the live one. Add them in the live admin first |
| `✗ ... live already has a different box score` | Someone already entered this game on live. Check which one is right, then use `--overwrite` only if yours is |
| `✗ ... live has lines for players not in the local box score` | Live has extra players that local doesn't. Sort this out by hand |

If any game shows `✗`, it prints how many had problems and stops. It also
shows when the live score will change, e.g.
`(live score 80-79 will become 85-79)`.

**Phase 2: log in and push (lines 141–193).**

1. Asks for the live admin login and calls `POST /api/login`. The live site
   answers with the login **cookie**; the script keeps it for the next
   requests.
2. For each game, sends the lines to `POST /api/games/<id>/boxscore`, the
   same request the admin page makes.
3. **Verifies:** reads the game back from live and checks that the lines
   and the score match what was sent. Prints `pushed and verified`, or a
   warning to check that game by hand.
4. Logs out.

## Things worth noticing

- **`fetch`** is built into Node. It's the same function the Vue pages use
  to call the API, here pointed at `https://cgyballers.gacs.me`. Set
  `LIVE_URL` to point it somewhere else.
- **Check everything first, then act.** Collecting a `plan` and only sending
  when there are zero problems means a typo in one game id can't leave you
  with half the games pushed.
- `sameLines` compares two box scores player by player and stat by stat
  (`pts`, `reb`, `ast`, `blk`, `stl`, `tpa`, `tpm`, `fta`, `ftm`).

**Safety:** it only touches the games you name, and it never deletes
anything. Without `--overwrite` it never replaces a box score that's
already on live. With `--overwrite`, the live box score for that game is
replaced by your local one, so run `--check` first and read what it says.
