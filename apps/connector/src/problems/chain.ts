// Base Sepolia access for problem wallets. Use a dedicated RPC: the public one returns stale reads (ticket 03).
import { createPublicClient, createWalletClient, erc20Abi, http, parseEther, parseSignature } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import type { SignedAuthorization } from "./authorization.js";
import type { Hex } from "./wallet.js";

/** ~25× one ERC-20 transfer at Base Sepolia gas prices: pays the remainder refund on close. */
export const GAS_SEED = parseEther("0.00001");

export interface Chain {
  usdcBalance(address: Hex): Promise<bigint>;
  /** Submits the buyer's transferWithAuthorization from the gas funder; resolves once mined. */
  submitAuthorization(auth: SignedAuthorization): Promise<Hex>;
  /** Sends GAS_SEED ETH from the gas funder; resolves once mined. */
  seedGas(to: Hex): Promise<Hex>;
  /** A plain USDC transfer signed by a problem wallet (the remainder refund); gas comes from its seed. */
  transferUsdc(fromKey: Hex, to: Hex, amount: bigint): Promise<Hex>;
}

const transferWithAuthorizationAbi = [
  {
    type: "function",
    name: "transferWithAuthorization",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;

export function baseSepoliaChain(opts: { rpcUrl: string; usdcAddress: Hex; gasFunderKey?: Hex }): Chain {
  const transport = http(opts.rpcUrl);
  const pub = createPublicClient({ chain: baseSepolia, transport });
  const funder = () => {
    if (!opts.gasFunderKey) throw new Error("Set GAS_FUNDER_PRIVATE_KEY (see .env.example)");
    return createWalletClient({ account: privateKeyToAccount(opts.gasFunderKey), chain: baseSepolia, transport });
  };
  const mined = async (hash: Hex, what: string) => {
    const r = await pub.waitForTransactionReceipt({ hash });
    if (r.status !== "success") throw new Error(`${what} reverted: ${hash}`);
    return hash;
  };

  return {
    usdcBalance: (address) =>
      pub.readContract({ address: opts.usdcAddress, abi: erc20Abi, functionName: "balanceOf", args: [address] }),

    async submitAuthorization(auth) {
      const { v, r, s, yParity } = parseSignature(auth.signature);
      const hash = await funder().writeContract({
        address: opts.usdcAddress,
        abi: transferWithAuthorizationAbi,
        functionName: "transferWithAuthorization",
        args: [auth.from, auth.to, auth.value, auth.validAfter, auth.validBefore, auth.nonce, Number(v ?? 27n + BigInt(yParity)), r, s],
      });
      return mined(hash, "budget funding");
    },

    async seedGas(to) {
      return mined(await funder().sendTransaction({ to, value: GAS_SEED }), "gas seed");
    },

    async transferUsdc(fromKey, to, amount) {
      const wallet = createWalletClient({ account: privateKeyToAccount(fromKey), chain: baseSepolia, transport });
      const hash = await wallet.writeContract({ address: opts.usdcAddress, abi: erc20Abi, functionName: "transfer", args: [to, amount] });
      return mined(hash, "refund");
    },
  };
}
