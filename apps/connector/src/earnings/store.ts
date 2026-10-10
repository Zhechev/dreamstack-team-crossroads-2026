// What an expert has earned: settled orders for one agent plus the payout wallet's USDC balance (ticket 24).
// Read-only; feeds the live earnings page shown next to Claude in the demo.
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatUnits } from "viem";
import type { Hex } from "../problems/wallet.js";

export interface EarningsPayment {
  orderId: string;
  /** USDC text, e.g. "0.50". */
  amount: string;
  /** Buyer's question, cut to QUESTION_MAX characters. */
  question: string;
  txHash: Hex;
  at: string;
}

export interface Earnings {
  agent: { id: string; slug: string; name: string; expert: string; payoutAddress: Hex };
  /** Payout wallet balance in USDC text; null when the chain read failed. */
  balance: string | null;
  /** Sum of settled orders, USDC text. */
  total: string;
  count: number;
  /** Newest first, at most RECENT. */
  payments: EarningsPayment[];
}

export type EarningsReader = (idOrSlug: string) => Promise<Earnings | null>;

export const RECENT = 20;
export const QUESTION_MAX = 120;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Micro-USDC, so sums don't drift. */
const micros = (n: number | string) => Math.round(Number(n) * 1e6);
const usdcText = (m: number) => (m / 1e6).toFixed(2);

export function supabaseEarnings(db: SupabaseClient, usdcBalance: (address: Hex) => Promise<bigint>): EarningsReader {
  return async (idOrSlug) => {
    const agentRes = await db
      .from("agents")
      .select("id, slug, name, payout_address, experts!inner(name)")
      .eq(UUID.test(idOrSlug) ? "id" : "slug", idOrSlug)
      .maybeSingle();
    if (agentRes.error) throw new Error(`read agent: ${agentRes.error.message}`);
    const a = agentRes.data;
    if (!a) return null;

    // Real settlements only: seeded rating history (is_demo) never moved money.
    const ordersRes = await db
      .from("orders")
      .select("id, price, question, tx_hash, updated_at")
      .eq("agent_id", a.id)
      .eq("is_demo", false)
      .not("tx_hash", "is", null)
      .order("updated_at", { ascending: false })
      .limit(500);
    if (ordersRes.error) throw new Error(`read orders: ${ordersRes.error.message}`);
    const orders = ordersRes.data ?? [];

    const balance = await usdcBalance(a.payout_address as Hex)
      .then((b) => Number(formatUnits(b, 6)).toFixed(2))
      .catch(() => null);
    const expert = (Array.isArray(a.experts) ? a.experts[0] : a.experts) as { name: string };

    return {
      agent: { id: a.id, slug: a.slug, name: a.name, expert: expert.name, payoutAddress: a.payout_address as Hex },
      balance,
      total: usdcText(orders.reduce((sum, o) => sum + micros(o.price), 0)),
      count: orders.length,
      payments: orders.slice(0, RECENT).map((o) => ({
        orderId: o.id,
        amount: usdcText(micros(o.price)),
        question: o.question.length > QUESTION_MAX ? `${o.question.slice(0, QUESTION_MAX - 1)}…` : o.question,
        txHash: o.tx_hash as Hex,
        at: o.updated_at,
      })),
    };
  };
}

// --- Citable's side: the take rate on every settled order (ADR-016), across all agents ---

export interface CitablePayment extends EarningsPayment {
  /** Citable's share of `amount`, USDC text. */
  fee: string;
  /** What the expert keeps, USDC text. */
  expertShare: string;
  agent: string;
  expert: string;
}

export interface CitableEarnings {
  /** Sum of fees, USDC text. */
  fees: string;
  /** Sum of expert shares, USDC text. */
  paidToExperts: string;
  count: number;
  /** Experts with at least one settled order. */
  experts: number;
  /** Newest first, at most RECENT. */
  payments: CitablePayment[];
}

export type CitableEarningsReader = () => Promise<CitableEarnings>;

/** ADR-016: 30% where we host the agent and pay the LLM (tier 1), 10% on the expert's time (tiers 2–3). */
export const TAKE_RATE: Record<number, number> = { 1: 0.3, 2: 0.1, 3: 0.1 };

export function supabaseCitableEarnings(db: SupabaseClient): CitableEarningsReader {
  return async () => {
    const res = await db
      .from("orders")
      .select("id, price, question, tx_hash, updated_at, capabilities!inner(tier), agents!inner(name, experts!inner(name))")
      .eq("is_demo", false)
      .not("tx_hash", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1000);
    if (res.error) throw new Error(`read orders: ${res.error.message}`);

    const one = <T>(v: T | T[]) => (Array.isArray(v) ? v[0] : v);
    const rows = (res.data ?? []).map((o) => {
      const agent = one(o.agents) as { name: string; experts: { name: string } | { name: string }[] };
      const price = micros(o.price);
      const fee = Math.round(price * (TAKE_RATE[(one(o.capabilities) as { tier: number }).tier] ?? 0));
      return { o, price, fee, agent: agent.name, expert: one(agent.experts).name };
    });

    return {
      fees: usdcText(rows.reduce((s, r) => s + r.fee, 0)),
      paidToExperts: usdcText(rows.reduce((s, r) => s + r.price - r.fee, 0)),
      count: rows.length,
      experts: new Set(rows.map((r) => r.expert)).size,
      payments: rows.slice(0, RECENT).map(({ o, price, fee, agent, expert }) => ({
        orderId: o.id,
        amount: usdcText(price),
        fee: usdcText(fee),
        expertShare: usdcText(price - fee),
        agent,
        expert,
        question: o.question.length > QUESTION_MAX ? `${o.question.slice(0, QUESTION_MAX - 1)}…` : o.question,
        txHash: o.tx_hash as Hex,
        at: o.updated_at,
      })),
    };
  };
}
