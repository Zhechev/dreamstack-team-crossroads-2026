// Dummy expert route: 0.50 USDC per price check, settled only if the check hook passes.
import { Hono } from "hono";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";

export const NETWORK = "eip155:84532"; // Base Sepolia
export const PRICE = "$0.50";

// Stand-in for the citation check (ticket 09). `?fail=1` forces a failure.
function checkHook(answer: { cited: boolean }): boolean {
  return answer.cited;
}

export function createApp(opts: { payTo: `0x${string}`; facilitatorUrl: string }) {
  const facilitator = new HTTPFacilitatorClient({ url: opts.facilitatorUrl });
  const resourceServer = new x402ResourceServer(facilitator).register(NETWORK, new ExactEvmScheme());

  const app = new Hono();
  app.use(
    paymentMiddleware(
      {
        "GET /price-check": {
          accepts: [{ scheme: "exact", price: PRICE, network: NETWORK, payTo: opts.payTo }],
          description: "Tier 1 price check (spike)",
        },
      },
      resourceServer,
    ),
  );

  // The middleware verifies the payment before this runs and settles only on a <400 response,
  // so returning 422 when the check fails means the buyer is never charged.
  app.get("/price-check", (c) => {
    const answer = { text: "Fair price: 182,000 EUR", cited: c.req.query("fail") !== "1" };
    if (!checkHook(answer)) return c.json({ error: "citation_check_failed" }, 422);
    return c.json(answer);
  });

  return app;
}
