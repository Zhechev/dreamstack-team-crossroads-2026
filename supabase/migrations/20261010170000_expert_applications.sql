-- Expert applications from the /experts page (ticket 22). Written only by the expert_application
-- Edge Function; nobody reads them through the Data API. We review them by hand (founding experts).

create table expert_applications (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(name) between 2 and 120),
  email      text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  -- What they know, e.g. "Residential property, Sofia".
  field      text not null check (length(field) between 2 and 200),
  city       text check (length(city) <= 120),
  links      text check (length(links) <= 1000),
  note       text check (length(note) <= 2000),
  status     text not null default 'new' check (status in ('new', 'contacted', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);

create index expert_applications_email_idx on expert_applications (lower(email), created_at desc);

alter table expert_applications enable row level security;
-- No anon or authenticated grants (default privileges already revoke them).
