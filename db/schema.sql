-- CGYBallers Postgres schema
-- Run once against an empty database, e.g.:
--   psql -U <user> -d <db_name> -f db/schema.sql

CREATE TABLE teams (
  id    text PRIMARY KEY,          -- slug, e.g. 'jacque-jons'
  name  text NOT NULL,
  color text NOT NULL,
  logo  text,
  venue text
);

CREATE TABLE players (
  id              text PRIMARY KEY,        -- e.g. 'jacque-jons-daclag'
  team_id         text NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name            text NOT NULL,
  number          integer,
  position        text,
  position_label  text,
  height_cm       integer,
  height_display  text,
  weight_kg       integer,
  age             integer,
  experience      text,
  pic             text
);

CREATE INDEX idx_players_team_id ON players(team_id);

CREATE TABLE games (
  id               text PRIMARY KEY,        -- e.g. 'g1'
  date             date NOT NULL,
  time             text,
  venue            text,
  home_team_id     text NOT NULL REFERENCES teams(id),
  away_team_id     text NOT NULL REFERENCES teams(id),
  status           text NOT NULL DEFAULT 'scheduled',
  home_score       integer,
  away_score       integer,
  winner           text REFERENCES teams(id),  -- set for forfeited games only
  boxscore_source  text                     -- path to the source image, if any
);

CREATE INDEX idx_games_date ON games(date);
CREATE INDEX idx_games_home_team_id ON games(home_team_id);
CREATE INDEX idx_games_away_team_id ON games(away_team_id);

CREATE TABLE boxscore_lines (
  id        serial PRIMARY KEY,
  game_id   text NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id text NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  pts       integer NOT NULL DEFAULT 0,
  reb       integer NOT NULL DEFAULT 0,
  ast       integer NOT NULL DEFAULT 0,
  blk       integer NOT NULL DEFAULT 0,
  stl       integer NOT NULL DEFAULT 0,
  tpa       integer NOT NULL DEFAULT 0,
  tpm       integer NOT NULL DEFAULT 0,
  fta       integer NOT NULL DEFAULT 0,
  ftm       integer NOT NULL DEFAULT 0,
  UNIQUE (game_id, player_id)
);

CREATE INDEX idx_boxscore_lines_player_id ON boxscore_lines(player_id);

-- Admin/dashboard accounts. No public sign-up — accounts are created
-- directly with scripts/create-user.mjs. A surrogate `id` makes sense here
-- (unlike teams/players/games) because a username isn't guaranteed stable
-- the way a slug is, and isn't referenced anywhere else as a foreign key.
CREATE TABLE users (
  id            serial PRIMARY KEY,
  username      text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE news (
  id      text PRIMARY KEY,
  title   text NOT NULL,
  date    date NOT NULL,
  excerpt text,
  body    text,
  tag     text
);
