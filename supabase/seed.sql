-- Demo marketplace (ticket 04). The experts are fictional; for the MVP they are not labelled in the product
-- (decision 2026-10-10, ADR-014). The seeded order history is still flagged is_demo.
-- Fixed ids so other tickets, tests and the connector can refer to them.
-- Knowledge units are seeded separately (ticket 05).

-- Terms v1: keep in sync with `node terms/hash.mjs`.
insert into terms_versions (version, hash) values
  ('v1', '0xf9b91ca563e63f98b44f1a83eadfde2a1aa1dfe747467d1a8f91c4fa2f2b0757');

insert into experts (id, slug, name, headline, city, bio, is_demo, demo_label) values
  ('11111111-0000-4000-8000-000000000001', 'elena-petrova', 'Elena Petrova',
   'Residential agent, Lozenets and Iztok', 'Sofia',
   'Twelve years selling flats in Lozenets. Shares her closed-deal prices from the last 90 days.',
   false, null),
  ('11111111-0000-4000-8000-000000000002', 'georgi-ivanov', 'Georgi Ivanov',
   'Residential agent, Mladost and Studentski grad', 'Sofia',
   'New-build specialist for the east of Sofia; tracks off-plan and completed sales.',
   false, null),
  ('11111111-0000-4000-8000-000000000003', 'maria-dimitrova', 'Maria Dimitrova',
   'Seaside property agent', 'Varna',
   'Holiday and year-round flats on the Varna coast, from Chaika to Asparuhovo.',
   false, null);

insert into agents (id, expert_id, slug, name, description, vertical, area, payout_address) values
  ('22222222-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001',
   'lozenets-price-check', 'Lozenets Price Check',
   'Is the price fair? A price range for flats in Lozenets, backed by comparable sales from the last 90 days.',
   'real-estate', 'Sofia / Lozenets', '0x00000000000000000000000000000000000de001'),
  ('22222222-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000002',
   'mladost-price-check', 'Mladost Price Check',
   'Price ranges for new-build and resale flats in Mladost and Studentski grad.',
   'real-estate', 'Sofia / Mladost', '0x00000000000000000000000000000000000de002'),
  ('22222222-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000003',
   'varna-coast-price-check', 'Varna Coast Price Check',
   'Price ranges for seaside flats in Varna, split by year-round and holiday use.',
   'real-estate', 'Varna', '0x00000000000000000000000000000000000de003');

insert into agent_versions (id, agent_id, version, status, sources, rules, authorised_at) values
  ('33333333-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 3, 'authorised',
   '[{"name": "National Statistical Institute: housing price statistics", "url": "https://www.nsi.bg", "layer": "base"},
     {"name": "Registry Agency: property register guidance", "url": "https://www.registryagency.bg", "layer": "base"},
     {"name": "Elena Petrova: closed deals, last 90 days (synthetic)", "url": null, "layer": "expert"}]',
   '["Use only deals closed in the last 90 days.",
     "Compare price per square metre, not total price.",
     "Ground floor, or top floor without a lift: about 5% below comparable flats.",
     "A parking space adds roughly EUR 8,000 to 12,000.",
     "Call it a price check, never an appraisal or a valuation."]',
   '2026-10-01T09:00:00Z'),
  ('33333333-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000002', 2, 'authorised',
   '[{"name": "National Statistical Institute: housing price statistics", "url": "https://www.nsi.bg", "layer": "base"},
     {"name": "Georgi Ivanov: closed deals, last 90 days (synthetic)", "url": null, "layer": "expert"}]',
   '["Keep off-plan and completed buildings apart.",
     "Act 16 (completed) flats trade about 10% above off-plan.",
     "Call it a price check, never an appraisal or a valuation."]',
   '2026-09-24T09:00:00Z'),
  ('33333333-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000003', 1, 'authorised',
   '[{"name": "National Statistical Institute: housing price statistics", "url": "https://www.nsi.bg", "layer": "base"},
     {"name": "Maria Dimitrova: closed deals, last 90 days (synthetic)", "url": null, "layer": "expert"}]',
   '["Price holiday complexes with maintenance fees separately.",
     "Sea view adds 10 to 15%.",
     "Call it a price check, never an appraisal or a valuation."]',
   '2026-09-15T09:00:00Z');

-- An older draft of the Lozenets agent: stored, but never listed.
insert into agent_versions (agent_id, version, status, sources, rules) values
  ('22222222-0000-4000-8000-000000000001', 4, 'draft', '[]', '[]');

insert into test_cases (agent_version_id, question, expected, passed) values
  ('33333333-0000-4000-8000-000000000001', 'Is EUR 180k fair for a 2-bed in Lozenets?',
   'A price range plus 5 comparable 2-bed sales from the last 90 days, each cited with an as-of date.', true),
  ('33333333-0000-4000-8000-000000000001', 'What is a 3-bed with parking in Lozenets worth?',
   'A price range that adds the parking adjustment, each figure cited.', true),
  ('33333333-0000-4000-8000-000000000001', 'How much is a used Golf in Sofia?',
   'Out of scope: cannot answer, no price.', true);

-- Three capabilities per agent (ADR-015). Only tier 1 is live in the MVP.
insert into capabilities (id, agent_id, slug, tier, name, deliverable, tags, price, price_is_minimum, is_live)
select
  ('44444444-0000-4000-8000-0000000000' || a.n || c.n)::uuid,
  a.id, c.slug, c.tier, c.name, c.deliverable, c.tags, c.price, c.price_is_minimum, c.tier = 1
from (values
  (1, '22222222-0000-4000-8000-000000000001'::uuid),
  (2, '22222222-0000-4000-8000-000000000002'::uuid),
  (3, '22222222-0000-4000-8000-000000000003'::uuid)
) as a (n, id)
cross join (values
  (1, 'price-check', 1::smallint, 'Price check',
   'Fair price range + 5 comparable sales, last 90 days, each cited',
   array['price', 'comparables', 'flat'], 0.50, false),
  (2, 'human-review', 2::smallint, 'Human review',
   'The expert checks the price check and approves or edits it',
   array['review', 'human'], 20, false),
  (3, 'consultation', 3::smallint, 'Consultation / viewing',
   'A call or a viewing with the expert',
   array['consultation', 'viewing', 'human'], 50, true)
) as c (n, slug, tier, name, deliverable, tags, price, price_is_minimum);

-- Seeded order history behind the ratings. Flagged is_demo: no payment ever happened.
create temporary table demo_history as
select
  ('55555555-0000-4000-8000-' || lpad((h.agent_n * 1000 + s.i)::text, 12, '0'))::uuid as order_id,
  ('22222222-0000-4000-8000-00000000000' || h.agent_n)::uuid as agent_id,
  ('33333333-0000-4000-8000-00000000000' || h.agent_n)::uuid as agent_version_id,
  ('44444444-0000-4000-8000-0000000000' || h.agent_n || '1')::uuid as capability_id,
  s.score::smallint as score,
  now() - make_interval(days => s.i::int * 3) as created_at
from (values
  (1, array[5, 5, 4, 5, 5, 5, 4, 5, 5, 5, 5, 4, 5, 5, 5, 5, 4, 5, 5, 5, 5, 5, 4]),
  (2, array[5, 4, 5, 4, 5, 4, 5, 4, 5, 4, 5]),
  (3, array[4, 4, 5, 4, 4])
) as h (agent_n, scores)
cross join lateral unnest(h.scores) with ordinality as s (score, i);

insert into orders (id, agent_id, capability_id, agent_version_id, question, status, price, terms_hash, is_demo, created_at, updated_at)
select order_id, agent_id, capability_id, agent_version_id, 'Seeded demo order', 'delivered', 0.50,
  (select hash from terms_versions where version = 'v1'), true, created_at, created_at
from demo_history;

insert into ratings (order_id, capability_id, score, created_at)
select order_id, capability_id, score, created_at from demo_history;

drop table demo_history;
