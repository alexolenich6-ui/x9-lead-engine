import Anthropic from "@anthropic-ai/sdk";
import type { NormalizedLead } from "../normalize/types";
import { SALES_BRAIN_SYSTEM_PROMPT, buildLeadUserMessage } from "./prompt";
import { LEAD_ANALYSIS_TOOL } from "./schema";
import type { LeadAnalysis } from "./types";

export class SalesBrainError extends Error {}

const DEFAULT_MODEL = "claude-sonnet-5";

export async function analyzeLead(lead: NormalizedLead): Promise<LeadAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new SalesBrainError("Отсутствует ANTHROPIC_API_KEY на сервере.");
  }
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  const client = new Anthropic({ apiKey });

  let response: Anthropic.Message;
  try {
    response = await client.messages.create({
      model,
      max_tokens: 8000,
      system: SALES_BRAIN_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildLeadUserMessage(lead) }],
      tools: [LEAD_ANALYSIS_TOOL],
      tool_choice: { type: "tool", name: "submit_lead_analysis" },
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new SalesBrainError("Anthropic отклонил ключ API (проверьте ANTHROPIC_API_KEY).");
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new SalesBrainError("Anthropic временно ограничил запросы (rate limit). Попробуйте ещё раз через минуту.");
    }
    if (err instanceof Anthropic.APIError) {
      throw new SalesBrainError(`Ошибка Anthropic API: ${err.message}`);
    }
    throw new SalesBrainError("Не удалось связаться с Anthropic API.");
  }

  if (response.stop_reason === "refusal") {
    throw new SalesBrainError("AI отказался анализировать этот профиль.");
  }

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );

  if (!toolUse) {
    throw new SalesBrainError("AI не вернул структурированный анализ.");
  }

  return toolUse.input as LeadAnalysis;
}
