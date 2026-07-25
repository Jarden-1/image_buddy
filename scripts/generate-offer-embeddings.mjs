import { readFile, writeFile } from "node:fs/promises";

const offers = JSON.parse(
  await readFile(new URL("../data/offers.json", import.meta.url), "utf8"),
);
const baseUrl = process.env.BAILIAN_BASE_URL?.replace(/\/$/, "");
const apiKey = process.env.DASHSCOPE_API_KEY;
const model = process.env.QWEN_EMBEDDING_MODEL || "text-embedding-v4";

if (!baseUrl || !apiKey) {
  throw new Error("请先配置 BAILIAN_BASE_URL 和 DASHSCOPE_API_KEY");
}

const vectors = [];
for (let offset = 0; offset < offers.length; offset += 10) {
  const batch = offers.slice(offset, offset + 10);
  const response = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: batch.map((offer) => offer.searchText),
      dimensions: 1024,
      encoding_format: "float",
    }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(
      result.error?.message || `Embedding 请求失败：${response.status}`,
    );
  }
  vectors.push(
    ...result.data.sort((a, b) => a.index - b.index).map((item) => item.embedding),
  );
}

const embeddings = offers.map((offer, index) => ({
  id: offer.id,
  embedding: vectors[index],
}));

await writeFile(
  new URL("../data/offer-embeddings.json", import.meta.url),
  `${JSON.stringify(embeddings)}\n`,
  "utf8",
);

console.log(
  JSON.stringify({
    model,
    offers: offers.length,
    dimension: embeddings[0]?.embedding.length || 0,
  }),
);
