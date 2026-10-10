-- Ticket 06: agent search behind the search_agents Edge Function.
begin;
select plan(8);

set local role anon;
select is((select count(*) from search_agents('Is €180k fair for a 2-bed in Lozenets?', 2.00)), 3::bigint,
  'returns the top 3');
select is((select slug from search_agents('Is €180k fair for a 2-bed in Lozenets?', 2.00) limit 1), 'lozenets-price-check',
  'Lozenets question ranks the Lozenets agent first');
select is((select slug from search_agents('2-bed in Mladost', null) limit 1), 'mladost-price-check',
  'Mladost question ranks the Mladost agent first');
select is((select array_agg(slug) from search_agents('second-hand Golf GTI', null)),
  array['lozenets-price-check', 'mladost-price-check', 'varna-coast-price-check'],
  'no match falls back to rating order');
select is((select count(*) from search_agents('2-bed Lozenets', 0.10)), 0::bigint, 'nothing under a 0.10 budget');
select is((select capabilities -> 0 ->> 'price' from search_agents('Lozenets', null) limit 1), '0.50',
  'prices are protocol USDC text');
reset role;

-- Hidden agents drop out
update agents set is_online = false where slug = 'lozenets-price-check';
select isnt((select slug from search_agents('2-bed in Lozenets', null) limit 1), 'lozenets-price-check',
  'offline agents are not returned');

select is(usdc_text(0.125), '0.125', 'usdc_text keeps extra decimals');

select * from finish();
rollback;
