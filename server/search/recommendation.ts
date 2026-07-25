import offersData from "@/data/offers.json";
import offerEmbeddingsData from "@/data/offer-embeddings.json";
import videosData from "@/data/videos.json";
import type {
  Offer,
  OfferEmbedding,
  SelectedGift,
  VideoItem,
  VisualAnalysis,
} from "@/server/ai/types";

const offers = offersData as Offer[];
const offerEmbeddings = offerEmbeddingsData as OfferEmbedding[];
const videos = videosData as VideoItem[];
const genericVideoTags = new Set([
  "重庆",
  "情侣体验",
  "共同体验",
  "情侣纪念",
  "运动",
  "户外",
  "手作",
  "家居",
  "穿搭",
  "探店",
  "数码",
  "实用礼物",
  "礼物",
  "效率",
  "收藏",
  "纪念",
]);

function normalizeInterestConcept(value: string): string {
  return value
    .replace(/香水|香薰|调香|气味/g, "香氛")
    .replace(/马拉松|半马|路跑/g, "跑步")
    .replace(/拍照|影像/g, "摄影")
    .replace(/电竞|电子游戏|主机游戏/g, "游戏")
    .replace(/桌面布置|电脑桌面/g, "桌搭")
    .replace(/看书|读书|书籍/g, "阅读")
    .replace(/画画|插画|速写|水彩画/g, "绘画")
    .replace(/猫咪|小猫|养猫|狗狗|小狗|养狗/g, "宠物")
    .replace(/甜品|蛋糕|面包/g, "烘焙")
    .replace(/绿植|多肉|园艺/g, "植物")
    .replace(/公路车|山地车|单车/g, "骑行")
    .replace(/撸铁|力量训练|健身房/g, "健身")
    .replace(/二次元|动画|漫画/g, "动漫")
    .replace(/手帐/g, "手账")
    .replace(/高达|拼装模型/g, "模型")
    .replace(/vlog|拍视频|视频创作/gi, "短视频")
    .toLowerCase();
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function isEligible(
  offer: Offer,
  input: { budgetMin: number; budgetMax: number; city: string },
): boolean {
  const budgetFloor = Math.max(0, input.budgetMin);
  return (
    offer.price >= budgetFloor &&
    offer.price <= input.budgetMax &&
    (offer.cities.includes("全国") || offer.cities.includes(input.city))
  );
}

export function recallOffers(input: {
  queryEmbeddings: number[][];
  queryTexts?: string[];
  budgetMin: number;
  budgetMax: number;
  city: string;
  limit?: number;
}): Array<{ offer: Offer; recallScore: number }> {
  const embeddingMap = new Map(
    offerEmbeddings.map((item) => [item.id, item.embedding]),
  );
  const queryCorpus = normalizeInterestConcept(
    (input.queryTexts || []).join(" "),
  );

  const scored = offers
    .filter((offer) => isEligible(offer, input))
    .map((offer) => {
      const embedding = embeddingMap.get(offer.id) || [];
      const denseScore = Math.max(
        0,
        ...input.queryEmbeddings.map((queryEmbedding) =>
          cosineSimilarity(queryEmbedding, embedding),
        ),
      );
      const specificTagHits = offer.interestTags.filter((tag) => {
        if (genericVideoTags.has(tag)) return false;
        const normalizedTag = normalizeInterestConcept(tag);
        return normalizedTag.length >= 2 && queryCorpus.includes(normalizedTag);
      }).length;
      // Dense recall handles paraphrases; the bounded tag boost keeps explicit
      // visual interests from being displaced by broadly gift-like candidates.
      const recallScore =
        denseScore + Math.min(0.28, specificTagHits * 0.1);
      return { offer, recallScore };
    })
    .sort((a, b) => b.recallScore - a.recallScore);

  const limit = input.limit || 12;
  const remaining = [...scored];
  const selected: Array<{ offer: Offer; recallScore: number }> = [];
  const bucketCounts = new Map<string, number>();

  while (selected.length < limit && remaining.length > 0) {
    let bestIndex = 0;
    let bestAdjustedScore = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < remaining.length; index += 1) {
      const candidate = remaining[index];
      const primaryTag =
        candidate.offer.interestTags.find(
          (tag) => !genericVideoTags.has(tag),
        ) || "其他";
      const bucket = `${candidate.offer.kind}:${normalizeInterestConcept(primaryTag)}`;
      const duplicateCount = bucketCounts.get(bucket) || 0;
      // Keep the strongest candidate untouched, then apply a small diversity
      // penalty so one merchant/category cluster cannot occupy all 12 slots.
      const adjustedScore =
        candidate.recallScore - Math.min(0.18, duplicateCount * 0.045);
      if (adjustedScore > bestAdjustedScore) {
        bestAdjustedScore = adjustedScore;
        bestIndex = index;
      }
    }

    const [picked] = remaining.splice(bestIndex, 1);
    selected.push(picked);
    const primaryTag =
      picked.offer.interestTags.find(
        (tag) => !genericVideoTags.has(tag),
      ) || "其他";
    const bucket = `${picked.offer.kind}:${normalizeInterestConcept(primaryTag)}`;
    bucketCounts.set(bucket, (bucketCounts.get(bucket) || 0) + 1);
  }

  return selected;
}

function normalizedConcepts(values: string[]): string[] {
  return [
    ...new Set(
      values
        .map((value) => normalizeInterestConcept(value.trim()))
        .filter((value) => value.length >= 2),
    ),
  ];
}

export function matchVideos(input: {
  selectedGift: SelectedGift;
  offer: Offer;
  analysis: VisualAnalysis;
  limit?: number;
}): VideoItem[] {
  const directIds = new Set(input.offer.relatedVideoIds);
  const directVideos = videos
    .filter((video) => directIds.has(video.id))
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .slice(0, input.limit || 2);
  // relatedVideoIds remain the strongest evidence. If fewer than the requested
  // amount exist, a high-overlap item of another content role may supplement it.

  const queryConcepts = normalizedConcepts([
    ...input.selectedGift.videoQueries,
    ...input.offer.interestTags,
    ...input.analysis.interests,
    ...input.analysis.searchQueries,
  ]);

  const ranked = videos
    .filter((video) => !directIds.has(video.id))
    .map((video) => {
      const matchingTags = video.tags.filter((tag) => {
        const normalizedTag = normalizeInterestConcept(tag);
        return queryConcepts.some(
          (concept) =>
            normalizedTag.includes(concept) || concept.includes(normalizedTag),
        );
      });
      const specificTagHits = matchingTags.filter(
        (tag) => !genericVideoTags.has(tag),
      ).length;
      const roleBonus =
        video.contentRole === "product_proof"
          ? 0.16
          : video.contentRole === "gift_advice"
            ? 0.1
            : 0.04;
      return {
        video,
        isRelevant: specificTagHits >= 1 && matchingTags.length >= 1,
        score:
          specificTagHits * 0.62 +
          matchingTags.length * 0.16 +
          video.qualityScore * 0.18 +
          roleBonus,
      };
    })
    .filter((item) => item.isRelevant)
    .sort((a, b) => b.score - a.score);

  if (directVideos.length > 0) {
    const needed = Math.max(0, (input.limit || 2) - directVideos.length);
    if (needed === 0) return directVideos;
    const directRoles = new Set(
      directVideos.map((video) => video.contentRole),
    );
    const supplements = ranked
      .sort((a, b) => {
        const aRoleBonus = directRoles.has(a.video.contentRole) ? 0 : 0.12;
        const bRoleBonus = directRoles.has(b.video.contentRole) ? 0 : 0.12;
        return b.score + bRoleBonus - (a.score + aRoleBonus);
      })
      .slice(0, needed)
      .map((item) => item.video);
    return [...directVideos, ...supplements];
  }

  return ranked
    .slice(0, input.limit || 2)
    .map((item) => item.video);
}

export function getOfferMap(): Map<string, Offer> {
  return new Map(offers.map((offer) => [offer.id, offer]));
}
