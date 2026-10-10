// x402 paywall for paid agent routes (pattern: spikes/03-x402-problem-wallet/server.ts).
// The middleware verifies the payment before the handler and settles only when the handler returns < 400,
// so a failed citation check (422) is never charged.
import { decodePaymentResponseHeader } from "@x402/core/http";
import { HTTPFacilitatorClient, type FacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import type { MiddlewareHandler } from "hono";
import type { AgentLoader } from "./load.js";

export const NETWORK = "eip155:84532"; // Base Sepolia
export const PRICE_CHECK_ROUTE = "POST /agents/:id/price-check";

const agentIdFromPath = (path: string) => decodeURIComponent(path.split("/")[2] ?? "");

/** Built on the first paid request, so the service starts (and tests run) without reaching the facilitator. */
export function priceCheckPaywall(opts: { loadAgent: AgentLoader; facilitator: () => FacilitatorClient }): MiddlewareHandler {
  let middleware: MiddlewareHandler | undefined;

  const build = () => {
    const server = new x402ResourceServer(opts.facilitator()).register(NETWORK, new ExactEvmScheme());
    const agentOf = async (path: string) => {
      const agent = await opts.loadAgent(agentIdFromPath(path));
      if (!agent) throw new Error(`no agent for ${path}`);
      return agent;
    };
    return paymentMiddleware(
      {
        [PRICE_CHECK_ROUTE]: {
          accepts: {
            scheme: "exact",
            network: NETWORK,
            // Each agent is paid at its own payout address and price (ADR-015).
            payTo: async (ctx) => (await agentOf(ctx.path)).payout_address,
            price: async (ctx) => `$${(await agentOf(ctx.path)).capabilities.find((c) => c.slug === "price-check")!.price}`,
          },
          description: "Tier 1 price check: fair price range + comparable sales, each cited",
          mimeType: "application/json",
        },
      },
      server,
    );
  };

  return (c, next) => (middleware ??= build())(c, next);
}

export const facilitatorClient = (url: string) => () => new HTTPFacilitatorClient({ url });

/** The settlement the payment middleware attached to the response, if it settled. */
export function settlementOf(res: Response): { transaction: string; payer?: string } | null {
  const header = res.headers.get("PAYMENT-RESPONSE");
  if (!header) return null;
  const settlement = decodePaymentResponseHeader(header);
  return settlement.success ? { transaction: settlement.transaction, payer: settlement.payer } : null;
}
