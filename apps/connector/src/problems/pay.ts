// ask's payment leg: the problem wallet pays an agent's x402 route by itself (ADR-011), never above what's left.
import { SignedOutcome } from "@citable/protocol";
import { decodePaymentRequiredHeader, decodePaymentResponseHeader } from "@x402/core/http";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "./wallet.js";

const NETWORK = "eip155:84532";

export class AskError extends Error {}

export type PaidAnswer =
  | { ok: true; outcome: SignedOutcome; amount: bigint; txHash: Hex }
  /** The agent ran but the citation check failed: the payment was never settled. */
  | { ok: false; reason: string; orderId?: string; failures?: string[] };

export interface AgentPayer {
  priceCheck(input: { walletKey: Hex; agentId: string; question: string; remaining: bigint }): Promise<PaidAnswer>;
}

/**
 * `fetch` reaches the agent routes. In this service it is the app itself (in-process), but the
 * payment is still real x402: 402 → signed authorisation → facilitator verify/settle on Base Sepolia.
 */
export function x402AgentPayer(fetch: typeof globalThis.fetch, baseUrl = "http://connector.internal"): AgentPayer {
  return {
    async priceCheck({ walletKey, agentId, question, remaining }) {
      const url = `${baseUrl}/agents/${encodeURIComponent(agentId)}/price-check`;
      const init = { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question }) };

      // Ask for the price first, so a payment above what's left is never signed.
      const quote = await fetch(url, init);
      if (quote.status !== 402) {
        const body = (await quote.json().catch(() => ({}))) as { error?: string };
        throw new AskError(body.error ?? `agent answered HTTP ${quote.status} instead of a price`);
      }
      const required = decodePaymentRequiredHeader(quote.headers.get("PAYMENT-REQUIRED") ?? "");
      const amount = BigInt(required.accepts[0].amount);
      if (amount > remaining) {
        throw new AskError(`the price (${Number(amount) / 1e6} USDC) is more than what's left in the budget (${Number(remaining) / 1e6} USDC)`);
      }

      const pay = wrapFetchWithPaymentFromConfig(fetch, {
        schemes: [{ network: NETWORK, client: new ExactEvmScheme(privateKeyToAccount(walletKey)) }],
      });
      const res = await pay(url, init);
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      if (res.status === 422) {
        return {
          ok: false,
          reason: String(body.error ?? "no_answer"),
          orderId: body.order_id as string | undefined,
          failures: body.failures as string[] | undefined,
        };
      }
      if (!res.ok) throw new AskError(String(body.error ?? `agent answered HTTP ${res.status}`));

      const header = res.headers.get("PAYMENT-RESPONSE");
      const settlement = header ? decodePaymentResponseHeader(header) : undefined;
      if (!settlement?.success || !settlement.transaction) throw new AskError("the agent answered but the payment did not settle");
      return { ok: true, outcome: SignedOutcome.parse(body), amount, txHash: settlement.transaction as Hex };
    },
  };
}
