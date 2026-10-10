// Fund a problem the way the approval page will (ticket 15): sign the EIP-3009 typed data from the
// problem state with BUYER_PRIVATE_KEY and post it to /problems/:id/fund.
// Usage: pnpm --filter @citable/connector fund-problem <problem_id>
import { privateKeyToAccount } from "viem/accounts";

const [problemId] = process.argv.slice(2);
const base = process.env.CONNECTOR_URL ?? "http://localhost:4010";
const key = process.env.BUYER_PRIVATE_KEY as `0x${string}` | undefined;
if (!problemId || !key) throw new Error("Usage: fund-problem <problem_id>, with BUYER_PRIVATE_KEY in .env");

const buyer = privateKeyToAccount(key);
const state = await (await fetch(`${base}/problems/${problemId}`)).json();
if (!state.authorization) throw new Error(`Nothing to sign: ${JSON.stringify(state)}`);

const { domain, types, primaryType, message: m } = state.authorization;
const signature = await buyer.signTypedData({
  domain,
  types,
  primaryType,
  message: { ...m, from: buyer.address, value: BigInt(m.value), validAfter: BigInt(m.validAfter), validBefore: BigInt(m.validBefore) },
});
const res = await fetch(`${base}/problems/${problemId}/fund`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ from: buyer.address, signature, validAfter: m.validAfter, validBefore: m.validBefore, nonce: m.nonce }),
});
console.log(res.status, JSON.stringify(await res.json(), null, 2));
