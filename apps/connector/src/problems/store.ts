// Problem rows in Supabase (migration 20261010150000_problems.sql). Service role only.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Hex } from "./wallet.js";

export type ProblemStatus = "awaiting_funding" | "funded" | "closed";

export interface Payment {
  amount: string;
  txHash: Hex;
  orderId: string | null;
  createdAt: string;
}

export interface Problem {
  id: string;
  linkId: string;
  walletAddress: Hex;
  keyEnc: string;
  /** Protocol USDC text, e.g. "2.00". */
  cap: string;
  status: ProblemStatus;
  buyerAddress: Hex | null;
  fundingTx: Hex | null;
  gasSeedTx: Hex | null;
  createdAt: string;
  payments: Payment[];
}

export interface ProblemStore {
  create(p: { linkId: string; walletAddress: Hex; keyEnc: string; cap: string }): Promise<Problem>;
  get(id: string): Promise<Problem | null>;
  /** The link's most recent problem that isn't closed. */
  latestOpen(linkId: string): Promise<Problem | null>;
  markFunded(id: string, f: { buyerAddress: Hex | null; fundingTx: Hex | null }): Promise<void>;
  setGasSeed(id: string, tx: Hex): Promise<void>;
}

/** Protocol USDC text with 2–6 decimals: 2 → "2.00", 0.125 → "0.125". */
export const usdc = (n: number | string) => Number(n).toFixed(6).replace(/(\.\d\d\d*?)0+$/, "$1");

const COLUMNS =
  "id, connector_link_id, wallet_address, wallet_key_enc, cap, status, buyer_address, funding_tx, gas_seed_tx, created_at, " +
  "problem_payments(amount, tx_hash, order_id, created_at)";

type Row = {
  id: string;
  connector_link_id: string;
  wallet_address: Hex;
  wallet_key_enc: string;
  cap: number | string;
  status: ProblemStatus;
  buyer_address: Hex | null;
  funding_tx: Hex | null;
  gas_seed_tx: Hex | null;
  created_at: string;
  problem_payments: { amount: number | string; tx_hash: Hex; order_id: string | null; created_at: string }[];
};

const toProblem = (r: Row): Problem => ({
  id: r.id,
  linkId: r.connector_link_id,
  walletAddress: r.wallet_address,
  keyEnc: r.wallet_key_enc,
  cap: usdc(r.cap),
  status: r.status,
  buyerAddress: r.buyer_address,
  fundingTx: r.funding_tx,
  gasSeedTx: r.gas_seed_tx,
  createdAt: r.created_at,
  payments: (r.problem_payments ?? [])
    .map((p) => ({ amount: usdc(p.amount), txHash: p.tx_hash, orderId: p.order_id, createdAt: p.created_at }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
});

export function supabaseProblemStore(db: SupabaseClient): ProblemStore {
  const check = <T>({ data, error }: { data: T; error: { message: string } | null }, what: string) => {
    if (error) throw new Error(`${what}: ${error.message}`);
    return data;
  };
  return {
    async create(p) {
      const row = check(
        await db
          .from("problems")
          .insert({ connector_link_id: p.linkId, wallet_address: p.walletAddress, wallet_key_enc: p.keyEnc, cap: p.cap })
          .select(COLUMNS)
          .single(),
        "create problem",
      );
      return toProblem(row as unknown as Row);
    },
    async get(id) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
      const row = check(await db.from("problems").select(COLUMNS).eq("id", id).maybeSingle(), "get problem");
      return row ? toProblem(row as unknown as Row) : null;
    },
    async latestOpen(linkId) {
      const row = check(
        await db
          .from("problems")
          .select(COLUMNS)
          .eq("connector_link_id", linkId)
          .neq("status", "closed")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        "latest problem",
      );
      return row ? toProblem(row as unknown as Row) : null;
    },
    async markFunded(id, f) {
      check(
        await db
          .from("problems")
          .update({ status: "funded", buyer_address: f.buyerAddress, funding_tx: f.fundingTx, funded_at: new Date().toISOString() })
          .eq("id", id)
          .eq("status", "awaiting_funding"),
        "mark funded",
      );
    },
    async setGasSeed(id, tx) {
      check(await db.from("problems").update({ gas_seed_tx: tx }).eq("id", id), "set gas seed");
    },
  };
}
