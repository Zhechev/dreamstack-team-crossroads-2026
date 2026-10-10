// Order rows for paid agent calls. Lifecycle (Data Model): paid → running → checked → settled → delivered;
// a failed citation check ends in failed_check and is never settled.
import type { SignedOutcome } from "@citable/protocol";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentConfig } from "./load.js";

export interface StartedOrder {
  id: string;
  terms_hash: string;
}

export interface OrderStore {
  /** Reuses an order from create_order (must be this agent's and unpaid) or creates one. Marks it running. */
  start(input: { agent: AgentConfig; capability: string; question: string; orderId?: string }): Promise<StartedOrder>;
  /** Stores the signed answer; `checked` says whether the citation check passed. */
  answered(orderId: string, outcome: SignedOutcome, checked: boolean | null): Promise<void>;
  /** The citation check failed: never settled, and a negative reputation event for the agent (ADR-009). */
  failedCheck(input: { orderId: string; agent: AgentConfig; capability: string; outcome: SignedOutcome; failures: string[] }): Promise<void>;
  /** After the x402 facilitator settled the payment. */
  settled(orderId: string, txHash: string, payer: string | undefined): Promise<void>;
}

export class OrderError extends Error {
  constructor(readonly status: 400 | 404 | 409, message: string) {
    super(message);
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function supabaseOrderStore(db: SupabaseClient): OrderStore {
  // The client is untyped (no generated DB types), so rows are `any`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Result = { data: any; error: { message: string } | null };
  /** For writes and optional reads. */
  const ok = (r: Result, what: string) => {
    if (r.error) throw new Error(`${what}: ${r.error.message}`);
    return r.data;
  };
  /** For reads that must return exactly one row. */
  const row = (r: Result, what: string) => {
    const data = ok(r, what);
    if (data === null) throw new Error(`${what}: no row`);
    return data;
  };

  return {
    async start({ agent, capability, question, orderId }) {
      if (orderId !== undefined) {
        if (!UUID.test(orderId)) throw new OrderError(400, "order_id must be a uuid");
        const order = ok(
          await db.from("orders").select("id, agent_id, status, terms_hash").eq("id", orderId).maybeSingle(),
          "read order",
        );
        if (!order || order.agent_id !== agent.id) throw new OrderError(404, "order not found for this agent");
        if (!["awaiting_payment", "evaluated"].includes(order.status)) {
          throw new OrderError(409, `order is already ${order.status}`);
        }
        ok(await db.from("orders").update({ status: "running" }).eq("id", orderId), "start order");
        return { id: order.id, terms_hash: order.terms_hash };
      }

      const cap = agent.capabilities.find((c) => c.slug === capability)!;
      const { id: capabilityId } = row(
        await db.from("capabilities").select("id").eq("agent_id", agent.id).eq("slug", capability).single(),
        "read capability",
      );
      const versionRow = row(
        await db.from("agent_versions").select("id").eq("agent_id", agent.id).eq("status", "authorised").single(),
        "read version",
      );
      const terms = row(
        await db.from("terms_versions").select("hash").order("created_at", { ascending: false }).limit(1).single(),
        "read terms",
      );
      const created = row(
        await db
          .from("orders")
          .insert({
            agent_id: agent.id,
            capability_id: capabilityId,
            agent_version_id: versionRow.id,
            question,
            status: "running",
            price: cap.price,
            terms_hash: terms.hash,
          })
          .select("id, terms_hash")
          .single(),
        "create order",
      );
      return created;
    },

    async answered(orderId, outcome, checked) {
      ok(
        await db
          .from("orders")
          .update({
            status: checked ? "checked" : "running",
            answer: outcome.text,
            citations: outcome.citations,
            signature: outcome.signature,
            citations_verified: checked,
          })
          .eq("id", orderId),
        "store answer",
      );
    },

    async failedCheck({ orderId, agent, capability, outcome, failures }) {
      ok(
        await db
          .from("orders")
          .update({
            status: "failed_check",
            answer: outcome.text,
            citations: outcome.citations,
            signature: outcome.signature,
            citations_verified: false,
          })
          .eq("id", orderId),
        "mark failed check",
      );
      const cap = row(
        await db.from("capabilities").select("id").eq("agent_id", agent.id).eq("slug", capability).single(),
        "read capability",
      );
      ok(
        await db.from("reputation_events").insert({
          agent_id: agent.id,
          capability_id: cap.id,
          order_id: orderId,
          kind: "citation_check_failed",
          delta: -1,
          details: { failures },
        }),
        "record reputation event",
      );
    },

    async settled(orderId, txHash, payer) {
      ok(
        await db
          .from("orders")
          .update({ status: "delivered", tx_hash: txHash, payer_address: payer ?? null })
          .eq("id", orderId),
        "record settlement",
      );
    },
  };
}
