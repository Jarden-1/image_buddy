import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import {
  analyzeGiftImages,
  embedTexts,
  selectGiftCandidates,
} from "@/server/ai/qwen";
import {
  getOfferMap,
  matchVideos,
  recallOffers,
} from "@/server/search/recommendation";

export const runtime = "nodejs";

const MAX_IMAGES = 6;
const MAX_TOTAL_IMAGE_BYTES = 10 * 1024 * 1024;

function numberFromForm(
  value: FormDataEntryValue | null,
  fallback: number,
): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function parseRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const images = form
      .getAll("images")
      .concat(form.get("image"))
      .filter((value): value is File => value instanceof File);
    if (images.length === 0) {
      throw new Error("IMAGE_REQUIRED");
    }
    if (images.length > MAX_IMAGES) {
      throw new Error("IMAGE_COUNT_EXCEEDED");
    }
    if (images.some((image) => !image.type.startsWith("image/"))) {
      throw new Error("IMAGE_TYPE_INVALID");
    }
    if (
      images.reduce((total, image) => total + image.size, 0) >
      MAX_TOTAL_IMAGE_BYTES
    ) {
      throw new Error("IMAGE_TOO_LARGE");
    }
    const imageDataUrls = await Promise.all(
      images.map(async (image) => {
        const bytes = await image.arrayBuffer();
        return `data:${image.type};base64,${Buffer.from(bytes).toString("base64")}`;
      }),
    );

    return {
      imageDataUrls,
      occasion: String(form.get("occasion") || "纪念日"),
      budgetMin: numberFromForm(form.get("budgetMin"), 100),
      budgetMax: numberFromForm(form.get("budgetMax"), 800),
      city: String(form.get("city") || process.env.DEFAULT_CITY || "重庆"),
      clueContext: String(form.get("clueContext") || ""),
    };
  }

  const body = (await request.json()) as {
    imageDataUrls?: string[];
    imageDataUrl?: string;
    occasion?: string;
    budgetMin?: number;
    budgetMax?: number;
    city?: string;
    clueContext?: string;
  };
  const imageDataUrls = body.imageDataUrls || [body.imageDataUrl || ""];
  if (
    imageDataUrls.length === 0 ||
    imageDataUrls.length > MAX_IMAGES ||
    imageDataUrls.some((image) => !image.startsWith("data:image/"))
  ) {
    throw new Error("IMAGE_REQUIRED");
  }
  return {
    imageDataUrls,
    occasion: body.occasion || "纪念日",
    budgetMin: Number(body.budgetMin ?? 100),
    budgetMax: Number(body.budgetMax ?? 800),
    city: body.city || process.env.DEFAULT_CITY || "重庆",
    clueContext: body.clueContext || "",
  };
}

export async function POST(request: Request) {
  const startedAt = performance.now();
  try {
    const input = await parseRequest(request);
    if (
      !Number.isFinite(input.budgetMin) ||
      !Number.isFinite(input.budgetMax) ||
      input.budgetMin < 0 ||
      input.budgetMax <= input.budgetMin
    ) {
      return NextResponse.json(
        { error: "预算范围不正确" },
        { status: 400 },
      );
    }

    const visualStartedAt = performance.now();
    const analysis = await analyzeGiftImages(input);
    const visualMs = Math.round(performance.now() - visualStartedAt);

    const recallStartedAt = performance.now();
    const queryEmbeddings = await embedTexts(analysis.searchQueries);
    const candidates = recallOffers({
      queryEmbeddings,
      queryTexts: [
        ...analysis.searchQueries,
        ...analysis.interests,
        ...analysis.aesthetics,
      ],
      budgetMin: input.budgetMin,
      budgetMax: input.budgetMax,
      city: input.city,
      limit: 12,
    });
    const recallMs = Math.round(performance.now() - recallStartedAt);

    if (candidates.length === 0) {
      return NextResponse.json({
        status: "no_candidates",
        analysis,
        message: "当前商品样本中没有满足预算和城市条件的方案。",
        timings: {
          visualMs,
          recallMs,
          totalMs: Math.round(performance.now() - startedAt),
        },
      });
    }

    const selectionStartedAt = performance.now();
    const selection = await selectGiftCandidates({
      analysis,
      candidates,
      occasion: input.occasion,
      budgetMin: input.budgetMin,
      budgetMax: input.budgetMax,
      city: input.city,
    });
    const selectionMs = Math.round(performance.now() - selectionStartedAt);

    const offerMap = getOfferMap();
    const gifts = selection.gifts.flatMap((gift) => {
      const offer = offerMap.get(gift.offerId);
      if (!offer) return [];
      return [
        {
          ...gift,
          offer,
          videos: matchVideos({
            selectedGift: gift,
            offer,
            analysis,
            limit: 2,
          }),
        },
      ];
    });

    return NextResponse.json({
      status: "completed",
      provider: "qwen",
      model: process.env.QWEN_VISION_MODEL || "qwen3-vl-flash",
      analysis,
      summary: selection.summary,
      gifts,
      clarification: analysis.clarification?.needed
        ? analysis.clarification
        : null,
      timings: {
        visualMs,
        recallMs,
        selectionMs,
        totalMs: Math.round(performance.now() - startedAt),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const clientErrors = new Set([
      "IMAGE_REQUIRED",
      "IMAGE_COUNT_EXCEEDED",
      "IMAGE_TYPE_INVALID",
      "IMAGE_TOO_LARGE",
    ]);
    console.error("recommendation_failed", {
      message,
      elapsedMs: Math.round(performance.now() - startedAt),
    });
    return NextResponse.json(
      {
        error: clientErrors.has(message)
          ? message
          : "AI 推荐暂时失败，请稍后重试",
      },
      { status: clientErrors.has(message) ? 400 : 502 },
    );
  }
}
