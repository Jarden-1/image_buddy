# 抖音送礼指南

模拟抖音 App 的沉浸暗黑风前端 —— 手机模拟器外框 + 竖屏视频流 + AI 礼物推荐半屏。

## 技术栈

Vite 7 + React 19 + TypeScript + Tailwind CSS v4 + lucide-react + wouter

## 快速开始

```bash
npm install
npm run dev      # 开发服务器 http://localhost:3000
npm run build    # 生产构建
npm run preview  # 预览构建产物
```

## 视频文件

视频流使用真实 mp4，由于体积较大（最大 147M，共约 280M，超过 GitHub 单文件 100M 限制）未纳入仓库。

本地运行前，把以下 3 个 mp4 放到 `public/videos/`：

| 文件名 | 对应视频项 | 主题 |
|---|---|---|
| `v1-handmade.mp4` | v1 立体蛋糕贺卡 | 手作 / 立体书 |
| `v2-gift-guide.mp4` | v2 时间礼物盒 | 送礼物技巧 |
| `v3-gift-for-him.mp4` | v3 香水测评 | 送男生礼物 |

不放视频也能跑，只是视频流区域会是空的（poster 封面图仍会显示）。

## 项目结构

```
src/
├── components/
│   ├── VideoFeed.tsx        # 视频流（scroll-snap + 点击暂停浮现胶囊）
│   ├── GiftFinderSheet.tsx  # AI 礼物推荐半屏（4 状态）
│   ├── DouyinNav.tsx        # 底部 5 tab 导航
│   ├── StatusBar.tsx        # 手机状态栏
│   ├── CapsuleOverlay.tsx   # 暂停后胶囊浮层
│   └── ErrorBoundary.tsx
├── pages/
│   ├── Home.tsx
│   └── NotFound.tsx
├── lib/
│   ├── mockData.ts          # 博主/视频/商品/问题数据
│   └── utils.ts
├── App.tsx
├── main.tsx
└── index.css                # 抖音暗黑主题 + 动画
```

## 设计

- 背景 `#000`，珊瑚红 `#FE2C55`，青蓝 `#25F4EE`
- 手机模拟器外框 390×844，移动端全屏
- 半屏抽屉 4 状态：上传 → 问题卡 → 博主碎碎念 → 署名报告
