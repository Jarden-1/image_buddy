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
      ? value.ownedOrShown.slice(0, 6).map((entry) => {
          const rawStatus = String(entry.status || "unknown").toLowerCase();
          const status =
            rawStatus === "owned" || rawStatus === "used"
              ? "owned"
              : rawStatus === "wanted"
                ? "wanted"
                : rawStatus === "admired"
                  ? "admired"
                  : "unknown";
          return {
            item: String(entry.item || "未命名物品"),
            status,
          };
        })
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

const GENERIC_INTEREST_TAGS = new Set([
  "共同体验",
  "情侣体验",
  "情侣纪念",
  "纪念日",
  "生活方式",
  "运动",
  "户外",
  "手作",
  "家居",
  "穿搭",
  "审美",
  "设计",
  "探店",
  "数码",
  "实用",
]);

function normalizeInterestConcept(value: string): string {
  return value
    .replace(/香水|香薰|调香|气味/g, "香氛")
    .replace(/马拉松|半马/g, "跑步")
    .replace(/拍照|影像/g, "摄影")
    .toLowerCase();
}

function sharedExperienceHasInterestEvidence(
  offer: Offer,
  analysis: VisualAnalysis,
): boolean {
  const corpus = normalizeInterestConcept(
    [
      analysis.sceneSummary,
      ...analysis.interests,
      ...analysis.aesthetics,
      ...analysis.searchQueries,
      ...analysis.evidence.flatMap((item) => [
        item.observation,
        item.implication,
      ]),
    ].join(" "),
  );

  return offer.interestTags.some((tag) => {
    if (GENERIC_INTEREST_TAGS.has(tag)) return false;
    const normalizedTag = normalizeInterestConcept(tag);
    return normalizedTag.length >= 2 && corpus.includes(normalizedTag);
  });
}

const COMPLEMENTARY_TITLE_MARKERS = [
  "收纳",
  "展示",
  "支架",
  "底座",
  "保护",
  "配件",
  "腕带",
  "背带",
  "相纸",
  "照片书",
  "相框",
  "小样",
  "探索",
];

function normalizeItemName(value: string): string {
  return value
    .replace(/蓝牙|无线|有线|机械|主力|专业|轻量|便携|迷你|智能/g, "")
    .replace(/耳麦/g, "耳机")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLowerCase();
}

function duplicatesOwnedItem(offer: Offer, analysis: VisualAnalysis): boolean {
  if (
    COMPLEMENTARY_TITLE_MARKERS.some((marker) =>
      offer.title.includes(marker),
    )
  ) {
    return false;
  }
  const normalizedTitle = normalizeItemName(offer.title);
  return analysis.ownedOrShown
    .filter((entry) => entry.status === "owned")
    .some((entry) => {
      const normalizedItem = normalizeItemName(entry.item);
      return (
        normalizedItem.length >= 2 &&
        (normalizedTitle.includes(normalizedItem) ||
          normalizedItem.includes(normalizedTitle))
      );
    });
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
              "保持极简：证据不超过3条，兴趣不超过4个，审美不超过3个，物品不超过6个，避坑不超过4条，每个字符串不超过24个汉字。",
              "ownedOrShown 优先完整盘点画面中可见的装备、配件和收纳物，以避免后续重复推荐；仅在确有依据时标为 owned。",
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
  const eligibleCandidates = input.candidates.filter(
    ({ offer }) => !duplicatesOwnedItem(offer, input.analysis),
  );
  const candidates = eligibleCandidates.map(({ offer, recallScore }) => ({
    offerId: offer.id,
    title: offer.title,
    kind: offer.kind,
    price: offer.price,
    cities: offer.cities,
    merchant: offer.merchant,
    sourceType: offer.sourceType,
    priceStatus: offer.priceStatus,
    priceNote: offer.priceNote,
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
          "从候选中选出最多 3 个结果，每种 strategy 最多出现一次；没有合适项就少选，禁止为了凑满 3 个而降低相关性。",
          "候选支持多种 strategy 时，选择最符合其实际价值、且能保留其他强候选策略覆盖的归类。",
          "ownedOrShown 中 status=owned 的同类物品视为已经拥有，禁止再次推荐；收纳、展示、耗材、配件或明确升级方案可以保留，但理由必须说明增量价值。",
          "共同体验必须直接承接一个已识别兴趣，或有视觉证据明确支持手作、户外、音乐、运动等对应活动；仅凭伴侣关系、城市或场合不得选择。",
          "每个结果的 evidence 必须引用视觉分析中真实出现的 observation 或 interest，不能只写城市、预算或场合。",
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
  const offerById = new Map(
    eligibleCandidates.map(({ offer }) => [offer.id, offer]),
  );
  const rawGiftCount = selection.gifts?.length || 0;
  const usedStrategies = new Set<string>();
  selection.gifts = (selection.gifts || [])
    .filter((gift) => allowedIds.has(gift.offerId))
    .filter((gift) => {
      const offer = offerById.get(gift.offerId);
      if (
        !offer ||
        duplicatesOwnedItem(offer, input.analysis) ||
        !offer.giftStrategies.includes(gift.strategy)
      ) {
        return false;
      }
      if (gift.strategy !== "shared_experience") return true;
      return sharedExperienceHasInterestEvidence(offer, input.analysis);
    })
    .filter((gift) => {
      if (usedStrategies.has(gift.strategy)) return false;
      usedStrategies.add(gift.strategy);
      return true;
    })
    .slice(0, 3);

  if (selection.gifts.length === 0) {
    throw new Error("SELECTION_OUTPUT_INVALID");
  }
  if (
    selection.gifts.length < rawGiftCount ||
    (selection.gifts.length < 3 && /三|3/.test(selection.summary || ""))
  ) {
    const interests = input.analysis.interests.slice(0, 2).join("、");
    selection.summary = `围绕${interests || "画面中的明确兴趣"}，保留了 ${selection.gifts.length} 个更贴合且风险更低的方案。`;
  }
  return selection;
}
