-- Marketplace schema (ticket 04). Field names follow docs/02 Architecture/Data Model.md.
-- Claude Code owns this schema: Lovable must never create or alter tables.

create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- --- Domains shared with packages/protocol ---

create domain usdc as numeric(18, 6) check (value >= 0);
create domain evm_address as text check (value ~ '^0x[0-9a-fA-F]{40}$');
create domain hash32 as text check (value ~ '^0x[0-9a-fA-F]{64}$');

-- --- Terms ---

create table terms_versions (
  version    text primary key,
  hash       hash32 not null unique,
  created_at timestamptz not null default now()
);

-- --- Experts, agents, versions ---

create table experts (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  headline   text not null,
  city       text not null,
  bio        text not null default '',
  -- Demo experts are fictional; the label is shown wherever the expert appears.
  is_demo    boolean not null default false,
  demo_label text check (not is_demo or demo_label is not null),
  created_at timestamptz not null default now()
);

create table agents (
  id              uuid primary key default gen_random_uuid(),
  expert_id       uuid not null references experts (id),
  slug            text not null unique,
  name            text not null,
  description     text not null,
  vertical        text not null,
  area            text not null,
  -- Receives x402 payments for this agent's capabilities.
  payout_address  evm_address not null,
  -- Address the agent signs outcomes with (Manifest.key); set when the agent key exists.
  signing_address evm_address,
  is_online       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table agent_versions (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid not null references agents (id),
  version       integer not null check (version > 0),
  status        text not null default 'draft' check (status in ('draft', 'authorised', 'retired')),
  -- [{name, url, layer}] the expert approved for this version.
  sources       jsonb not null default '[]',
  -- Plain-language rules the agent applies, e.g. "ignore deals older than 6 months".
  rules         jsonb not null default '[]',
  authorised_at timestamptz check (status <> 'authorised' or authorised_at is not null),
  created_at    timestamptz not null default now(),
  unique (agent_id, version)
);

-- At most one authorised version per agent: that is the Expert Verified (vN) version.
create unique index agent_versions_one_authorised on agent_versions (agent_id) where status = 'authorised';

create table test_cases (
  id               uuid primary key default gen_random_uuid(),
  agent_version_id uuid not null references agent_versions (id),
  question         text not null,
  expected         text not null,
  passed           boolean,
  created_at       timestamptz not null default now()
);

create table capabilities (
  id               uuid primary key default gen_random_uuid(),
  agent_id         uuid not null references agents (id),
  slug             text not null,
  tier             smallint not null check (tier between 1 and 3),
  name             text not null,
  deliverable      text not null,
  tags             text[] not null default '{}',
  price            usdc not null,
  -- Tier 3 is priced "from" (50+).
  price_is_minimum boolean not null default false,
  -- MVP: only tier 1 is transacted; tiers 2-3 are shown.
  is_live          boolean not null default false,
  created_at       timestamptz not null default now(),
  unique (agent_id, slug)
);

-- --- Knowledge ---

-- Citable units. Never publicly readable: only answers leave an agent (ADR-014).
create table units (
  id         uuid primary key default gen_random_uuid(),
  agent_id   uuid not null references agents (id),
  layer      text not null check (layer in ('base', 'expert')),
  source     text not null,
  source_url text,
  as_of      date not null,
  kind       text not null check (kind in ('passage', 'record')),
  text       text not null,
  data       jsonb,
  embedding  extensions.vector(1536),
  created_at timestamptz not null default now(),
  check (kind <> 'record' or data is not null)
);

create index units_agent_id on units (agent_id);

-- --- Buyers ---

-- Private connector link; only the sha256 of the token is stored.
create table connector_links (
  id            uuid primary key default gen_random_uuid(),
  owner_address evm_address,
  token_hash    hash32 not null unique,
  label         text,
  created_at    timestamptz not null default now(),
  rotated_at    timestamptz,
  revoked_at    timestamptz
);

-- --- Orders ---

create table orders (
  id                 uuid primary key default gen_random_uuid(),
  agent_id           uuid not null references agents (id),
  capability_id      uuid not null references capabilities (id),
  agent_version_id   uuid references agent_versions (id),
  connector_link_id  uuid references connector_links (id),
  question           text not null,
  status             text not null default 'evaluated' check (status in (
                       'evaluated', 'awaiting_payment', 'paid', 'running',
                       'checked', 'settled', 'delivered', 'failed_check')),
  price              usdc not null,
  fee                usdc not null default 0,
  payer_address      evm_address,
  answer             text,
  -- [{unit_id, quote, as_of}] as in SignedOutcome.
  citations          jsonb,
  signature          text,
  citations_verified boolean,
  tx_hash            hash32,
  terms_hash         hash32 references terms_versions (hash),
  -- Seeded history behind the demo ratings; not a real payment.
  is_demo            boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index orders_agent_id on orders (agent_id);

create function touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger orders_touch before update on orders
  for each row execute function touch_updated_at();

create table reviews (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null unique references orders (id),
  status      text not null check (status in ('review_pending', 'approved', 'edited')),
  reviewer    text not null,
  final_text  text,
  reviewed_at timestamptz
);

-- One rating per paid order; ratings are per capability (ADR-004).
create table ratings (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null unique references orders (id),
  capability_id uuid not null references capabilities (id),
  score         smallint not null check (score between 1 and 5),
  comment       text,
  rater_address evm_address,
  -- Signed by the paying key over the order's tx hash; null on seeded demo ratings.
  signature     text,
  created_at    timestamptz not null default now()
);

create index ratings_capability_id on ratings (capability_id);

-- --- Row level security ---
-- Public read on the listing tables; no anon or authenticated writes anywhere.
-- Writes go through Edge Functions using the service role, which bypasses RLS.

alter table terms_versions  enable row level security;
alter table experts         enable row level security;
alter table agents          enable row level security;
alter table agent_versions  enable row level security;
alter table test_cases      enable row level security;
alter table capabilities    enable row level security;
alter table units           enable row level security;
alter table connector_links enable row level security;
alter table orders          enable row level security;
alter table reviews         enable row level security;
alter table ratings         enable row level security;

revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;

grant select on terms_versions, experts, agents, agent_versions, capabilities, ratings to anon, authenticated;

create policy "public read" on terms_versions for select to anon, authenticated using (true);
create policy "public read" on experts        for select to anon, authenticated using (true);
create policy "public read" on agents         for select to anon, authenticated using (true);
create policy "public read" on capabilities   for select to anon, authenticated using (true);
create policy "public read" on ratings        for select to anon, authenticated using (true);
-- Only authorised versions are listed.
create policy "public read authorised" on agent_versions for select to anon, authenticated
  using (status = 'authorised');

-- --- Listing view for the web app and search_agents ---

create view marketplace_agents with (security_invoker = true) as
select
  a.id,
  a.slug,
  a.name,
  a.description,
  a.vertical,
  a.area,
  a.payout_address,
  a.is_online,
  e.slug        as expert_slug,
  e.name        as expert_name,
  e.headline    as expert_headline,
  e.is_demo,
  e.demo_label,
  v.version,
  'Expert Verified (v' || v.version || ')' as badge,
  r.rating,
  coalesce(r.rating_count, 0) as rating_count
from agents a
join experts e on e.id = a.expert_id
join agent_versions v on v.agent_id = a.id and v.status = 'authorised'
left join lateral (
  select round(avg(rt.score), 2) as rating, count(*) as rating_count
  from ratings rt
  join capabilities c on c.id = rt.capability_id
  where c.agent_id = a.id
) r on true;

grant select on marketplace_agents to anon, authenticated;
