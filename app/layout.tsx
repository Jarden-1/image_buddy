import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TA 的世界 · 视觉选礼",
  description:
    "上传一张 TA 的生活切片，从视觉线索出发，找到 TA 会喜欢、你也不容易买错的礼物。",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "TA 的世界 · 视觉选礼",
    description: "看一眼 TA 的世界，找到真正适合 TA 的礼物。",
    images: ["/og.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "TA 的世界 · 视觉选礼",
    description: "看一眼 TA 的世界，找到真正适合 TA 的礼物。",
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
      <body className={spaceGrotesk.variable}>{children}</body>
    </html>
  );
}
