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
const PRICE_UNITS = parseUnits("0.50", 6);
const GAS_SEED = parseEther("0.00001"); // ~25x one ERC-20 transfer at Base Sepolia gas prices (~0.006 gwei)
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

// The public RPC is load-balanced and "latest" can be stale, so checks read at a known block,
// retrying while the node serving the request hasn't seen that block yet.
async function balanceAt(address: `0x${string}`, blockNumber: bigint) {
  for (let i = 0; ; i++) {
    try {
      return await pub.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [address], blockNumber });
    } catch (e) {
      if (i >= 10) throw e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

async function waitFor(label: string, hash: `0x${string}`) {
  const r = await pub.waitForTransactionReceipt({ hash });
  if (r.status !== "success") throw new Error(`${label} reverted: ${tx(hash)}`);
  console.log(`  ✓ ${label}: ${tx(hash)}`);
  return r;
}

async function main() {
  console.log(`Buyer  ${buyer.address}: ${usdc(await balance(buyer.address))}, ${formatEther(await pub.getBalance({ address: buyer.address }))} ETH`);
  console.log(`Seller ${seller}: ${usdc(await balance(seller))}`);

  // The buyer pays gas for the cap transfer and the gas seed, so it needs ETH as well as USDC.
  const minEth = GAS_SEED * 3n;
  if ((await pub.getBalance({ address: buyer.address })) < minEth) {
    throw new Error(`Buyer needs at least ${formatEther(minEth)} Base Sepolia ETH for gas (faucet: https://docs.base.org/base-chain/tools/network-faucets)`);
  }
  if ((await balance(buyer.address)) < CAP) throw new Error(`Buyer needs at least ${usdc(CAP)} (faucet: https://faucet.circle.com)`);

  // 1. Fresh problem wallet. Keys are kept on disk so funds are recoverable if the run crashes.
  const key = generatePrivateKey();
  const problem = privateKeyToAccount(key);
  const saved = existsSync(WALLETS_FILE) ? JSON.parse(readFileSync(WALLETS_FILE, "utf8")) : [];
  writeFileSync(WALLETS_FILE, JSON.stringify([...saved, { address: problem.address, key, at: new Date().toISOString() }], null, 2));
  console.log(`\n1. Problem wallet ${problem.address}`);

  // 2. Buyer approval (MetaMask in the product): transfer the cap + seed gas for the refund.
  console.log(`2. Buyer funds the problem wallet with ${usdc(CAP)} + ${formatEther(GAS_SEED)} ETH`);
  const funded = await waitFor("cap transfer", await buyerWallet.writeContract({ address: USDC, abi: erc20Abi, functionName: "transfer", args: [problem.address, CAP] }));
  await waitFor("gas seed", await buyerWallet.sendTransaction({ to: problem.address, value: GAS_SEED }));

  // 3. Start the paywalled route and pay from the problem wallet with no prompt.
  const server = serve({ fetch: createApp({ payTo: seller, facilitatorUrl: env("FACILITATOR_URL", "https://x402.org/facilitator") }).fetch, port: PORT });
  const pay = wrapFetchWithPaymentFromConfig(fetch, { schemes: [{ network: NETWORK, client: new ExactEvmScheme(problem) }] });
  const url = `http://localhost:${PORT}/price-check`;
  const results: Record<string, unknown> = {};

  try {
    console.log("3a. Paid call with a FAILING check → expect 422 and no settlement");
    const sellerStart = await balanceAt(seller, funded.blockNumber);
    const failed = await pay(`${url}?fail=1`);
    console.log(`  status ${failed.status}`);

    console.log("3b. Paid call with a PASSING check → expect 200 and a settlement tx");
    const ok = await pay(url);
    const header = ok.headers.get("PAYMENT-RESPONSE") ?? ok.headers.get("X-PAYMENT-RESPONSE");
    const settlement = header ? decodePaymentResponseHeader(header) : undefined;
    console.log(`  status ${ok.status}, body ${await ok.text()}`);
    if (settlement?.transaction) console.log(`  ✓ settled: ${tx(settlement.transaction)}`);
    if (!settlement?.transaction) throw new Error("No settlement tx in the PAYMENT-RESPONSE header");
    const settled = await pub.waitForTransactionReceipt({ hash: settlement.transaction as `0x${string}` });

    // Seller gained exactly one price by the settlement block: the passing call settled and the failing one didn't.
    const sellerDelta = (await balanceAt(seller, settled.blockNumber)) - sellerStart;
    console.log(`  seller received ${usdc(sellerDelta)} in total`);
    results.failedCheckNotSettled = failed.status === 422 && sellerDelta === PRICE_UNITS;
    results.paidAndSettled = ok.status === 200 && Boolean(settlement.success) && settled.status === "success";
    results.settlementTx = settlement.transaction;
    results.settlementBlock = settled.blockNumber;
  } finally {
    server.close();
  }

  // 4. Close the problem: remainder back to the buyer (normal transfer, uses the seeded ETH).
  const remainder = await balanceAt(problem.address, results.settlementBlock as bigint);
  console.log(`4. Refund remainder ${usdc(remainder)} to buyer`);
  const problemWallet = createWalletClient({ account: problem, chain: baseSepolia, transport });
  const refund = await waitFor("refund", await problemWallet.writeContract({ address: USDC, abi: erc20Abi, functionName: "transfer", args: [buyer.address, remainder] }));
  results.refunded = remainder === CAP - PRICE_UNITS && (await balanceAt(problem.address, refund.blockNumber)) === 0n;
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
