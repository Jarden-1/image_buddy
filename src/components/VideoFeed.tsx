/**
 * VideoFeed - 抖音视频流主组件
 * 设计：沉浸暗黑抖音风，全屏竖屏视频流，scroll-snap 切换
 * 右侧：作者头像/点赞/评论/分享
 * 底部：描述文字 + 话题标签
 * 暂停后 800ms 浮现胶囊浮层
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Music2, Plus } from 'lucide-react';
import { VIDEOS, type VideoItem, type Blogger, matchBloggerByVideo } from '@/lib/mockData';
import CapsuleOverlay from './CapsuleOverlay';

interface VideoFeedProps {
  onOpenGiftFinder: (blogger: Blogger) => void;
}

function VideoSlide({
  video,
  isActive,
  onOpenGiftFinder,
}: {
  video: VideoItem;
  isActive: boolean;
  onOpenGiftFinder: (blogger: Blogger) => void;
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [showCapsules, setShowCapsules] = useState(false);
  const [liked, setLiked] = useState(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 当切换到非活跃状态时，重置暂停状态
  useEffect(() => {
    if (!isActive) {
      setIsPaused(false);
      setShowCapsules(false);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    }
  }, [isActive]);

  // 控制视频播放：仅当前活跃且未暂停时播放，其余暂停并重置到开头
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive && !isPaused) {
      v.play().catch(() => {/* 自动播放受限时忽略 */});
    } else {
      v.pause();
      if (!isActive) v.currentTime = 0;
    }
  }, [isActive, isPaused]);

  const handleTap = useCallback(() => {
    if (!isActive) return;
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    if (newPaused) {
      pauseTimerRef.current = setTimeout(() => setShowCapsules(true), 800);
    } else {
      setShowCapsules(false);
    }
  }, [isActive, isPaused]);

  // 根据当前视频自动匹配博主
  const matchedBlogger = matchBloggerByVideo(video.tags, video.description);

  return (
    <div
      className="relative w-full h-full flex-shrink-0 overflow-hidden bg-black"
      style={{ scrollSnapAlign: 'start' }}
      onClick={handleTap}
    >
      {/* 视频背景 */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        poster={video.thumbUrl}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        loop
        playsInline
        preload="metadata"
      />

      {/* 渐变遮罩 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 30%, transparent 50%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* 暂停图标 */}
      {isPaused && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ animation: 'fadeSlideUp 0.2s ease-out forwards' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            <div
              className="flex gap-1.5"
              style={{ opacity: 0.9 }}
            >
              <div className="w-2 h-7 bg-white rounded-full" />
              <div className="w-2 h-7 bg-white rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* 胶囊浮层 */}
      {showCapsules && (
        <CapsuleOverlay
          onOpenGiftFinder={() => onOpenGiftFinder(matchedBlogger)}
          blogger={matchedBlogger}
        />
      )}

      {/* 右侧操作栏 */}
      <div
        className="absolute right-3 flex flex-col items-center gap-5 pointer-events-auto"
        style={{ bottom: '100px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 作者头像 */}
        <div className="relative">
          <img
            src={video.authorAvatar}
            alt={video.authorName}
            className="w-12 h-12 rounded-full object-cover border-2 border-white"
          />
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: '#FE2C55' }}
          >
            <Plus size={12} color="white" strokeWidth={3} />
          </div>
        </div>

        {/* 点赞 */}
        <button
          className="flex flex-col items-center gap-1"
          onClick={() => setLiked(!liked)}
        >
          <Heart
            size={32}
            fill={liked ? '#FE2C55' : 'none'}
            color={liked ? '#FE2C55' : 'white'}
            strokeWidth={1.5}
            style={{ filter: liked ? 'drop-shadow(0 0 8px #FE2C55)' : 'none', transition: 'all 0.2s' }}
          />
          <span className="text-white text-xs font-medium">{liked ? '12.5万' : video.likes}</span>
        </button>

        {/* 评论 */}
        <button className="flex flex-col items-center gap-1">
          <MessageCircle size={32} color="white" strokeWidth={1.5} />
          <span className="text-white text-xs font-medium">{video.comments}</span>
        </button>

        {/* 分享 */}
        <button className="flex flex-col items-center gap-1">
          <Share2 size={32} color="white" strokeWidth={1.5} />
          <span className="text-white text-xs font-medium">{video.shares}</span>
        </button>

        {/* 音乐碟片 */}
        <div
          className="w-10 h-10 rounded-full border-2 border-white/30 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #333 0%, #111 100%)',
            animation: isPaused ? 'none' : 'spin 4s linear infinite',
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <Music2 size={16} color="white" opacity={0.8} />
          </div>
        </div>
      </div>

      {/* 底部信息 */}
      <div
        className="absolute left-3 right-16 pointer-events-none"
        style={{ bottom: '80px' }}
      >
        <p className="text-white font-semibold text-sm mb-1" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
          @{video.authorName}
        </p>
        <p
          className="text-white text-sm leading-snug mb-2"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {video.description}
        </p>
        <div className="flex flex-wrap gap-1">
          {video.tags.map((tag) => (
            <span key={tag} className="text-white text-xs font-medium" style={{ opacity: 0.9 }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function VideoFeed({ onOpenGiftFinder }: VideoFeedProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setActiveIndex(idx);
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-scroll scrollbar-hide"
      style={{ scrollSnapType: 'y mandatory', scrollBehavior: 'smooth' }}
    >
      {VIDEOS.map((video, i) => (
        <div key={video.id} className="w-full h-full flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
          <VideoSlide
            video={video}
            isActive={i === activeIndex}
            onOpenGiftFinder={(blogger) => onOpenGiftFinder(blogger)}
          />
        </div>
      ))}
    </div>
  );
}
