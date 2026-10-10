// POST {question, budget?} → top 3 authorised agents within budget, best match then rating (ADR-004).
import { db, HttpError, readJson, serve } from "../_shared/http.ts";

serve(["POST"], async (req) => {
  const { question, budget } = await readJson(req);
  if (typeof question !== "string" || question.trim() === "") throw new HttpError(400, "question is required");
  if (budget !== undefined && !(typeof budget === "number" && budget >= 0) && !/^\d+(\.\d{1,6})?$/.test(String(budget))) {
    throw new HttpError(400, 'budget must be a USDC amount like "2.00"');
  }

  const { data, error } = await db.rpc("search_agents", {
    p_question: question,
    p_budget: budget === undefined ? null : Number(budget),
  });
  if (error) throw error;
  return { agents: data };
});
