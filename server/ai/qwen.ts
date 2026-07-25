import {
  CANDIDATE_SELECTION_GUIDE,
  VISUAL_ANALYSIS_GUIDE,
  VISUAL_GIFT_SKILL_CORE,
} from "./skill-context";
import type {
  Offer,
  SelectionResult,
  VisualAnalysis,
} from "./types";

interface QwenConfig {
  apiKey: string;
  baseUrl: string;
  visionModel: string;
  textModel: string;
  embeddingModel: string;
}

function getConfig(): QwenConfig {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  const baseUrl = process.env.BAILIAN_BASE_URL;
  if (!apiKey || !baseUrl) {
    throw new Error("AI_CONFIG_MISSING");
  }

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/$/, ""),
    visionModel: process.env.QWEN_VISION_MODEL || "qwen3-vl-flash",
    textModel: process.env.QWEN_TEXT_MODEL || "qwen3.5-flash",
    embeddingModel:
      process.env.QWEN_EMBEDDING_MODEL || "text-embedding-v4",
  };
}

async function postJson<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const config = getConfig();
  const response = await fetch(`${config.baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const result = (await response.json()) as T & {
    error?: { message?: string; code?: string };
  };
  if (!response.ok) {
    throw new Error(
      result.error?.message || result.error?.code || `AI_HTTP_${response.status}`,
    );
  }
  return result;
}

function parseModelJson<T>(raw: string): T {
  const normalized = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(normalized) as T;
}

function normalizeVisualAnalysis(value: VisualAnalysis): VisualAnalysis {
  if (
    !value ||
    !Array.isArray(value.searchQueries) ||
    value.searchQueries.length === 0
  ) {
    throw new Error("VISION_OUTPUT_INVALID");
  }

  return {
    sceneSummary: value.sceneSummary || "已分析图片中的兴趣线索",
    evidence: Array.isArray(value.evidence) ? value.evidence.slice(0, 3) : [],
    interests: Array.isArray(value.interests) ? value.interests.slice(0, 4) : [],
    aesthetics: Array.isArray(value.aesthetics)
      ? value.aesthetics.slice(0, 3)
      : [],
    ownedOrShown: Array.isArray(value.ownedOrShown)
      ? value.ownedOrShown.slice(0, 4)
      : [],
    searchQueries: value.searchQueries
      .filter(Boolean)
      .slice(0, 3)
      .map(String),
    avoidances: Array.isArray(value.avoidances)
      ? value.avoidances.slice(0, 4)
      : [],
    clarification: value.clarification || null,
  };
}

export async function analyzeGiftImage(input: {
  imageDataUrl: string;
  occasion: string;
  budgetMin: number;
  budgetMax: number;
  city: string;
  clueContext?: string;
}): Promise<VisualAnalysis> {
  const config = getConfig();
  const schemaExample: VisualAnalysis = {
    sceneSummary: "一句话概括场景",
    evidence: [
      {
        observation: "客观看到的物品、风格或行为线索",
        implication: "该证据可能意味着什么",
      },
    ],
    interests: ["兴趣方向"],
    aesthetics: ["审美关键词"],
    ownedOrShown: [{ item: "物品", status: "unknown" }],
    searchQueries: [
      "适合该兴趣、预算和场合的具体礼物检索句",
      "相邻兴趣礼物检索句",
      "情侣一起体验的礼物检索句",
    ],
    avoidances: ["需要规避的方向"],
    clarification: null,
  };

  const result = await postJson<{
    choices: Array<{ message: { content: string } }>;
  }>("/chat/completions", {
    model: config.visionModel,
    messages: [
      {
        role: "system",
        content: `${VISUAL_GIFT_SKILL_CORE}\n${VISUAL_ANALYSIS_GUIDE}`,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: input.imageDataUrl },
          },
          {
            type: "text",
            text: [
              `关系：伴侣`,
              `场合：${input.occasion}`,
              `预算：${input.budgetMin}-${input.budgetMax} 元`,
              `城市：${input.city}`,
              input.clueContext
                ? `用户补充：${input.clueContext}`
                : "用户没有补充说明",
              "保持极简：证据不超过3条，兴趣不超过4个，审美不超过3个，物品不超过4个，避坑不超过4条，每个字符串不超过24个汉字。",
              "请只输出一个 JSON 对象，不要输出 Markdown。",
              `字段结构示例：${JSON.stringify(schemaExample)}`,
            ].join("\n"),
          },
        ],
      },
    ],
    enable_thinking: false,
    temperature: 0.15,
    max_tokens: 450,
    response_format: { type: "json_object" },
  });

  return normalizeVisualAnalysis(
    parseModelJson<VisualAnalysis>(result.choices[0].message.content),
  );
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const config = getConfig();
  const result = await postJson<{
    data: Array<{ index: number; embedding: number[] }>;
  }>("/embeddings", {
    model: config.embeddingModel,
    input: texts,
    dimensions: 1024,
    encoding_format: "float",
  });

  return result.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

export async function selectGiftCandidates(input: {
  analysis: VisualAnalysis;
  candidates: Array<{ offer: Offer; recallScore: number }>;
  occasion: string;
  budgetMin: number;
  budgetMax: number;
  city: string;
}): Promise<SelectionResult> {
  const config = getConfig();
  const candidates = input.candidates.map(({ offer, recallScore }) => ({
    offerId: offer.id,
    title: offer.title,
    kind: offer.kind,
    price: offer.price,
    cities: offer.cities,
    interestTags: offer.interestTags,
    giftStrategies: offer.giftStrategies,
    description: offer.searchText,
    riskNotes: offer.riskNotes,
    recallScore: Number(recallScore.toFixed(4)),
  }));

  const result = await postJson<{
    choices: Array<{ message: { content: string } }>;
  }>("/chat/completions", {
    model: config.textModel,
    messages: [
      {
        role: "system",
        content: `${VISUAL_GIFT_SKILL_CORE}\n${CANDIDATE_SELECTION_GUIDE}`,
      },
      {
        role: "user",
        content: [
          `关系：伴侣；场合：${input.occasion}；预算：${input.budgetMin}-${input.budgetMax} 元；城市：${input.city}`,
          `视觉分析：${JSON.stringify(input.analysis)}`,
          `候选商品：${JSON.stringify(candidates)}`,
          "从候选中选出最多 3 个不同策略的结果。",
          "只输出 JSON：",
          '{"summary":"一句话概括","gifts":[{"offerId":"候选ID","strategy":"interest_direct|interest_adjacent|shared_experience","reason":"不超过60字","evidence":["证据"],"caveat":null,"videoQueries":["短语"]}]}',
        ].join("\n"),
      },
    ],
    enable_thinking: false,
    temperature: 0.2,
    max_tokens: 520,
    response_format: { type: "json_object" },
  });

  const selection = parseModelJson<SelectionResult>(
    result.choices[0].message.content,
  );
  const allowedIds = new Set(candidates.map((candidate) => candidate.offerId));
  selection.gifts = (selection.gifts || [])
    .filter((gift) => allowedIds.has(gift.offerId))
    .slice(0, 3);

  if (selection.gifts.length === 0) {
    throw new Error("SELECTION_OUTPUT_INVALID");
  }
  return selection;
}
