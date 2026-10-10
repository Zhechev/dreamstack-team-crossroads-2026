-- Agent search for the connector (ticket 06). ADR-004: online, authorised, within budget, sorted by rating;
-- agents whose listing matches the question rank first. Returns the top 3; Claude picks.

-- USDC as protocol text with at least two decimals: 0.5 → "0.50", 0.125 → "0.125".
create function usdc_text(p usdc) returns text
language sql immutable set search_path = public as $$
  select case when scale(trim_scale(p)) < 2 then round(p, 2) else trim_scale(p) end::text;
$$;

create function search_agents(p_question text, p_budget numeric default null, p_limit integer default 3)
returns table (
  id            uuid,
  slug          text,
  name          text,
  description   text,
  area          text,
  expert_name   text,
  demo_label    text,
  badge         text,
  version       integer,
  rating        numeric,
  rating_count  bigint,
  match         real,
  capabilities  jsonb
)
language sql stable
set search_path = public
as $$
  with q as (
    select nullif(string_agg(quote_literal(lexeme), ' | '), '')::tsquery as tsq
    from unnest(to_tsvector('english', coalesce(p_question, '')))
  ),
  live as (
    -- Cheapest capability that can be bought today (MVP: tier 1 only).
    select c.agent_id, min(c.price) as price
    from capabilities c
    where c.is_live
    group by c.agent_id
  )
  select
    m.id, m.slug, m.name, m.description, m.area, m.expert_name, m.demo_label, m.badge, m.version,
    m.rating, m.rating_count,
    coalesce(ts_rank(to_tsvector('english', m.name || ' ' || m.description || ' ' || m.area || ' ' || m.vertical), q.tsq), 0) as match,
    (
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'slug', c.slug, 'tier', c.tier, 'name', c.name, 'deliverable', c.deliverable,
        'price', usdc_text(c.price), 'price_is_minimum', c.price_is_minimum, 'is_live', c.is_live
      ) order by c.tier)
      from capabilities c where c.agent_id = m.id
    ) as capabilities
  from marketplace_agents m
  join live l on l.agent_id = m.id
  cross join q
  where m.is_online
    and (p_budget is null or l.price <= p_budget)
  order by match desc, m.rating desc nulls last, m.rating_count desc
  limit p_limit;
$$;

-- The listing is public, so anyone may search it.
grant execute on function search_agents to anon, authenticated, service_role;
