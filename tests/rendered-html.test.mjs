import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the visual gifting product", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>TA 的世界 · 视觉选礼<\/title>/i);
  assert.match(html, /不用猜 TA 想要什么/);
  assert.match(html, /给我一点关于 TA 的线索/);
  assert.match(html, /开始读懂 TA/);
  assert.match(html, /@ 选择好友/);
  assert.doesNotMatch(html, /Your site is taking shape/);
  assert.doesNotMatch(html, /codex-preview/);
});

test("keeps the workbench connected to the real recommendation API", async () => {
  const [workbench, page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/GiftWorkbench.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(workbench, /fetch\("\/api\/recommend"/);
  assert.match(workbench, /form\.append\("image"/);
  assert.match(workbench, /result\.analysis\.evidence/);
  assert.match(workbench, /gift\.offer\.sourceUrl/);
  assert.match(workbench, /gift\.videos/);
  assert.match(page, /<GiftWorkbench \/>/);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(layout, /images: \["\/og\.jpg"\]/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(workbench, /_sites-preview|SkeletonPreview/);
  assert.ok(projectRoot);
});
