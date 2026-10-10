// Settings from the root .env. Add keys here as tickets need them, never read process.env elsewhere.
export type Config = {
  port: number;
  /** Supabase project; the service role reads agent config and private units. */
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: Number(env.PORT ?? 4010),
    supabaseUrl: env.SUPABASE_URL || undefined,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || undefined,
  };
}
