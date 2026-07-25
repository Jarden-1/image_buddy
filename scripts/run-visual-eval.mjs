import { readFile } from "node:fs/promises";

const baseUrl = (
  process.env.VISUAL_EVAL_BASE_URL || "http://localhost:3000"
).replace(/\/$/, "");

const cases = [
  {
    name: "阅读卧室",
    file: new URL(
      "../tests/fixtures/visual-eval/05-reading-bedroom.jpg",
      import.meta.url,
    ),
    expectedInterests: ["阅读", "书籍", "手账"],
    expectedOffers: [
      "gift-reading-light",
      "gift-book-stand",
      "gift-reading-journal",
    ],
    clue: "TA 经常看纸质书和做读书笔记，但我不知道具体想买哪一本。",
  },
  {
    name: "宠物玄关",
    file: new URL(
      "../tests/fixtures/visual-eval/06-pet-entryway.jpg",
      import.meta.url,
    ),
    expectedInterests: ["宠物", "遛狗"],
    expectedOffers: ["gift-pet-photo-book", "gift-pet-travel-bottle"],
    clue: "这些都是 TA 和狗狗日常生活的东西。",
  },
  {
    name: "烘焙厨房",
    file: new URL(
      "../tests/fixtures/visual-eval/07-baking-kitchen.jpg",
      import.meta.url,
    ),
    expectedInterests: ["烘焙", "料理"],
    expectedOffers: [
      "gift-baking-toolkit",
      "gift-recipe-stand",
      "cq-baking-zhixi",
      "cq-baking-jiuyue",
    ],
    clue: "TA 最近经常在家烤面包，但我不确定还缺什么工具。",
  },
];

const selectedCases = process.env.VISUAL_EVAL_CASE
  ? cases.filter((testCase) =>
      testCase.name.includes(process.env.VISUAL_EVAL_CASE),
    )
  : cases;

if (selectedCases.length === 0) {
  throw new Error(`没有匹配的测试场景：${process.env.VISUAL_EVAL_CASE}`);
}

const results = [];
let failed = false;

function normalizeInterest(value) {
  return value
    .replace(/养宠|猫咪|狗狗|遛狗/g, "宠物")
    .replace(/看书|读书|纸质阅读/g, "阅读")
    .replace(/甜品|蛋糕|面包/g, "烘焙");
}

for (const testCase of selectedCases) {
  const image = await readFile(testCase.file);
  const form = new FormData();
  form.append(
    "image",
    new File([image], testCase.file.pathname.split("/").at(-1), {
      type: "image/jpeg",
    }),
  );
  form.append("occasion", "生日");
  form.append("budgetMin", "100");
  form.append("budgetMax", "800");
  form.append("city", "重庆");
  form.append("clueContext", testCase.clue);

  const response = await fetch(`${baseUrl}/api/recommend`, {
    method: "POST",
    body: form,
  });
  const responseText = await response.text();
  let payload;
  try {
    payload = JSON.parse(responseText);
  } catch {
    payload = { error: responseText || `HTTP ${response.status}` };
  }
  if (!response.ok) {
    failed = true;
    results.push({
      name: testCase.name,
      ok: false,
      error: payload.error || `HTTP ${response.status}`,
    });
    continue;
  }

  const interests = payload.analysis?.interests || [];
  const offerIds = (payload.gifts || []).map((gift) => gift.offerId);
  const interestHit = testCase.expectedInterests.some((expected) =>
    interests.some(
      (actual) =>
        normalizeInterest(actual).includes(normalizeInterest(expected)) ||
        normalizeInterest(expected).includes(normalizeInterest(actual)),
    ),
  );
  const offerHit = testCase.expectedOffers.some((id) => offerIds.includes(id));
  const videosRelevant = (payload.gifts || []).every((gift) =>
    gift.videos.every(
      (video) =>
        gift.offer.relatedVideoIds.includes(video.id) ||
        video.tags.some((tag) =>
          gift.offer.interestTags.some(
            (interest) =>
              tag.includes(interest) || interest.includes(tag),
          ),
        ),
    ),
  );
  const ok = interestHit && offerHit && videosRelevant;
  failed ||= !ok;
  results.push({
    name: testCase.name,
    ok,
    interests,
    offers: offerIds,
    videoCounts: (payload.gifts || []).map((gift) => gift.videos.length),
    totalMs: payload.timings?.totalMs,
    checks: { interestHit, offerHit, videosRelevant },
  });
}

console.log(JSON.stringify(results, null, 2));
if (failed) process.exitCode = 1;
