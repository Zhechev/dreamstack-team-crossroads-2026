-- Problem wallets (ticket 11, ADR-011): one capped wallet per buyer problem, funded by one gasless
-- EIP-3009 authorisation; the connector pays x402 from it and refunds the remainder on close.
-- Service role only: the Lovable page reads problem state through the connector, never directly.

create table problems (
  id                uuid primary key default gen_random_uuid(),
  connector_link_id uuid not null references connector_links (id),
  wallet_address    evm_address not null unique,
  -- AES-256-GCM with the connector's PROBLEM_WALLET_SECRET; never leaves the connector in clear.
  wallet_key_enc    text not null,
  cap               usdc not null check (cap > 0),
  status            text not null default 'awaiting_funding'
                      check (status in ('awaiting_funding', 'funded', 'closed')),
  buyer_address     evm_address,
  funding_tx        hash32,
  gas_seed_tx       hash32,
  refund_tx         hash32,
  refund_amount     usdc,
  created_at        timestamptz not null default now(),
  funded_at         timestamptz,
  closed_at         timestamptz
);

create index problems_link_idx on problems (connector_link_id, created_at desc);

-- Every x402 payment made from a problem wallet (written by ask, ticket 12).
create table problem_payments (
  id         uuid primary key default gen_random_uuid(),
  problem_id uuid not null references problems (id),
  order_id   uuid references orders (id),
  amount     usdc not null check (amount > 0),
  tx_hash    hash32 not null,
  created_at timestamptz not null default now()
);

create index problem_payments_problem_idx on problem_payments (problem_id);

alter table problems         enable row level security;
alter table problem_payments enable row level security;
-- No anon or authenticated grants (default privileges already revoke them).
