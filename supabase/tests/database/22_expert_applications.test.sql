-- Ticket 22: expert applications are private; only the Edge Function (service role) writes them.
begin;
select plan(5);

insert into expert_applications (name, email, field) values ('Ana Test', 'ana@example.com', 'Residential property, Plovdiv');
select is((select status from expert_applications where email = 'ana@example.com'), 'new', 'new applications start as new');
select throws_ok($$ insert into expert_applications (name, email, field) values ('B', 'not-an-email', 'x') $$,
  '23514', null, 'bad email rejected');

set local role anon;
select throws_ok($$ select * from expert_applications $$, '42501', null, 'anon cannot read applications');
select throws_ok($$ insert into expert_applications (name, email, field) values ('Eve', 'eve@example.com', 'Spam') $$,
  '42501', null, 'anon cannot insert directly');
reset role;
set local role authenticated;
select throws_ok($$ select * from expert_applications $$, '42501', null, 'authenticated cannot read applications');
reset role;

select * from finish();
rollback;
