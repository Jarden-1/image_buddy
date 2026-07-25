import assert from "node:assert/strict";
import { open, readFile, stat } from "node:fs/promises";
import test from "node:test";

const [offers, videos, embeddings] = await Promise.all([
  readFile(new URL("../data/offers.json", import.meta.url), "utf8").then(
    JSON.parse,
  ),
  readFile(new URL("../data/videos.json", import.meta.url), "utf8").then(
    JSON.parse,
  ),
  readFile(
    new URL("../data/offer-embeddings.json", import.meta.url),
    "utf8",
  ).then(JSON.parse),
]);

function assertUniqueIds(items, label) {
  const ids = items.map((item) => item.id);
  assert.equal(
    new Set(ids).size,
    ids.length,
    `${label} 中存在重复 ID`,
  );
}

test("catalog records are complete and internally consistent", () => {
  assert.ok(offers.length >= 60, "商品与体验样本应至少达到 60 个");
  assert.ok(videos.length >= 70, "关联内容样本应至少达到 70 条");
  assertUniqueIds(offers, "offers");
  assertUniqueIds(videos, "videos");
  assertUniqueIds(embeddings, "offer embeddings");

  const videoIds = new Set(videos.map((video) => video.id));
  for (const offer of offers) {
    assert.ok(offer.title?.length >= 4, `${offer.id} 缺少可读标题`);
    assert.ok(
      offer.kind === "physical" || offer.kind === "experience",
      `${offer.id} 的 kind 不合法`,
    );
    assert.ok(
      Number.isFinite(offer.price) && offer.price > 0,
      `${offer.id} 的价格不合法`,
    );
    assert.ok(offer.cities?.length > 0, `${offer.id} 缺少城市范围`);
    assert.match(offer.sourceUrl, /^https:\/\//, `${offer.id} 来源不是 HTTPS`);
    assert.ok(
      offer.interestTags?.length >= 3,
      `${offer.id} 的兴趣标签过少`,
    );
    assert.ok(
      offer.giftStrategies?.length > 0,
      `${offer.id} 缺少送礼策略`,
    );
    assert.ok(
      offer.searchText?.length >= 40,
      `${offer.id} 的检索描述信息不足`,
    );
    assert.ok(
      offer.relatedVideoIds?.length > 0,
      `${offer.id} 缺少关联内容`,
    );
    for (const videoId of offer.relatedVideoIds) {
      assert.ok(videoIds.has(videoId), `${offer.id} 引用了不存在的 ${videoId}`);
    }
  }
});

test("embeddings cover every offer with one consistent dimension", () => {
  const offerIds = new Set(offers.map((offer) => offer.id));
  const embeddingIds = new Set(embeddings.map((item) => item.id));
  assert.deepEqual(embeddingIds, offerIds);

  const dimensions = new Set(
    embeddings.map((item) => item.embedding?.length || 0),
  );
  assert.deepEqual([...dimensions], [1024]);
  for (const item of embeddings) {
    assert.ok(
      item.embedding.every(Number.isFinite),
      `${item.id} 的向量包含无效数字`,
    );
  }
});

test("catalog covers common visually recognizable young-user interests", () => {
  const tags = new Set(offers.flatMap((offer) => offer.interestTags));
  const expectedInterests = [
    "摄影",
    "游戏",
    "桌搭",
    "香氛",
    "跑步",
    "阅读",
    "绘画",
    "宠物",
    "烘焙",
    "植物",
    "骑行",
    "健身",
    "动漫",
    "旅行",
    "文具",
  ];
  for (const interest of expectedInterests) {
    assert.ok(tags.has(interest), `商品库尚未覆盖 ${interest}`);
  }
});

test("video metadata is safe to rank and open", () => {
  for (const video of videos) {
    assert.ok(video.title?.length >= 4, `${video.id} 缺少标题`);
    assert.match(video.sourceUrl, /^https:\/\//, `${video.id} 链接不是 HTTPS`);
    assert.ok(video.tags?.length >= 3, `${video.id} 标签过少`);
    assert.ok(
      Number.isFinite(video.qualityScore) &&
        video.qualityScore >= 0 &&
        video.qualityScore <= 1,
      `${video.id} 的质量分不合法`,
    );
  }
});

const bundledVideos = [
  "../public/videos/feed-gift-for-him.m4v",
  "../public/videos/feed-gift-guide.m4v",
  "../public/videos/feed-handmade.m4v",
];
const bundledImages = [
  "../public/demo-friend-fragrance.jpg",
  "../public/demo-friend-gaming.jpg",
  "../public/demo-friend-photo.jpg",
  "../public/demo-ta.jpg",
  ...Array.from(
    { length: 7 },
    (_, index) =>
      `./fixtures/visual-eval/${String(index + 1).padStart(2, "0")}-${[
        "photography-desk",
        "gaming-desk",
        "running-entryway",
        "fragrance-bedroom",
        "reading-bedroom",
        "pet-entryway",
        "baking-kitchen",
      ][index]}.jpg`,
  ),
];

async function readHeader(path, length) {
  const handle = await open(new URL(path, import.meta.url));
  try {
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, 0);
    return buffer;
  } finally {
    await handle.close();
  }
}

test("handoff media is bundled and stays within GitHub limits", async () => {
  for (const path of bundledVideos) {
    const fileUrl = new URL(path, import.meta.url);
    const fileStat = await stat(fileUrl);
    assert.ok(fileStat.size > 100_000, `${path} 不是有效视频素材`);
    assert.ok(
      fileStat.size < 25 * 1024 * 1024,
      `${path} 对普通 Git 交接过大`,
    );
    const header = await readHeader(path, 12);
    assert.equal(header.toString("ascii", 4, 8), "ftyp", `${path} 不是 MP4/M4V`);
  }

  for (const path of bundledImages) {
    const fileUrl = new URL(path, import.meta.url);
    const fileStat = await stat(fileUrl);
    assert.ok(fileStat.size > 10_000, `${path} 不是有效图片素材`);
    assert.ok(fileStat.size < 2 * 1024 * 1024, `${path} 图片体积异常`);
    const header = await readHeader(path, 2);
    assert.deepEqual([...header], [0xff, 0xd8], `${path} 不是 JPEG`);
  }
});
