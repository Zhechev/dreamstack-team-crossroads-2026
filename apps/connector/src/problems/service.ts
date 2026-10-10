// Problems: one capped budget per buyer question (ADR-011). Used by the MCP tools and the /problems routes.
import { Receipt } from "@citable/protocol";
import { formatUnits, isAddress, parseUnits } from "viem";
import { authorizationRequest, FundingError, verifyFunding, type UsdcDomain } from "./authorization.js";
import type { Chain } from "./chain.js";
import { AskError, type AgentPayer } from "./pay.js";
import { usdc, type Problem, type ProblemStore } from "./store.js";
import { decryptKey, newProblemWallet, type Hex } from "./wallet.js";

/** Upper bound for one problem's cap: one Circle faucet round (ADR-015). */
export const MAX_CAP = "20.00";

export interface ProblemsDeps {
  store: ProblemStore;
  chain: Chain;
  usdc: UsdcDomain;
  walletSecret: string;
  webAppUrl: string;
  payer: AgentPayer;
  /** Source name and URL per cited unit, so every figure reaches the buyer with its source. */
  unitSources: (ids: string[]) => Promise<Map<string, { source: string; source_url: string | null }>>;
}

/** Ticket 12: Claude fills identity placeholders itself; the agent never sees who the buyer is (ADR-012). */
export const PLACEHOLDER_NOTE =
  "Placeholders like {{full_name}} are slots for the buyer's details: fill them only in your final reply, never send them back to Citable.";

/** Citable's take on price checks (ADR-016). Shown on receipts, not collected in the MVP. */
export const FEE_PERCENT = 30n;

export const FEE_NOTE = "Citable fee (30% on price checks) waived during the hackathon; the expert received the full amount.";

/** What Claude, the approval page and the receipt see. Never includes the wallet key. */
export interface ProblemState {
  problem_id: string;
  wallet_address: Hex;
  cap: string;
  status: Problem["status"];
  funded: boolean;
  buyer_address: Hex | null;
  funding_tx: Hex | null;
  spent: string;
  remaining: string;
  payments: PaymentState[];
  /** Set once the budget is closed and the remainder went back to the buyer. */
  refund_tx: Hex | null;
  refund_amount: string | null;
  approval_url: string;
  receipt_url: string;
  /** EIP-712 typed data to sign, only while awaiting funding. */
  authorization?: ReturnType<typeof authorizationRequest>;
}

/** One payment as the approval page and the receipt (ticket 17) show it. */
export interface PaymentState {
  amount: string;
  tx_hash: Hex;
  order_id: string | null;
  created_at: string;
  capability: string | null;
  agent: string | null;
  terms_hash: Hex | null;
  citations_verified: boolean;
  /** Fee split of `amount`; the fee is waived during the hackathon, so the expert got the full amount. */
  expert_share: string;
  fee: string;
  fee_waived: true;
  /** Only on the public state (GET /problems/:id): source and date of each cited figure, no quotes. */
  citations?: { source: string | null; source_url: string | null; as_of: string }[];
}

const units = (s: string) => parseUnits(s, 6);
const text = (n: bigint) => usdc(formatUnits(n, 6));

export function createProblems(deps: ProblemsDeps) {
  const approvalUrl = (id: string) => `${deps.webAppUrl.replace(/\/$/, "")}/approve/${id}`;
  const receiptUrl = (id: string) => `${deps.webAppUrl.replace(/\/$/, "")}/receipt/${id}`;

  function paymentOf(x: Problem["payments"][number]): PaymentState {
    const fee = (units(x.amount) * FEE_PERCENT) / 100n;
    return {
      amount: x.amount,
      tx_hash: x.txHash,
      order_id: x.orderId,
      created_at: x.createdAt,
      capability: x.order?.capability || null,
      agent: x.order?.agent || null,
      terms_hash: x.termsHash,
      citations_verified: x.order?.citationsVerified ?? false,
      expert_share: text(units(x.amount) - fee),
      fee: text(fee),
      fee_waived: true,
    };
  }

  /** The public state plus where each cited figure came from, for the receipt. */
  async function withSources(p: Problem): Promise<ProblemState> {
    const state = stateOf(p);
    const ids = p.payments.flatMap((x) => x.order?.citations.map((c) => c.unit_id) ?? []);
    const sources = ids.length ? await deps.unitSources([...new Set(ids)]) : new Map();
    state.payments = state.payments.map((s, i) => ({
      ...s,
      citations: (p.payments[i].order?.citations ?? []).map((c) => ({
        ...(sources.get(c.unit_id) ?? { source: null, source_url: null }),
        as_of: c.as_of,
      })),
    }));
    return state;
  }

  function stateOf(p: Problem): ProblemState {
    const spent = p.payments.reduce((sum, x) => sum + units(x.amount), 0n);
    return {
      problem_id: p.id,
      wallet_address: p.walletAddress,
      cap: p.cap,
      status: p.status,
      funded: p.status !== "awaiting_funding",
      buyer_address: p.buyerAddress,
      funding_tx: p.fundingTx,
      spent: text(spent),
      remaining: text(units(p.cap) - spent),
      payments: p.payments.map(paymentOf),
      refund_tx: p.refundTx,
      refund_amount: p.refundAmount,
      approval_url: approvalUrl(p.id),
      receipt_url: receiptUrl(p.id),
      ...(p.status === "awaiting_funding" ? { authorization: authorizationRequest(deps.usdc, p.walletAddress, p.cap) } : {}),
    };
  }

  async function seedGas(p: Problem) {
    if (p.gasSeedTx) return;
    await deps.store.setGasSeed(p.id, await deps.chain.seedGas(p.walletAddress));
  }

  /**
   * The seed only pays for the refund on close, so a failed seed (e.g. the gas funder is out of ETH)
   * must not fail a top-up whose USDC already landed; close seeds again.
   */
  async function trySeedGas(p: Problem) {
    try {
      await seedGas(p);
    } catch (e) {
      console.error(`gas seed for problem ${p.id} failed; retried on close:`, e instanceof Error ? e.message : e);
    }
  }

  /**
   * Catches a cap sent outside the approval page (e.g. a plain MetaMask transfer):
   * once the wallet holds the cap, the problem counts as funded.
   */
  async function refresh(p: Problem): Promise<Problem> {
    if (p.status !== "awaiting_funding") return p;
    if ((await deps.chain.usdcBalance(p.walletAddress)) < units(p.cap)) return p;
    await deps.store.markFunded(p.id, { buyerAddress: null, fundingTx: null });
    await trySeedGas(p);
    return (await deps.store.get(p.id))!;
  }

  return {
    /**
     * The buyer's budget (ADR-011, top up once): one open budget per link, reused for every question.
     * Returns the open one if there is one; opens a new one only when there is none.
     */
    async open(linkId: string, cap: string): Promise<ProblemState & { existing: boolean }> {
      if (!/^\d+(\.\d{1,6})?$/.test(cap) || units(cap) <= 0n) throw new FundingError('cap must be a USDC amount like "2.00"');
      if (units(cap) > units(MAX_CAP)) throw new FundingError(`cap can be at most ${MAX_CAP} USDC`);
      const current = await deps.store.latestOpen(linkId);
      if (current) return { ...stateOf(await refresh(current)), existing: true };
      const wallet = newProblemWallet(deps.walletSecret);
      const p = await deps.store.create({ linkId, walletAddress: wallet.address, keyEnc: wallet.keyEnc, cap: text(units(cap)) });
      return { ...stateOf(p), existing: false };
    },

    /** Public problem state by id (the approval page, the receipt). */
    async state(id: string): Promise<ProblemState | null> {
      const p = await deps.store.get(id);
      return p ? withSources(await refresh(p)) : null;
    },

    /** budget_status for one buyer link: the given problem if it is theirs, else their latest open one. */
    async statusFor(linkId: string, problemId?: string): Promise<ProblemState | null> {
      const p = problemId ? await deps.store.get(problemId) : await deps.store.latestOpen(linkId);
      if (!p || p.linkId !== linkId) return null;
      return stateOf(await refresh(p));
    },

    /** Pays the agent from this link's funded budget and returns the cited answer (ticket 12). */
    async ask(linkId: string, input: { problemId?: string; agentId: string; question: string }) {
      const found = input.problemId ? await deps.store.get(input.problemId) : await deps.store.latestOpen(linkId);
      if (!found || found.linkId !== linkId) throw new AskError("No open budget. Call approve_budget first.");
      const p = await refresh(found);
      if (p.status === "closed") throw new AskError("This budget is closed. Open a new one with approve_budget.");
      if (p.status !== "funded") throw new AskError(`The budget isn't topped up yet. Send the buyer the top-up link: ${approvalUrl(p.id)}`);

      const remaining = units(stateOf(p).remaining);
      const result = await deps.payer.priceCheck({
        walletKey: decryptKey(p.keyEnc, deps.walletSecret),
        agentId: input.agentId,
        question: input.question,
        remaining,
      });
      if (!result.ok) {
        return {
          charged: false as const,
          reason:
            result.reason === "citation_check_failed"
              ? "The agent's answer failed the citation check, so it was not paid for and is not shown."
              : `The agent could not answer (${result.reason}). Nothing was paid.`,
          order_id: result.orderId ?? null,
          remaining: text(remaining),
        };
      }

      const { outcome } = result;
      await deps.store.addPayment(p.id, { amount: text(result.amount), txHash: result.txHash, orderId: outcome.order_id });
      const sources = await deps.unitSources(outcome.citations.map((c) => c.unit_id));
      return {
        charged: true as const,
        answer: outcome.text,
        citations: outcome.citations.map((c) => ({ ...c, ...(sources.get(c.unit_id) ?? { source: null, source_url: null }) })),
        citations_verified: true,
        order_id: outcome.order_id,
        agent_version: outcome.agent_version,
        paid: text(result.amount),
        tx_hash: result.txHash,
        remaining: text(remaining - result.amount),
        note: PLACEHOLDER_NOTE,
      };
    },

    /** Refunds what's left to the buyer and returns one Receipt per paid order (ticket 12). */
    async close(linkId: string, input: { problemId?: string; refundTo?: string }) {
      const p = input.problemId ? await deps.store.get(input.problemId) : await deps.store.latestOpen(linkId);
      if (!p || p.linkId !== linkId) throw new AskError("No open budget to close.");
      if (p.status === "closed") throw new AskError("This budget is already closed.");

      const balance = p.status === "awaiting_funding" ? 0n : await deps.chain.usdcBalance(p.walletAddress);
      const to = (p.buyerAddress ?? input.refundTo) as Hex | undefined;
      if (balance > 0n && (!to || !isAddress(to))) {
        throw new AskError("This budget was funded by a plain transfer, so I need the buyer's address: pass refund_to.");
      }
      if (balance > 0n) await seedGas(p);
      const refundTx = balance > 0n ? await deps.chain.transferUsdc(decryptKey(p.keyEnc, deps.walletSecret), to!, balance) : null;
      await deps.store.markClosed(p.id, { refundTx, refundAmount: text(balance) });

      const receipts = p.payments
        .filter((x) => x.orderId && x.termsHash)
        .map((x) => Receipt.parse({ order_id: x.orderId, tx_hash: x.txHash, amount: x.amount, fee: "0.00", terms_hash: x.termsHash }));
      const spent = p.payments.reduce((sum, x) => sum + units(x.amount), 0n);
      return {
        problem_id: p.id,
        cap: p.cap,
        spent: text(spent),
        refunded: text(balance),
        refund_to: balance > 0n ? to! : null,
        refund_tx: refundTx,
        receipt_url: receiptUrl(p.id),
        receipts,
        fee_note: FEE_NOTE,
        next: "The budget is closed. For another paid answer the buyer tops up again: call approve_budget and send the top-up link (one signature, no gas).",
      };
    },

    /** Gasless funding: verify the buyer's signature, submit it, seed gas for the refund. */
    async fund(id: string, body: unknown): Promise<{ tx_hash: Hex; state: ProblemState } | null> {
      const p = await deps.store.get(id);
      if (!p) return null;
      if (p.status !== "awaiting_funding") throw new FundingError("this budget is already funded");
      const auth = await verifyFunding(deps.usdc, p, body);
      const tx = await deps.chain.submitAuthorization(auth);
      await deps.store.markFunded(p.id, { buyerAddress: auth.from, fundingTx: tx });
      await trySeedGas(p);
      return { tx_hash: tx, state: stateOf((await deps.store.get(p.id))!) };
    },
  };
}

export type Problems = ReturnType<typeof createProblems>;
