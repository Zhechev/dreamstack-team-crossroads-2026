// Live price check on Base Sepolia: a funded wallet pays the running connector over x402 (real facilitator),
// like the spike's problem wallet. Prints the cited answer and the settlement tx.
// Needs: the connector running (`pnpm --filter @citable/connector dev`) and BUYER_PRIVATE_KEY with
// ≥ 0.50 test USDC on Base Sepolia (faucet.circle.com). The EIP-3009 payment itself needs no ETH.
// Usage: pnpm --filter @citable/connector price-check:live ["question"]
import { decodePaymentRequiredHeader } from "@x402/core/http";
import { decodePaymentResponseHeader, wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const key = process.env.BUYER_PRIVATE_KEY as `0x${string}` | undefined;
if (!key) throw new Error("Set BUYER_PRIVATE_KEY (a Base Sepolia wallet with test USDC)");
const base = process.env.CONNECTOR_URL ?? "http://localhost:4010";
const question = process.argv[2] ?? "Is €180k fair for a 2-bed in Lozenets?";

const buyer = privateKeyToAccount(key);
const pay = wrapFetchWithPaymentFromConfig(fetch, { schemes: [{ network: "eip155:84532", client: new ExactEvmScheme(buyer) }] });

console.log(`${buyer.address} asks: ${question}`);
const res = await pay(`${base}/agents/lozenets-price-check/price-check`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ question }),
});
const body = await res.json();
if (!res.ok) {
  const required = res.headers.get("PAYMENT-REQUIRED");
  console.error(`HTTP ${res.status}`, required ? decodePaymentRequiredHeader(required).error ?? body : body);
  process.exit(1);
}

console.log(`\n${body.text}\n`);
for (const c of body.citations) console.log(`  [${c.unit_id}] "${c.quote}" (as of ${c.as_of})`);
const header = res.headers.get("PAYMENT-RESPONSE");
const settlement = header ? decodePaymentResponseHeader(header) : undefined;
console.log(`\norder ${body.order_id}`);
if (settlement?.transaction) console.log(`settled: https://sepolia.basescan.org/tx/${settlement.transaction}`);
