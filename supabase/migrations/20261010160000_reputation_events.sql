-- Reputation events (ticket 09). A failed citation check is a negative event for the agent's capability
-- (ADR-009); ranking can use them later. Private: written by the connector with the service role.

create table reputation_events (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid not null references agents (id),
  capability_id uuid references capabilities (id),
  order_id      uuid references orders (id),
  kind          text not null check (kind in ('citation_check_failed')),
  delta         smallint not null check (delta <> 0),
  -- Why: the failed checks, e.g. [{"citation": 2, "reason": "quote not found in unit"}].
  details       jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

create index reputation_events_agent_id on reputation_events (agent_id);

alter table reputation_events enable row level security;
