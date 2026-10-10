// Settings from the root .env. Add keys here as tickets need them, never read process.env elsewhere.
export type Config = {
  port: number;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: Number(env.PORT ?? 4010),
  };
}
