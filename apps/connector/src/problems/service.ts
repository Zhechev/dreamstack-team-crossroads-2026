// Problems: one capped budget per buyer question (ADR-011). Used by the MCP tools and the /problems routes.
import { formatUnits, parseUnits } from "viem";
import { authorizationRequest, FundingError, verifyFunding, type UsdcDomain } from "./authorization.js";
import type { Chain } from "./chain.js";
import { usdc, type Problem, type ProblemStore } from "./store.js";
import { newProblemWallet, type Hex } from "./wallet.js";

/** Upper bound for one problem's cap: one Circle faucet round (ADR-015). */
export const MAX_CAP = "20.00";

export interface ProblemsDeps {
  store: ProblemStore;
  chain: Chain;
  usdc: UsdcDomain;
  walletSecret: string;
  webAppUrl: string;
}

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
  payments: { amount: string; tx_hash: Hex; order_id: string | null; created_at: string }[];
  approval_url: string;
  /** EIP-712 typed data to sign, only while awaiting funding. */
  authorization?: ReturnType<typeof authorizationRequest>;
}

const units = (s: string) => parseUnits(s, 6);
const text = (n: bigint) => usdc(formatUnits(n, 6));

export function createProblems(deps: ProblemsDeps) {
  const approvalUrl = (id: string) => `${deps.webAppUrl.replace(/\/$/, "")}/approve/${id}`;

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
      payments: p.payments.map((x) => ({ amount: x.amount, tx_hash: x.txHash, order_id: x.orderId, created_at: x.createdAt })),
      approval_url: approvalUrl(p.id),
      ...(p.status === "awaiting_funding" ? { authorization: authorizationRequest(deps.usdc, p.walletAddress, p.cap) } : {}),
    };
  }

  async function seedGas(p: Problem) {
    if (p.gasSeedTx) return;
    await deps.store.setGasSeed(p.id, await deps.chain.seedGas(p.walletAddress));
  }

  /**
   * Catches a cap sent outside the approval page (e.g. a plain MetaMask transfer):
   * once the wallet holds the cap, the problem counts as funded.
   */
  async function refresh(p: Problem): Promise<Problem> {
    if (p.status !== "awaiting_funding") return p;
    if ((await deps.chain.usdcBalance(p.walletAddress)) < units(p.cap)) return p;
    await deps.store.markFunded(p.id, { buyerAddress: null, fundingTx: null });
    await seedGas(p);
    return (await deps.store.get(p.id))!;
  }

  return {
    async open(linkId: string, cap: string): Promise<ProblemState> {
      if (!/^\d+(\.\d{1,6})?$/.test(cap) || units(cap) <= 0n) throw new FundingError('cap must be a USDC amount like "2.00"');
      if (units(cap) > units(MAX_CAP)) throw new FundingError(`cap can be at most ${MAX_CAP} USDC`);
      const wallet = newProblemWallet(deps.walletSecret);
      const p = await deps.store.create({ linkId, walletAddress: wallet.address, keyEnc: wallet.keyEnc, cap: text(units(cap)) });
      return stateOf(p);
    },

    /** Public problem state by id (the approval page, the receipt). */
    async state(id: string): Promise<ProblemState | null> {
      const p = await deps.store.get(id);
      return p ? stateOf(await refresh(p)) : null;
    },

    /** budget_status for one buyer link: the given problem if it is theirs, else their latest open one. */
    async statusFor(linkId: string, problemId?: string): Promise<ProblemState | null> {
      const p = problemId ? await deps.store.get(problemId) : await deps.store.latestOpen(linkId);
      if (!p || p.linkId !== linkId) return null;
      return stateOf(await refresh(p));
    },

    /** Gasless funding: verify the buyer's signature, submit it, seed gas for the refund. */
    async fund(id: string, body: unknown): Promise<{ tx_hash: Hex; state: ProblemState } | null> {
      const p = await deps.store.get(id);
      if (!p) return null;
      if (p.status !== "awaiting_funding") throw new FundingError("this budget is already funded");
      const auth = await verifyFunding(deps.usdc, p, body);
      const tx = await deps.chain.submitAuthorization(auth);
      await deps.store.markFunded(p.id, { buyerAddress: auth.from, fundingTx: tx });
      await seedGas(p);
      return { tx_hash: tx, state: stateOf((await deps.store.get(p.id))!) };
    },
  };
}

export type Problems = ReturnType<typeof createProblems>;
