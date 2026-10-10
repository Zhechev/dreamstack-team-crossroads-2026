// Spike 03: buyer funds a capped problem wallet → problem wallet pays x402 with no prompt
// → failed check is not settled → remainder goes back to the buyer.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { serve } from "@hono/node-server";
import { decodePaymentResponseHeader, wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { createPublicClient, createWalletClient, erc20Abi, formatEther, formatUnits, http, parseEther, parseUnits } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { createApp, NETWORK } from "./server.js";

const USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const; // Base Sepolia USDC
const CAP = parseUnits("2.00", 6);
const GAS_SEED = parseEther("0.00005"); // enough for one ERC-20 transfer on Base Sepolia
const PORT = 4021;
const WALLETS_FILE = "problem-wallets.json";

const env = (name: string, fallback?: string) => {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing ${name} in .env (see .env.example)`);
  return v;
};
const tx = (hash: string) => `https://sepolia.basescan.org/tx/${hash}`;
const usdc = (n: bigint) => `${formatUnits(n, 6)} USDC`;

const transport = http(env("BASE_SEPOLIA_RPC_URL", "https://sepolia.base.org"));
const pub = createPublicClient({ chain: baseSepolia, transport });
const buyer = privateKeyToAccount(env("BUYER_PRIVATE_KEY") as `0x${string}`);
const seller = env("SELLER_ADDRESS") as `0x${string}`;
const buyerWallet = createWalletClient({ account: buyer, chain: baseSepolia, transport });

const balance = (address: `0x${string}`) =>
  pub.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [address] });

async function waitFor(label: string, hash: `0x${string}`) {
  const r = await pub.waitForTransactionReceipt({ hash });
  if (r.status !== "success") throw new Error(`${label} reverted: ${tx(hash)}`);
  console.log(`  ✓ ${label}: ${tx(hash)}`);
}

async function main() {
  console.log(`Buyer  ${buyer.address}: ${usdc(await balance(buyer.address))}, ${formatEther(await pub.getBalance({ address: buyer.address }))} ETH`);
  console.log(`Seller ${seller}: ${usdc(await balance(seller))}`);

  // 1. Fresh problem wallet. Keys are kept on disk so funds are recoverable if the run crashes.
  const key = generatePrivateKey();
  const problem = privateKeyToAccount(key);
  const saved = existsSync(WALLETS_FILE) ? JSON.parse(readFileSync(WALLETS_FILE, "utf8")) : [];
  writeFileSync(WALLETS_FILE, JSON.stringify([...saved, { address: problem.address, key, at: new Date().toISOString() }], null, 2));
  console.log(`\n1. Problem wallet ${problem.address}`);

  // 2. Buyer approval (MetaMask in the product): transfer the cap + seed gas for the refund.
  console.log(`2. Buyer funds the problem wallet with ${usdc(CAP)} + ${formatEther(GAS_SEED)} ETH`);
  await waitFor("cap transfer", await buyerWallet.writeContract({ address: USDC, abi: erc20Abi, functionName: "transfer", args: [problem.address, CAP] }));
  await waitFor("gas seed", await buyerWallet.sendTransaction({ to: problem.address, value: GAS_SEED }));

  // 3. Start the paywalled route and pay from the problem wallet with no prompt.
  const server = serve({ fetch: createApp({ payTo: seller, facilitatorUrl: env("FACILITATOR_URL", "https://x402.org/facilitator") }).fetch, port: PORT });
  const pay = wrapFetchWithPaymentFromConfig(fetch, { schemes: [{ network: NETWORK, client: new ExactEvmScheme(problem) }] });
  const url = `http://localhost:${PORT}/price-check`;
  const results: Record<string, unknown> = {};

  try {
    console.log("3a. Paid call with a FAILING check → expect 422 and no settlement");
    const before = await balance(problem.address);
    const failed = await pay(`${url}?fail=1`);
    const after = await balance(problem.address);
    console.log(`  status ${failed.status}, problem wallet ${usdc(before)} → ${usdc(after)}`);
    results.failedCheckNotSettled = failed.status === 422 && after === before;

    console.log("3b. Paid call with a PASSING check → expect 200 and a settlement tx");
    const ok = await pay(url);
    const header = ok.headers.get("PAYMENT-RESPONSE") ?? ok.headers.get("X-PAYMENT-RESPONSE");
    const settlement = header ? decodePaymentResponseHeader(header) : undefined;
    console.log(`  status ${ok.status}, body ${await ok.text()}`);
    if (settlement?.transaction) console.log(`  ✓ settled: ${tx(settlement.transaction)}`);
    results.paidAndSettled = ok.status === 200 && Boolean(settlement?.success);
    results.settlementTx = settlement?.transaction;
  } finally {
    server.close();
  }

  // 4. Close the problem: remainder back to the buyer (normal transfer, uses the seeded ETH).
  // Settlement can land a moment after the response, so read the balance after a short wait.
  await new Promise((r) => setTimeout(r, 3000));
  const remainder = await balance(problem.address);
  console.log(`4. Refund remainder ${usdc(remainder)} to buyer`);
  const problemWallet = createWalletClient({ account: problem, chain: baseSepolia, transport });
  await waitFor("refund", await problemWallet.writeContract({ address: USDC, abi: erc20Abi, functionName: "transfer", args: [buyer.address, remainder] }));
  results.refunded = (await balance(problem.address)) === 0n;
  results.refundAmount = usdc(remainder);

  console.log("\nResult:", results);
  const go = results.failedCheckNotSettled && results.paidAndSettled && results.refunded;
  console.log(go ? "GO" : "NO-GO");
  process.exit(go ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
