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
  budgetMin: number;
  budgetMax: number;
  city: string;
  limit?: number;
}): Array<{ offer: Offer; recallScore: number }> {
  const embeddingMap = new Map(
    offerEmbeddings.map((item) => [item.id, item.embedding]),
  );

  return offers
    .filter((offer) => isEligible(offer, input))
    .map((offer) => {
      const embedding = embeddingMap.get(offer.id) || [];
      const recallScore = Math.max(
        0,
        ...input.queryEmbeddings.map((queryEmbedding) =>
          cosineSimilarity(queryEmbedding, embedding),
        ),
      );
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
      const directBoost = directIds.has(video.id) ? 2 : 0;
      return {
        video,
        isRelevant: directBoost > 0 || specificTagHits > 0,
        score: directBoost + tagHits * 0.4 + video.qualityScore * 0.2,
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
