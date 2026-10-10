-- Knowledge units: seeder key + hybrid search (ticket 05). ADR-008.

-- Stable key per unit so the seeder can upsert (re-runnable) without changing unit ids,
-- which signed outcomes cite.
alter table units add column key text;
update units set key = id::text where key is null;
alter table units alter column key set not null;
alter table units add constraint units_agent_key unique (agent_id, key);

alter table units add column fts tsvector
  generated always as (to_tsvector('english', source || ' ' || text)) stored;

create index units_fts on units using gin (fts);
create index units_text_trgm on units using gin (text extensions.gin_trgm_ops);
create index units_embedding on units using hnsw (embedding extensions.vector_cosine_ops);

-- Top units for (agent, question). Reciprocal rank fusion of three rankings:
-- full-text (any query word), trigram word similarity, and vector cosine when an embedding is given.
create function search_units(
  p_agent_id  uuid,
  p_query     text,
  p_embedding extensions.vector(1536) default null,
  p_limit     integer default 8
)
returns table (
  id         uuid,
  layer      text,
  source     text,
  source_url text,
  as_of      date,
  kind       text,
  text       text,
  data       jsonb,
  score      double precision
)
language sql stable
set search_path = public, extensions
as $$
  with q as (
    -- OR of the query's lexemes, so "2-bed Lozenets €180k" matches units with any of them.
    select nullif(string_agg(quote_literal(lexeme), ' | '), '')::tsquery as tsq
    from unnest(to_tsvector('english', p_query))
  ),
  scoped as (
    select u.* from units u where u.agent_id = p_agent_id
  ),
  fts as (
    select s.id, row_number() over (order by ts_rank_cd(s.fts, q.tsq) desc) as rank
    from scoped s, q
    where q.tsq is not null and s.fts @@ q.tsq
  ),
  trgm as (
    select s.id, row_number() over (order by word_similarity(p_query, s.text) desc) as rank
    from scoped s
    where word_similarity(p_query, s.text) > 0.2
  ),
  vec as (
    select s.id, row_number() over (order by s.embedding <=> p_embedding) as rank
    from scoped s
    where p_embedding is not null and s.embedding is not null
    order by s.embedding <=> p_embedding
    limit 50
  ),
  fused as (
    select ranked.id, sum(1.0 / (60 + ranked.rank)) as score
    from (
      select * from fts
      union all select * from trgm
      union all select * from vec
    ) ranked
    group by ranked.id
  )
  select u.id, u.layer, u.source, u.source_url, u.as_of, u.kind, u.text, u.data, f.score
  from fused f
  join units u on u.id = f.id
  order by f.score desc, u.as_of desc
  limit p_limit;
$$;

-- Units are private: only the service role (connector, seeder) may search them.
revoke execute on function search_units from public, anon, authenticated;
grant execute on function search_units to service_role;
