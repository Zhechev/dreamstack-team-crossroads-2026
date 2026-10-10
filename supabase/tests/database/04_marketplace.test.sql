-- Ticket 04: schema, RLS and seeded demo experts. Run with `supabase test db`.
begin;
select plan(20);

-- Seed
select is((select count(*) from experts), 3::bigint, 'three demo experts');
select is((select count(*) from experts where demo_label is not null), 0::bigint, 'no demo labels shown in the MVP');
select is((select count(*) from agent_versions where status = 'authorised'), 3::bigint,
  'every demo agent has one authorised version');
select is((select array_agg(price order by tier)::numeric[] from capabilities
           where agent_id = '22222222-0000-4000-8000-000000000001'), array[0.50, 20, 50]::numeric[],
  'price check 0.50, human review 20, consultation 50+');
select is((select count(*) from capabilities where is_live), 3::bigint, 'only tier 1 is live');
select is((select hash::text from terms_versions where version = 'v1'),
  '0xf9b91ca563e63f98b44f1a83eadfde2a1aa1dfe747467d1a8f91c4fa2f2b0757', 'terms v1 hash seeded');

-- Anon reads the listing
set local role anon;
select is((select count(*) from experts), 3::bigint, 'anon reads experts');
select is((select count(*) from agents), 3::bigint, 'anon reads agents');
select is((select count(*) from capabilities), 9::bigint, 'anon reads capabilities');
select is((select count(*) from ratings), 39::bigint, 'anon reads ratings');
select is((select count(*) from agent_versions), 3::bigint, 'anon sees authorised versions only');
select results_eq(
  $$ select slug, badge, rating, rating_count, demo_label from marketplace_agents order by slug $$,
  $$ values
       ('lozenets-price-check', 'Expert Verified (v3)', 4.78, 23::bigint, null::text),
       ('mladost-price-check', 'Expert Verified (v2)', 4.55, 11::bigint, null::text),
       ('varna-coast-price-check', 'Expert Verified (v1)', 4.20, 5::bigint, null::text) $$,
  'listing view shows badge and rating, no demo label');

-- Anon cannot read private tables or write anywhere
select throws_ok($$ select * from units $$, '42501', null, 'anon cannot read units');
select throws_ok($$ select * from orders $$, '42501', null, 'anon cannot read orders');
select throws_ok($$ select * from connector_links $$, '42501', null, 'anon cannot read connector links');
select throws_ok($$ insert into experts (slug, name, headline, city) values ('x', 'x', 'x', 'x') $$,
  '42501', null, 'anon cannot insert experts');
select throws_ok($$ update agents set payout_address = '0x0000000000000000000000000000000000000bad' $$,
  '42501', null, 'anon cannot update agents');
reset role;

-- Signed-in users are no different
set local role authenticated;
select throws_ok($$ delete from ratings $$, '42501', null, 'authenticated cannot delete ratings');
select throws_ok($$ insert into terms_versions (version, hash) values ('v9', '0x' || repeat('0', 64)) $$,
  '42501', null, 'authenticated cannot insert terms');
reset role;

-- Service role (Edge Functions) can write
set local role service_role;
select lives_ok($$ update orders set status = 'delivered' where is_demo $$, 'service role writes orders');
reset role;

select * from finish();
rollback;
