// Embedding provider, chosen by EMBEDDING_PROVIDER (default: openai when OPENAI_API_KEY is set).
export type Embedder = (texts: string[]) => Promise<number[][]>;

export const EMBEDDING_DIMENSIONS = 1536;

export function createEmbedder(env: NodeJS.ProcessEnv = process.env): Embedder | null {
  const provider = env.EMBEDDING_PROVIDER ?? (env.OPENAI_API_KEY ? "openai" : "none");
  if (provider === "none") return null;
  if (provider !== "openai") throw new Error(`Unknown EMBEDDING_PROVIDER: ${provider}`);
  if (!env.OPENAI_API_KEY) throw new Error("EMBEDDING_PROVIDER=openai needs OPENAI_API_KEY");
  return openaiEmbedder(env.OPENAI_API_KEY);
}

function openaiEmbedder(apiKey: string): Embedder {
  return async (texts) => {
    if (texts.length === 0) return [];
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-small", input: texts }),
    });
    if (!res.ok) throw new Error(`OpenAI embeddings failed: ${res.status} ${await res.text()}`);
    const body = (await res.json()) as { data: { index: number; embedding: number[] }[] };
    return body.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
  };
}
