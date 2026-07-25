import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "抖音 AI 选礼 · 视觉搜索 Demo",
  description:
    "在抖音内选择好友或上传生活切片，从视觉线索找到更适合 TA 的礼物。",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "抖音 AI 选礼 · 视觉搜索 Demo",
    description: "从 TA 的公开作品和生活切片出发，在抖音内完成视觉选礼。",
    images: ["/og.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "抖音 AI 选礼 · 视觉搜索 Demo",
    description: "从 TA 的公开作品和生活切片出发，在抖音内完成视觉选礼。",
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
