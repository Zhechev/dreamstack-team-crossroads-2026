// Protocol messages shared by the connector, Stall and Supabase.
// Field for field with docs/02 Architecture/Data Model.md — change both together.
import { z } from "zod";

// --- Primitives ---

/** USDC amount as a decimal string with up to 6 places, e.g. "0.50". Strings avoid float rounding. */
export const Usdc = z.string().regex(/^\d+(\.\d{1,6})?$/, "USDC amount like \"0.50\"");
export const Address = z.string().regex(/^0x[0-9a-fA-F]{40}$/, "EVM address");
export const TxHash = z.string().regex(/^0x[0-9a-fA-F]{64}$/, "transaction hash");
/** sha256 of the terms text, 0x-prefixed hex. */
export const Hash32 = z.string().regex(/^0x[0-9a-fA-F]{64}$/, "32-byte hex hash");
export const Signature = z.string().regex(/^0x[0-9a-fA-F]+$/, "hex signature");
export const Timestamp = z.iso.datetime({ offset: true });
/** As-of date of a source: the day the figure or passage was true. */
export const AsOf = z.iso.date();
export const Tier = z.union([z.literal(1), z.literal(2), z.literal(3)]);

// --- Messages ---

/** Free answer to "can you help with this?" before any payment. */
export const Evaluation = z.object({
  agent_id: z.string().min(1),
  can_answer: z.boolean(),
  deliverable: z.string().min(1),
  price: Usdc,
  expires_at: Timestamp,
});

export const Capability = z.object({
  id: z.string().min(1),
  tier: Tier,
  name: z.string().min(1),
  tags: z.array(z.string()),
  price: Usdc,
});

/** What an expert agent offers; `key` is the address its outcomes are signed with. */
export const Manifest = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  key: Address,
  capabilities: z.array(Capability).min(1),
  terms_hash: Hash32,
});

/** One claim's evidence: the unit it came from, the exact quote or value, and how fresh it is. */
export const Citation = z.object({
  unit_id: z.string().min(1),
  quote: z.string().min(1),
  as_of: AsOf,
});

/** A paid answer. `text` may hold identity placeholders like {{full_name}} (ADR-012). */
export const SignedOutcome = z.object({
  order_id: z.string().min(1),
  text: z.string().min(1),
  citations: z.array(Citation).min(1),
  agent_version: z.string().min(1),
  created_at: Timestamp,
  signature: Signature,
});

/** Tier 2 human review (not built in the MVP). */
export const Review = z.object({
  order_id: z.string().min(1),
  status: z.enum(["review_pending", "approved", "edited"]),
  reviewer: z.string().min(1),
  final_text: z.string().min(1),
  reviewed_at: Timestamp,
});

export const Receipt = z.object({
  order_id: z.string().min(1),
  tx_hash: TxHash,
  amount: Usdc,
  fee: Usdc,
  terms_hash: Hash32,
});

export type Evaluation = z.infer<typeof Evaluation>;
export type Capability = z.infer<typeof Capability>;
export type Manifest = z.infer<typeof Manifest>;
export type Citation = z.infer<typeof Citation>;
export type SignedOutcome = z.infer<typeof SignedOutcome>;
export type Review = z.infer<typeof Review>;
export type Receipt = z.infer<typeof Receipt>;
