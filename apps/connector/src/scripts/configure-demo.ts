// Points the demo agents at this service's keys: signing_address = address of AGENT_SIGNING_KEY (all demo
// agents, so ticket 09 can verify their outcomes), and, if AGENT_PAYOUT_ADDRESS is set, the Lozenets agent's
// payout wallet. Re-run after every `supabase db reset`.
// Usage: pnpm --filter @citable/connector configure:demo
import { createClient } from "@supabase/supabase-js";
import { privateKeyToAccount } from "viem/accounts";
import { loadConfig } from "../config.js";

const config = loadConfig();
if (!config.supabaseUrl || !config.supabaseServiceRoleKey) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
if (!config.agentSigningKey) throw new Error("Set AGENT_SIGNING_KEY (any testnet private key)");

const db = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, { auth: { persistSession: false } });
const signingAddress = privateKeyToAccount(config.agentSigningKey).address;

const { data: experts, error: expertsError } = await db.from("experts").select("id").eq("is_demo", true);
if (expertsError) throw expertsError;
const { data: signed, error } = await db
  .from("agents")
  .update({ signing_address: signingAddress })
  .in("expert_id", experts.map((e) => e.id))
  .select("slug");
if (error) throw error;
console.log(`signing_address ${signingAddress} → ${signed.map((a) => a.slug).join(", ")}`);

if (config.agentPayoutAddress) {
  const { error: payoutError } = await db
    .from("agents")
    .update({ payout_address: config.agentPayoutAddress })
    .eq("slug", "lozenets-price-check");
  if (payoutError) throw payoutError;
  console.log(`payout_address ${config.agentPayoutAddress} → lozenets-price-check`);
} else {
  console.log("AGENT_PAYOUT_ADDRESS not set: the Lozenets agent keeps its placeholder payout address.");
}
