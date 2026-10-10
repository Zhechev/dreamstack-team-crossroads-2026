-- Two more demo experts for the follow-up questions in the demo conversation (ticket 28): after the Lozenets
-- price check, the buyer asks what an 8 m² bathroom renovation costs and what a lawyer charges for the
-- preliminary contract. Re-runnable (on conflict do nothing), so it can also be run on the hosted project.

insert into experts (id, slug, name, headline, city, bio, is_demo, demo_label) values
  ('11111111-0000-4000-8000-000000000004', 'stoyan-kolev', 'Stoyan Kolev',
   'Renovation contractor, bathrooms and kitchens', 'Sofia',
   'Fifteen years renovating flats across Sofia. Shares the final prices of his completed jobs.',
   false, null),
  ('11111111-0000-4000-8000-000000000005', 'desislava-nikolova', 'Desislava Nikolova',
   'Property lawyer, residential purchases', 'Sofia',
   'Drafts preliminary contracts and checks titles for flat buyers in Sofia. Shares her fixed fees.',
   false, null)
on conflict (id) do nothing;

insert into agents (id, expert_id, slug, name, description, vertical, area, payout_address) values
  ('22222222-0000-4000-8000-000000000004', '11111111-0000-4000-8000-000000000004',
   'sofia-renovation-price-check', 'Sofia Renovation Price Check',
   'What does a bathroom or kitchen renovation cost? A price range from completed renovation jobs in Sofia in the last 90 days.',
   'renovation', 'Sofia', '0x00000000000000000000000000000000000de004'),
  ('22222222-0000-4000-8000-000000000005', '11111111-0000-4000-8000-000000000005',
   'sofia-property-lawyer-fees', 'Sofia Property Lawyer Fees',
   'What should a lawyer charge to draft a preliminary contract for a property purchase? A fee range from recent engagements in Sofia.',
   'legal-fees', 'Sofia', '0x00000000000000000000000000000000000de005')
on conflict (id) do nothing;

insert into agent_versions (id, agent_id, version, status, sources, rules, authorised_at) values
  ('33333333-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000004', 2, 'authorised',
   '[{"name": "Citable renovation guidance", "url": null, "layer": "base"},
     {"name": "Stoyan Kolev: completed jobs, last 90 days", "url": null, "layer": "expert"}]',
   '["Use only jobs completed in the last 90 days.",
     "Compare price per square metre, not total price.",
     "Moving the shower or the toilet adds roughly EUR 600 to 900.",
     "Call it a price check, never a quote or an estimate binding the contractor."]',
   '2026-09-28T09:00:00Z'),
  ('33333333-0000-4000-8000-000000000005', '22222222-0000-4000-8000-000000000005', 1, 'authorised',
   '[{"name": "Registry Agency: property register guidance", "url": "https://www.registryagency.bg", "layer": "base"},
     {"name": "Desislava Nikolova: completed engagements, last 90 days", "url": null, "layer": "expert"}]',
   '["Use only engagements from the last 90 days.",
     "Quote fees only; never give legal advice on the contract itself.",
     "Attending the notary deed is a separate fee."]',
   '2026-09-20T09:00:00Z')
on conflict (id) do nothing;

insert into capabilities (id, agent_id, slug, tier, name, deliverable, tags, price, price_is_minimum, is_live) values
  ('44444444-0000-4000-8000-000000000041', '22222222-0000-4000-8000-000000000004', 'price-check', 1, 'Price check',
   'Price range + 5 completed jobs from the last 90 days, each cited', array['renovation', 'bathroom', 'kitchen', 'price'], 0.50, false, true),
  ('44444444-0000-4000-8000-000000000042', '22222222-0000-4000-8000-000000000004', 'human-review', 2, 'Human review',
   'The contractor checks the price check against your floor plan and photos', array['review', 'human'], 20, false, false),
  ('44444444-0000-4000-8000-000000000043', '22222222-0000-4000-8000-000000000004', 'consultation', 3, 'Site visit',
   'The contractor visits the flat and gives a written quote', array['visit', 'quote', 'human'], 50, true, false),
  ('44444444-0000-4000-8000-000000000051', '22222222-0000-4000-8000-000000000005', 'price-check', 1, 'Fee check',
   'Fair fee range + 5 recent engagements, each cited', array['lawyer', 'contract', 'fee'], 0.50, false, true),
  ('44444444-0000-4000-8000-000000000052', '22222222-0000-4000-8000-000000000005', 'human-review', 2, 'Human review',
   'The lawyer reads your draft contract and flags what to change', array['review', 'human'], 20, false, false),
  ('44444444-0000-4000-8000-000000000053', '22222222-0000-4000-8000-000000000005', 'consultation', 3, 'Consultation',
   'A call with the lawyer, or the contract drafted for you', array['consultation', 'contract', 'human'], 50, true, false)
on conflict (id) do nothing;

-- Seeded order history behind the ratings, as in seed.sql. Flagged is_demo: no payment ever happened.
create temporary table demo_history_services as
select
  ('55555555-0000-4000-8000-' || lpad((h.agent_n * 1000 + s.i)::text, 12, '0'))::uuid as order_id,
  ('22222222-0000-4000-8000-00000000000' || h.agent_n)::uuid as agent_id,
  ('33333333-0000-4000-8000-00000000000' || h.agent_n)::uuid as agent_version_id,
  ('44444444-0000-4000-8000-0000000000' || h.agent_n || '1')::uuid as capability_id,
  s.score::smallint as score,
  now() - make_interval(days => s.i::int * 3) as created_at
from (values
  (4, array[5, 5, 4, 5, 5, 4, 5, 5, 5, 4, 5, 5, 5, 4]),
  (5, array[5, 5, 5, 4, 5, 5, 5, 5, 4])
) as h (agent_n, scores)
cross join lateral unnest(h.scores) with ordinality as s (score, i);

insert into orders (id, agent_id, capability_id, agent_version_id, question, status, price, terms_hash, is_demo, created_at, updated_at)
select order_id, agent_id, capability_id, agent_version_id, 'Seeded demo order', 'delivered', 0.50,
  (select hash from terms_versions where version = 'v1'), true, created_at, created_at
from demo_history_services
on conflict (id) do nothing;

insert into ratings (order_id, capability_id, score, created_at)
select order_id, capability_id, score, created_at from demo_history_services
on conflict (order_id) do nothing;

drop table demo_history_services;
