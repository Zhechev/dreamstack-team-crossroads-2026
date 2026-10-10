// Signing and verifying SignedOutcome messages with the agent key (EIP-191 personal_sign via viem).
import type { Citation, SignedOutcome } from "@citable/protocol";
import { verifyMessage } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export type UnsignedOutcome = Omit<SignedOutcome, "signature">;

/**
 * The exact bytes that get signed. Binds the answer to the agent, its version and the order (ADR-009),
 * with a fixed key order so signer and checker always agree.
 */
export function signingPayload(agentId: string, o: UnsignedOutcome): string {
  return JSON.stringify({
    domain: "citable.signed-outcome.v1",
    agent_id: agentId,
    agent_version: o.agent_version,
    order_id: o.order_id,
    created_at: o.created_at,
    text: o.text,
    citations: o.citations.map((c: Citation) => ({ unit_id: c.unit_id, quote: c.quote, as_of: c.as_of })),
  });
}

export interface OutcomeSigner {
  address: `0x${string}`;
  sign(agentId: string, outcome: UnsignedOutcome): Promise<SignedOutcome>;
}

export function keySigner(privateKey: `0x${string}`): OutcomeSigner {
  const account = privateKeyToAccount(privateKey);
  return {
    address: account.address,
    async sign(agentId, outcome) {
      const signature = await account.signMessage({ message: signingPayload(agentId, outcome) });
      return { ...outcome, signature };
    },
  };
}

export async function verifyOutcomeSignature(
  agentId: string,
  signingAddress: `0x${string}`,
  outcome: SignedOutcome,
): Promise<boolean> {
  try {
    return await verifyMessage({
      address: signingAddress,
      message: signingPayload(agentId, outcome),
      signature: outcome.signature as `0x${string}`,
    });
  } catch {
    return false;
  }
}
