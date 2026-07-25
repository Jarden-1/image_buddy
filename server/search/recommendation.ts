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
]);

function normalizeInterestConcept(value: string): string {
  return value
    .replace(/香水|香薰|调香|气味/g, "香氛")
    .replace(/马拉松|半马|路跑/g, "跑步")
    .replace(/拍照|影像/g, "摄影")
    .replace(/电竞|电子游戏|主机游戏/g, "游戏")
    .replace(/桌面布置|电脑桌面/g, "桌搭")
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

  return offers
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
    .sort((a, b) => b.recallScore - a.recallScore)
    .slice(0, input.limit || 12);
}

function normalizedTokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[\s、，。；：,.;:|/]+/)
    .map((token) => token.trim())
    .filter(Boolean);
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
  // relatedVideoIds are manually curated for the offer. When at least one is
  // available, do not dilute it with a merely category-adjacent filler video.
  if (directVideos.length > 0) return directVideos;

  const queryTokens = new Set(
    normalizedTokens(
      [
        ...input.selectedGift.videoQueries,
        ...input.offer.interestTags,
        ...input.analysis.interests,
      ].join(" "),
    ),
  );

  return videos
    .map((video) => {
      const matchingTags = video.tags.filter((tag) =>
        [...queryTokens].some(
          (token) => tag.includes(token) || token.includes(tag),
        ),
      );
      const tagHits = matchingTags.length;
      const specificTagHits = matchingTags.filter(
        (tag) => !genericVideoTags.has(tag),
      ).length;
      return {
        video,
        isRelevant: specificTagHits >= 2,
        score: tagHits * 0.4 + video.qualityScore * 0.2,
      };
    })
    .filter((item) => item.isRelevant)
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit || 2)
    .map((item) => item.video);
}

export function getOfferMap(): Map<string, Offer> {
  return new Map(offers.map((offer) => [offer.id, offer]));
}
