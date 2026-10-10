// Gasless budget approval (ADR-011, Q-14): the buyer signs an EIP-3009 transferWithAuthorization of
// exactly the cap to the problem wallet; the connector submits it and pays the gas.
import { randomBytes } from "node:crypto";
import { getAddress, isAddress, parseUnits, verifyTypedData } from "viem";
import type { Hex } from "./wallet.js";

export const AUTHORIZATION_TTL_S = 15 * 60;

export const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

export interface UsdcDomain {
  chainId: number;
  usdcAddress: Hex;
}

/** USDC's EIP-712 domain on Base Sepolia (name/version as the x402 402-response reports them). */
export const domainOf = ({ chainId, usdcAddress }: UsdcDomain) =>
  ({ name: "USDC", version: "2", chainId, verifyingContract: usdcAddress }) as const;

/** What the approval page asks MetaMask to sign; it fills `message.from` with the connected address. */
export function authorizationRequest(usdc: UsdcDomain, to: Hex, cap: string, now = new Date()) {
  const nowS = Math.floor(now.getTime() / 1000);
  return {
    domain: domainOf(usdc),
    types: TRANSFER_WITH_AUTHORIZATION_TYPES,
    primaryType: "TransferWithAuthorization" as const,
    message: {
      from: null,
      to,
      // uint256 values as decimal strings: JSON-safe and accepted by eth_signTypedData_v4.
      value: parseUnits(cap, 6).toString(),
      validAfter: "0",
      validBefore: String(nowS + AUTHORIZATION_TTL_S),
      nonce: ("0x" + randomBytes(32).toString("hex")) as Hex,
    },
  };
}

export interface SignedAuthorization {
  from: Hex;
  to: Hex;
  value: bigint;
  validAfter: bigint;
  validBefore: bigint;
  nonce: Hex;
  signature: Hex;
}

export class FundingError extends Error {}

/**
 * Rebuilds the message with OUR `to` and `value`, so a signature over any other recipient or
 * amount fails verification. Returns the authorisation ready to submit.
 */
export async function verifyFunding(
  usdc: UsdcDomain,
  problem: { walletAddress: Hex; cap: string },
  body: unknown,
  now = new Date(),
): Promise<SignedAuthorization> {
  const b = (body ?? {}) as Record<string, unknown>;
  const hex = (v: unknown, len?: number) =>
    typeof v === "string" && /^0x[0-9a-fA-F]+$/.test(v) && (len === undefined || v.length === 2 + len * 2);
  if (typeof b.from !== "string" || !isAddress(b.from)) throw new FundingError("from must be the buyer's address");
  if (!hex(b.signature)) throw new FundingError("signature must be hex");
  if (!hex(b.nonce, 32)) throw new FundingError("nonce must be 32 bytes of hex");
  if (!/^\d+$/.test(String(b.validAfter)) || !/^\d+$/.test(String(b.validBefore))) {
    throw new FundingError("validAfter and validBefore must be unix seconds");
  }

  const auth: SignedAuthorization = {
    from: getAddress(b.from),
    to: problem.walletAddress,
    value: parseUnits(problem.cap, 6),
    validAfter: BigInt(String(b.validAfter)),
    validBefore: BigInt(String(b.validBefore)),
    nonce: b.nonce as Hex,
    signature: b.signature as Hex,
  };

  const nowS = BigInt(Math.floor(now.getTime() / 1000));
  if (auth.validAfter > nowS) throw new FundingError("authorisation is not valid yet");
  // Leave a minute to get the transaction mined.
  if (auth.validBefore < nowS + 60n) throw new FundingError("authorisation has expired; reload and sign again");

  const { signature, ...message } = auth;
  const ok = await verifyTypedData({
    address: auth.from,
    domain: domainOf(usdc),
    types: TRANSFER_WITH_AUTHORIZATION_TYPES,
    primaryType: "TransferWithAuthorization",
    message,
    signature,
  });
  if (!ok) throw new FundingError("signature does not authorise exactly the cap to this problem wallet");
  return auth;
}
