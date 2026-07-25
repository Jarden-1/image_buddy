export type GiftStrategy =
  | "interest_direct"
  | "interest_adjacent"
  | "shared_experience";

export interface VisualEvidence {
  observation: string;
  implication: string;
}

export interface VisualAnalysis {
  sceneSummary: string;
  evidence: VisualEvidence[];
  interests: string[];
  aesthetics: string[];
  ownedOrShown: Array<{
    item: string;
    status: "owned" | "wanted" | "admired" | "unknown";
  }>;
  searchQueries: string[];
  avoidances: string[];
  clarification?: {
    needed: boolean;
    question: string;
    options: string[];
  } | null;
}

export interface Offer {
  id: string;
  title: string;
  kind: "physical" | "experience";
  price: number;
  cities: string[];
  sourcePlatform: string;
  sourceUrl: string;
  imageUrl: string;
  merchant?: string;
  sourceType?:
    | "official_product"
    | "retail_search"
    | "douyin_video"
    | "local_life_demo";
  priceStatus?: "verified" | "estimated" | "snapshot";
  priceNote?: string;
  verifiedAt?: string;
  interestTags: string[];
  giftStrategies: GiftStrategy[];
  searchText: string;
  riskNotes: string[];
  relatedVideoIds: string[];
}

export interface OfferEmbedding {
  id: string;
  embedding: number[];
}

export interface VideoItem {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  sourceUrl: string;
  tags: string[];
  contentRole: "gift_advice" | "product_proof" | "interest_content";
  qualityScore: number;
  sourceRef?: string;
  verifiedAt?: string;
}

export interface SelectedGift {
  offerId: string;
  strategy: GiftStrategy;
  reason: string;
  evidence: string[];
  caveat: string | null;
  videoQueries: string[];
}

export interface SelectionResult {
  summary: string;
  gifts: SelectedGift[];
}
