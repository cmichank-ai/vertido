create schema if not exists vertido;
create table if not exists vertido.players (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now(), country text, platform text, app_version text,
  push_token text, ab_bucket int not null default floor(random()*100)
);
create table if not exists vertido.progress (
  player_id uuid primary key references vertido.players(id) on delete cascade,
  level int not null default 1, coins int not null default 0, streak int not null default 0,
  unlocked_items jsonb not null default '[]'::jsonb, updated_at timestamptz not null default now()
);
create table if not exists vertido.events_log (
  id bigserial primary key, player_id uuid references vertido.players(id) on delete cascade,
  event text not null, props jsonb, ts timestamptz default now()
);
create table if not exists vertido.leaderboard_weekly (
  week date not null, group_id int not null, player_id uuid references vertido.players(id) on delete cascade,
  points int not null default 0, rank int, primary key (week, group_id, player_id)
);
create table if not exists vertido.revenue_daily (
  date date not null, country text not null, platform text not null,
  ads_usd numeric(12,2) default 0, iap_usd numeric(12,2) default 0, dau int default 0, primary key (date, country, platform)
);
alter table vertido.players enable row level security;
alter table vertido.progress enable row level security;
alter table vertido.events_log enable row level security;
alter table vertido.leaderboard_weekly enable row level security;
create policy "own player" on vertido.players for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own progress" on vertido.progress for all using (player_id = auth.uid()) with check (player_id = auth.uid());
create policy "own events" on vertido.events_log for insert with check (player_id = auth.uid());
create policy "read leaderboard" on vertido.leaderboard_weekly for select using (true);
create index on vertido.events_log (player_id, ts desc);
create index on vertido.leaderboard_weekly (week, group_id, points desc);
