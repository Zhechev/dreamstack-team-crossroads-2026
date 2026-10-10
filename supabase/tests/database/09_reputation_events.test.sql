-- Ticket 09: reputation events are private; only the service role (connector) writes them.
begin;
select plan(3);

set local role anon;
select throws_ok($$ select * from reputation_events $$, '42501', null, 'anon cannot read reputation events');
reset role;

set local role authenticated;
select throws_ok($$ insert into reputation_events (agent_id, kind, delta) values ('22222222-0000-4000-8000-000000000001', 'citation_check_failed', -1) $$,
  '42501', null, 'authenticated cannot write reputation events');
reset role;

set local role service_role;
select lives_ok($$ insert into reputation_events (agent_id, kind, delta) values ('22222222-0000-4000-8000-000000000001', 'citation_check_failed', -1) $$,
  'service role records a reputation event');
reset role;

select * from finish();
rollback;
