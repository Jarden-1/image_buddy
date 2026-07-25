/**
 * Home - 抖音送礼指南主页
 * 设计：沉浸暗黑抖音风，手机模拟器框架
 * 包含：视频流 + 顶部导航 + 底部导航 + 状态栏 + 礼物推荐半屏
 */
import { useState } from 'react';
import VideoFeed from '@/components/VideoFeed';
import DouyinNav from '@/components/DouyinNav';
import StatusBar from '@/components/StatusBar';
import GiftFinderSheet from '@/components/GiftFinderSheet';
import { type Blogger, BLOGGERS } from '@/lib/mockData';

function TopNav() {
  const [active, setActive] = useState<'follow' | 'recommend'>('recommend');
  return (
    <div
      className="absolute top-0 left-0 right-0 z-20 flex items-end justify-center gap-6 pt-11 pb-2"
      style={{
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}
    >
      {(['follow', 'recommend'] as const).map((tab) => (
        <button
          key={tab}
          className="relative pb-1"
          style={{ pointerEvents: 'auto' }}
          onClick={() => setActive(tab)}
        >
          <span
            className="text-sm font-semibold transition-all"
            style={{
              color: active === tab ? '#fff' : 'rgba(255,255,255,0.55)',
              fontSize: active === tab ? '16px' : '14px',
            }}
          >
            {tab === 'follow' ? '关注' : '推荐'}
          </span>
          {active === tab && (
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full"
              style={{ width: '20px', background: '#fff' }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const [isGiftFinderOpen, setIsGiftFinderOpen] = useState(false);
  const [matchedBlogger, setMatchedBlogger] = useState<Blogger>(BLOGGERS[0]);

  const handleOpenGiftFinder = (blogger: Blogger) => {
    setMatchedBlogger(blogger);
    setIsGiftFinderOpen(true);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#0a0a0a', minHeight: '100dvh' }}
    >
      {/* 手机模拟器外框 */}
      <div className="phone-frame">
        {/* 状态栏 */}
        <StatusBar />

        {/* 视频流（主内容区） */}
        <div className="absolute inset-0">
          <VideoFeed onOpenGiftFinder={handleOpenGiftFinder} />
        </div>

        {/* 顶部导航（关注/推荐） */}
        <TopNav />

        {/* 底部导航栏 */}
        <DouyinNav />

        {/* 礼物推荐半屏 */}
        <GiftFinderSheet
          isOpen={isGiftFinderOpen}
          onClose={() => setIsGiftFinderOpen(false)}
          initialBlogger={matchedBlogger}
        />
      </div>
    </div>
  );
}
