# 抖音 AI 视觉选礼 Demo

这是一个面向年轻用户的视觉搜索黑客松项目：用户在抖音刷到送礼攻略，或停下来细看一件好物时，进入「AI 选礼」；选择抖音好友的模拟公开作品，或上传 TA 的生活切片，系统从视觉证据出发推荐可履约礼物与相关抖音内容。

当前版本只正式服务恋爱伴侣。好友、同事、家人等关系会复用相同技术链路，但必须接入各自的送礼 Skill 后才能开放，避免把伴侣规则生搬硬套。

## 当前体验

1. 在抖音式短视频流浏览内容。
2. 送礼攻略停留约 1.6 秒后出现轻提示；普通好物在用户主动暂停后出现。
3. 通过 `@选择好友` Demo 或上传桌面、卧室、穿搭、公开作品截图提供视觉线索。
4. 补充场合、预算、城市和一句可选说明。
5. 系统完成视觉理解、向量召回、轻量 LLM 选择、视频匹配和结果生成。
6. 结果以「可履约礼物/本地体验 + 视觉证据 + 风险提醒 + 关联内容」呈现在抖音内。

场合已覆盖生日、纪念日、七夕、日常惊喜、毕业、搬家与久别重逢。

## 推荐链路

```text
图片 + 场合/预算/城市
  → Qwen VLM 提取客观证据、兴趣、审美、已有物和检索句
  → text-embedding-v4 生成查询向量
  → 预算/城市过滤 + 稠密向量召回 + 明确兴趣加权 + 候选多样化
  → Qwen Flash 从 12 个真实候选中选择最多 3 个不同策略
  → 服务端校验已有物重复、共同体验证据和策略合法性
  → 人工关联优先的抖音内容匹配
  → 推荐工作台
```

整条链路只有两次生成调用：一次 VLM、一次轻量文本模型。Embedding 是检索调用；预算过滤、去重、候选多样化、格式修复和视频匹配均在本地完成。

## 数据覆盖

- 66 个商品与重庆本地体验。
- 73 条抖音关联内容。
- 覆盖摄影、游戏、桌搭、香氛、跑步、阅读、绘画、宠物、烘焙、植物、骑行、健身、动漫、旅行、文具等视觉上容易识别的兴趣。
- 商品来源区分官方商品、零售搜索、抖音视频和本地生活 Demo。
- 价格区分已核实、页面快照和 Demo 估价，并保留核验时间与风险说明。
- 所有商品均有 1024 维 `text-embedding-v4` 向量。

`data/offers.json` 是商品与体验目录，`data/videos.json` 是内容目录，`data/offer-embeddings.json` 是离线商品向量。

## 本地运行

要求 Node.js `>=22.13.0`。

```bash
npm install
cp .env.example .env.local
npm run dev
```

在 `.env.local` 中配置：

```env
DASHSCOPE_API_KEY=
BAILIAN_BASE_URL=https://YOUR_WORKSPACE_ID.cn-beijing.maas.aliyuncs.com/compatible-mode/v1
QWEN_VISION_MODEL=qwen3-vl-flash
QWEN_TEXT_MODEL=qwen3.5-flash
QWEN_EMBEDDING_MODEL=text-embedding-v4
DEFAULT_CITY=重庆
```

API Key 只放在 `.env.local`，禁止提交到 Git。

## 验证

```bash
npm run lint
npm test
npm run eval:visual
```

- `npm test` 会构建项目并验证商品、视频、向量和页面契约。
- `npm run eval:visual` 会调用本地真实 AI 链路，回归阅读、宠物和烘焙场景。
- 七组视觉案例与结果记录位于 `tests/fixtures/visual-eval/README.md`。

新增或修改商品的 `searchText` 后，使用以下命令重新生成向量：

```bash
node --env-file=.env.local scripts/generate-offer-embeddings.mjs
```

## Skill 接入

`skill/visual-gift-search/` 是伴侣视觉选礼 Skill，代码通过 `server/ai/skill-context.ts` 将 Skill 正文和必要 references 注入视觉理解与候选选择阶段。

后续增加关系类型时，建议为每种关系新增独立 Skill，并在服务端做关系到 Skill 的显式路由。商品召回、预算过滤和视频匹配保持共享，不复制一套算法。

## Git 回退点

- `baseline-iphone-gifting-v1`：iPhone 外观、抖音内入口和基础真实 AI 链路。
- 后续数据扩容、排序优化和场景回归均拆为独立提交，可以逐个回退。
