import type Anthropic from "@anthropic-ai/sdk";

// JSON schema for the forced tool call that Anthropic must use to return the
// lead analysis. `strict: true` + `additionalProperties: false` + full
// `required` arrays guarantee the response matches LeadAnalysis exactly.

const icpScoreItem = {
  type: "object",
  properties: {
    key: { type: "string" },
    label: { type: "string" },
    score: { type: "integer", minimum: 0, maximum: 100 },
    explanation: { type: "string" },
  },
  required: ["key", "label", "score", "explanation"],
  additionalProperties: false,
};

export const LEAD_ANALYSIS_TOOL: Anthropic.Tool = {
  name: "submit_lead_analysis",
  description:
    "Отправить структурированный sales-анализ Instagram-лида по методологии XNINE.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      leadSummary: {
        type: "string",
        description:
          "Кто это, чем занимается, как выглядит бизнес, какие маркетинговые активы уже есть.",
      },
      icp: {
        type: "object",
        properties: {
          scores: {
            type: "array",
            description:
              "Оценка по параметрам: качество продукта/портфолио, коммерческая зрелость, способность покупать маркетинг, текущие маркетинговые усилия, активность Instagram, потенциал органического контента, наличие проблемы которую решает XNINE, привлекательность sales opportunity.",
            items: icpScoreItem,
            minItems: 8,
            maxItems: 8,
          },
          totalScore: { type: "integer", minimum: 0, maximum: 100 },
          verdict: {
            type: "string",
            enum: ["HIGH_PRIORITY", "MEDIUM", "LOW", "NOT_ICP"],
          },
        },
        required: ["scores", "totalScore", "verdict"],
        additionalProperties: false,
      },
      recommendedOffer: {
        type: "object",
        properties: {
          offer: { type: "string", enum: ["LAUNCH", "GROWTH", "NONE"] },
          reasoning: { type: "string" },
        },
        required: ["offer", "reasoning"],
        additionalProperties: false,
      },
      existingStrengths: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 6,
      },
      marketingGaps: {
        type: "array",
        description: "3-7 реальных, подтверждённых данными разрывов, не шаблонных советов.",
        items: { type: "string" },
        minItems: 3,
        maxItems: 7,
      },
      contentAnalysis: {
        type: "object",
        properties: {
          strongTopics: { type: "array", items: { type: "string" } },
          weakTopics: { type: "array", items: { type: "string" } },
          varianceDescription: {
            type: "string",
            description: "Насколько сильный разброс просмотров между Reels, качественное описание.",
          },
          organicReachConfirmed: { type: "boolean" },
          relevanceToCoreServiceHypothesis: {
            type: "string",
            description:
              "Гипотеза (не утверждение) о том, насколько темы с лучшими просмотрами относятся к основной услуге бизнеса.",
          },
        },
        required: [
          "strongTopics",
          "weakTopics",
          "varianceDescription",
          "organicReachConfirmed",
          "relevanceToCoreServiceHypothesis",
        ],
        additionalProperties: false,
      },
      primarySalesAngle: {
        type: "string",
        description: "Один лучший персональный угол первого контакта, максимально специфичный.",
      },
      whatNotToSay: {
        type: "array",
        items: { type: "string" },
        minItems: 2,
        maxItems: 5,
      },
      bestContactMethod: {
        type: "object",
        properties: {
          method: {
            type: "string",
            enum: ["CALL", "INSTAGRAM_DM", "TELEGRAM", "EMAIL", "UNKNOWN"],
          },
          reasoning: { type: "string" },
        },
        required: ["method", "reasoning"],
        additionalProperties: false,
      },
      firstOutreach: {
        type: "object",
        properties: {
          coldCallOpener: { type: "string" },
          instagramDm: { type: "string" },
          telegramMessage: {
            type: ["string", "null"],
            description: "null если Telegram не релевантен для этого лида.",
          },
        },
        required: ["coldCallOpener", "instagramDm", "telegramMessage"],
        additionalProperties: false,
      },
      auditRouting: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["SHORT_AUDIT", "DEEP_AUDIT"] },
          reasoning: { type: "string" },
          structure: {
            type: "array",
            description: "Структура будущего аудита, пункты списком.",
            items: { type: "string" },
            minItems: 3,
            maxItems: 8,
          },
        },
        required: ["type", "reasoning", "structure"],
        additionalProperties: false,
      },
      diagnosticQuestions: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 5,
      },
      nextBestAction: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: [
              "CALL",
              "SEND_DM",
              "SEND_AUDIT",
              "ASK_QUESTION",
              "BOOK_CALL",
              "FOLLOW_UP",
              "DO_NOT_CONTACT",
            ],
          },
          reasoning: { type: "string" },
        },
        required: ["action", "reasoning"],
        additionalProperties: false,
      },
    },
    required: [
      "leadSummary",
      "icp",
      "recommendedOffer",
      "existingStrengths",
      "marketingGaps",
      "contentAnalysis",
      "primarySalesAngle",
      "whatNotToSay",
      "bestContactMethod",
      "firstOutreach",
      "auditRouting",
      "diagnosticQuestions",
      "nextBestAction",
    ],
    additionalProperties: false,
  },
};
