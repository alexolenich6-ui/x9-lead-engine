import Anthropic from "@anthropic-ai/sdk";
import type { NormalizedLead } from "../normalize/types";
import { SALES_BRAIN_SYSTEM_PROMPT, buildLeadUserMessage } from "./prompt";
import { LEAD_ANALYSIS_JSON_SCHEMA, LEAD_ANALYSIS_TOOL } from "./schema";
import type { LeadAnalysis } from "./types";

export class SalesBrainError extends Error {}

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5";
const DEFAULT_OPENROUTER_MODEL = "minimax/minimax-m3:free";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function analyzeLead(lead: NormalizedLead): Promise<LeadAnalysis> {
  const provider = (process.env.AI_PROVIDER || "anthropic").toLowerCase();

  if (provider === "openrouter") {
    return analyzeWithOpenRouter(lead);
  }
  if (provider === "anthropic") {
    return analyzeWithAnthropic(lead);
  }
  throw new SalesBrainError(
    `Неизвестный AI_PROVIDER: "${provider}". Допустимые значения: anthropic, openrouter.`,
  );
}

async function analyzeWithAnthropic(lead: NormalizedLead): Promise<LeadAnalysis> {
  const apiKey = process.env.X9_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new SalesBrainError("Отсутствует X9_ANTHROPIC_API_KEY на сервере.");
  }
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL;

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
      throw new SalesBrainError("Anthropic отклонил ключ API (проверьте X9_ANTHROPIC_API_KEY).");
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

interface OpenRouterMessage {
  role: string;
  content?: string | null;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
}

interface OpenRouterResponse {
  choices?: { message?: OpenRouterMessage }[];
  error?: { message?: string };
}

const OPENROUTER_TOOL = {
  type: "function",
  function: {
    name: "submit_lead_analysis",
    description: "Отправить структурированный sales-анализ Instagram-лида по методологии XNINE.",
    parameters: LEAD_ANALYSIS_JSON_SCHEMA,
    strict: true,
  },
};

const LEAD_ANALYSIS_TOP_LEVEL_KEYS = LEAD_ANALYSIS_JSON_SCHEMA.required;

// Top-level required-key check only — enough to catch the failure mode seen
// in practice (a free model nesting fields under the wrong parent), without
// reimplementing a full JSON Schema validator.
function findMissingTopLevelKeys(value: unknown): string[] {
  if (typeof value !== "object" || value === null) return [...LEAD_ANALYSIS_TOP_LEVEL_KEYS];
  const obj = value as Record<string, unknown>;
  return LEAD_ANALYSIS_TOP_LEVEL_KEYS.filter((key) => !(key in obj));
}

async function callOpenRouter(apiKey: string, model: string, messages: OpenRouterMessage[]) {
  let response: Response;
  try {
    response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://x9-lead-engine.internal",
        "X-Title": "X9 Lead Engine",
      },
      body: JSON.stringify({
        model,
        messages,
        tools: [OPENROUTER_TOOL],
        tool_choice: { type: "function", function: { name: "submit_lead_analysis" } },
      }),
    });
  } catch {
    throw new SalesBrainError("Не удалось связаться с OpenRouter API.");
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new SalesBrainError("OpenRouter отклонил ключ API (проверьте X9_OPENROUTER_API_KEY).");
    }
    if (response.status === 429) {
      throw new SalesBrainError("OpenRouter временно ограничил запросы (rate limit). Попробуйте ещё раз через минуту.");
    }
    const text = await response.text().catch(() => "");
    throw new SalesBrainError(`Ошибка OpenRouter API: ${response.status}${text ? ` ${text.slice(0, 300)}` : ""}`);
  }

  const data = (await response.json()) as OpenRouterResponse;
  if (data.error) {
    throw new SalesBrainError(`Ошибка OpenRouter API: ${data.error.message ?? "неизвестная ошибка"}`);
  }

  const message = data.choices?.[0]?.message;
  const toolCall = message?.tool_calls?.[0];
  if (!message || !toolCall?.function?.arguments) {
    throw new SalesBrainError("AI не вернул структурированный анализ.");
  }

  return { message, toolCall };
}

// Free-tier OpenRouter models routinely ignore `response_format`/structured
// outputs even when advertised as supported (the request gets routed to
// whichever backend is free, and not every backend honors it) — a forced
// tool call is the reliable way to get schema-shaped JSON back, same as the
// Anthropic path above. Even so, free models occasionally misplace fields
// (e.g. nesting `nextBestAction` under `auditRouting`) despite `strict`, so
// we validate the top-level shape and give the model one chance to
// self-correct before failing.
async function analyzeWithOpenRouter(lead: NormalizedLead): Promise<LeadAnalysis> {
  const apiKey = process.env.X9_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new SalesBrainError("Отсутствует X9_OPENROUTER_API_KEY на сервере.");
  }
  const model = process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;

  const messages: OpenRouterMessage[] = [
    { role: "system", content: SALES_BRAIN_SYSTEM_PROMPT },
    { role: "user", content: buildLeadUserMessage(lead) },
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    const { message, toolCall } = await callOpenRouter(apiKey, model, messages);

    let parsed: unknown;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new SalesBrainError("AI вернул некорректный JSON.");
    }

    const missing = findMissingTopLevelKeys(parsed);
    if (missing.length === 0) {
      return parsed as LeadAnalysis;
    }

    if (attempt === 0) {
      messages.push(
        { role: message.role, content: message.content ?? null, tool_calls: message.tool_calls },
        {
          role: "tool",
          tool_call_id: toolCall.id,
          content: `Ошибка формата: в верхнем уровне объекта отсутствуют обязательные поля: ${missing.join(", ")}. Верни submit_lead_analysis ещё раз — все поля должны быть на верхнем уровне объекта, без вложенности одного поля внутрь другого.`,
        },
      );
      continue;
    }

    throw new SalesBrainError(
      `AI вернул структуру, не соответствующую схеме (отсутствуют поля: ${missing.join(", ")}).`,
    );
  }

  throw new SalesBrainError("AI не вернул структурированный анализ.");
}
