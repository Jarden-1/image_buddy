/**
 * CapsuleOverlay - 暂停后胶囊浮层
 * 设计：轻量、右对齐、博主署名 + 箭头
 */
import { ChevronRight } from 'lucide-react';
import type { Blogger } from '@/lib/mockData';

interface CapsuleOverlayProps {
  onOpenGiftFinder: () => void;
  blogger?: Blogger;
}

export default function CapsuleOverlay({ onOpenGiftFinder, blogger }: CapsuleOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col justify-center pointer-events-none"
      style={{ paddingBottom: '80px', alignItems: 'flex-end', paddingRight: '16px' }}
    >
      <div
        className="pointer-events-auto"
        style={{ animation: 'fadeSlideUp 0.25s cubic-bezier(0.23,1,0.32,1) both' }}
        onClick={(e) => { e.stopPropagation(); onOpenGiftFinder(); }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 14px',
            borderRadius: '9999px',
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.18)',
            cursor: 'pointer',
            transition: 'opacity 120ms ease',
          }}
          onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.75'; }}
          onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
          onTouchStart={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.75'; }}
          onTouchEnd={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          {blogger && (
            <span style={{ fontSize: '14px', lineHeight: 1 }}>{blogger.avatar}</span>
          )}
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.92)', whiteSpace: 'nowrap' }}>
            {blogger ? `${blogger.name} 帮你选礼物` : '让AI帮你选礼物'}
          </span>
          <ChevronRight size={12} color="rgba(255,255,255,0.5)" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
