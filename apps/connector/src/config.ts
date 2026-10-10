// Settings from the root .env. Add keys here as tickets need them, never read process.env elsewhere.
type Hex = `0x${string}`;

export type Config = {
  port: number;
  /** Supabase project; the service role reads agent config and private units. */
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  /** Base Sepolia (ticket 11). */
  rpcUrl: string;
  chainId: number;
  usdcAddress: Hex;
  /** Pays gas for gasless budget funding and seeds problem wallets. */
  gasFunderKey?: Hex;
  /** 32-byte hex key that encrypts problem-wallet keys at rest. */
  problemWalletSecret?: string;
  /** Lovable app: approval links point here. */
  webAppUrl: string;
  /** Extra CORS origins beyond Lovable domains and localhost. */
  allowedOrigins: string[];
  /** Claude writes price checks; without a key a deterministic answer is built from the retrieved deals. */
  anthropicApiKey?: string;
  /** Embeddings for unit search; without one, search is full-text + trigram. */
  openaiApiKey?: string;
  embeddingProvider?: string;
  /** Signs every SignedOutcome (testnet key). Its address is the agents' signing_address. */
  agentSigningKey?: Hex;
  /** Demo expert payout wallet; `pnpm --filter @citable/connector configure:demo` writes it to the agents. */
  agentPayoutAddress?: Hex;
  /** x402 facilitator that verifies and settles agent payments. */
  facilitatorUrl: string;
};

// Treats blank and whitespace-only values (e.g. `KEY=   # comment`) as unset.
const opt = (v: string | undefined) => (v && v.trim() !== "" ? v.trim() : undefined);

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: Number(env.PORT ?? 4010),
    supabaseUrl: env.SUPABASE_URL || undefined,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || undefined,
    rpcUrl: env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    chainId: 84532,
    usdcAddress: (env.USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e") as Hex,
    gasFunderKey: (env.GAS_FUNDER_PRIVATE_KEY || undefined) as Hex | undefined,
    problemWalletSecret: env.PROBLEM_WALLET_SECRET || undefined,
    webAppUrl: env.WEB_APP_URL || "http://localhost:5173",
    allowedOrigins: (env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    anthropicApiKey: opt(env.ANTHROPIC_API_KEY),
    openaiApiKey: opt(env.OPENAI_API_KEY),
    embeddingProvider: opt(env.EMBEDDING_PROVIDER),
    agentSigningKey: opt(env.AGENT_SIGNING_KEY) as Hex | undefined,
    agentPayoutAddress: opt(env.AGENT_PAYOUT_ADDRESS) as Hex | undefined,
    facilitatorUrl: opt(env.FACILITATOR_URL) ?? "https://x402.org/facilitator",
  };
}
