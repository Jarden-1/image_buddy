/**
 * GiftFinderSheet - 测一测半屏（4个状态）
 * 设计语言：深黑底 + 精准层次 + 克制珊瑚红点缀 + 博主人格化体验
 * 状态：A 上传 + 博主选择 → B 问题卡 → C 博主碎碎念气泡 → D 博主署名报告
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, AtSign, Sparkles, ChevronLeft, Check, ExternalLink, ChevronRight,
  Camera, Plus, Shield
} from 'lucide-react';
import { QUESTIONS, GIFT_REPORT, BLOGGERS, IMAGES, type Blogger } from '@/lib/mockData';

type SheetState = 'A' | 'B' | 'C' | 'D';

interface GiftFinderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialBlogger?: Blogger; // 由视频自动匹配传入
}

// ─── 示例轮播数据 ─────────────────────────────────────────────────────────────
const EXAMPLE_CARDS = [
  {
    src: IMAGES.videoThumb1,
    scene: '拍生日现场',
    title: '仪式感礼物',
    sub: '蛋糕贺卡 · 手作温度',
    tag: '亲密关系',
  },
  {
    src: IMAGES.videoThumb2,
    scene: '拍桌面摆件',
    title: '氛围感生活素',
    sub: '香氛和书本',
    tag: '日常惊喜',
  },
  {
    src: IMAGES.videoThumb3,
    scene: '拍穿搭风格',
    title: '精致饰品',
    sub: '小众设计 · 低调质感',
    tag: '生日',
  },
];

// ─── 隐私协议弹窗 ─────────────────────────────────────────────────────────────
function PrivacyModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const [agreed, setAgreed] = useState(false);
  return (
    <div
      className="absolute inset-0 z-[200] flex items-end"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full rounded-t-3xl px-5 pt-6 pb-8"
        style={{
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          animation: 'slideUp 0.3s cubic-bezier(0.23,1,0.32,1) both',
        }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(254,44,85,0.12)' }}>
            <Shield size={15} color="#FE2C55" />
          </div>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>上传前请确认</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>保护您和对方的隐私</p>
          </div>
        </div>
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
            您上传的照片/视频将仅用于本次 AI 礼物推荐分析，<span style={{ color: 'rgba(255,255,255,0.8)' }}>不会被存储或用于其他用途</span>。
            分析完成后数据将自动清除。请确保您有权上传该内容，且已获得照片中相关人员的同意。
          </p>
        </div>
        <button className="flex items-start gap-3 w-full mb-5" onClick={() => setAgreed(a => !a)}>
          <div
            className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center mt-0.5 transition-all"
            style={{ background: agreed ? '#FE2C55' : 'transparent', border: `1.5px solid ${agreed ? '#FE2C55' : 'rgba(255,255,255,0.25)'}` }}
          >
            {agreed && <Check size={11} color="#fff" strokeWidth={3} />}
          </div>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, textAlign: 'left' }}>
            我已阅读并同意以上隐私说明，确认有权上传该内容
          </span>
        </button>
        <div className="flex gap-3">
          <button className="flex-1 rounded-2xl" style={{ height: '46px', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: 500 }} onClick={onCancel}>取消</button>
          <button
            className="flex-1 rounded-2xl transition-all"
            disabled={!agreed}
            style={{ height: '46px', background: agreed ? '#FE2C55' : 'rgba(254,44,85,0.2)', color: agreed ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '14px', fontWeight: 700, transition: 'all 0.2s' }}
            onClick={() => agreed && onConfirm()}
          >
            确认上传
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 博主选择卡片 ─────────────────────────────────────────────────────────────
function BloggerSelector({
  selected,
  onSelect,
  autoMatched,
}: {
  selected: Blogger;
  onSelect: (b: Blogger) => void;
  autoMatched: Blogger;
}) {
  return (
    <div className="px-5 mb-3">
      <div className="flex items-center justify-between mb-2">
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          选择帮你分析的博主
        </p>
        {autoMatched.id === selected.id && (
          <span style={{ fontSize: '10px', color: '#00F2EA', background: 'rgba(0,242,234,0.1)', border: '1px solid rgba(0,242,234,0.2)', padding: '2px 8px', borderRadius: '9999px' }}>
            自动匹配
          </span>
        )}
      </div>
      {/* 横向滑动卡片 */}
      <div
        className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {BLOGGERS.map((blogger) => {
          const isSelected = selected.id === blogger.id;
          return (
            <button
              key={blogger.id}
              onClick={() => onSelect(blogger)}
              style={{
                flexShrink: 0,
                scrollSnapAlign: 'start',
                width: '130px',
                padding: '10px 12px',
                borderRadius: '16px',
                background: isSelected ? 'rgba(254,44,85,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${isSelected ? 'rgba(254,44,85,0.5)' : 'rgba(255,255,255,0.08)'}`,
                textAlign: 'left',
                transition: 'all 0.2s cubic-bezier(0.23,1,0.32,1)',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {/* 头像 + 名字 */}
              <div className="flex items-center gap-2 mb-1.5">
                <span style={{ fontSize: '20px', lineHeight: 1 }}>{blogger.avatar}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? '#FE2C55' : 'rgba(255,255,255,0.8)', lineHeight: 1.2 }}>
                  {blogger.name}
                </span>
              </div>
              {/* 标语 */}
              <p style={{ fontSize: '10px', color: isSelected ? 'rgba(254,44,85,0.8)' : 'rgba(255,255,255,0.35)', lineHeight: 1.4, marginBottom: '6px' }}>
                {blogger.tagline}
              </p>
              {/* 风格标签 */}
              <div className="flex flex-wrap gap-1">
                {blogger.styleTags.slice(0, 2).map(tag => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '9px',
                      padding: '2px 6px',
                      borderRadius: '9999px',
                      background: isSelected ? 'rgba(254,44,85,0.15)' : 'rgba(255,255,255,0.06)',
                      color: isSelected ? '#FE2C55' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {/* 已选中标记 */}
              {isSelected && (
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: '#FE2C55' }}>
                    <Check size={8} color="#fff" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: '9px', color: '#FE2C55', fontWeight: 600 }}>已选择</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── 状态A：上传 + 博主选择 ──────────────────────────────────────────────────
type StateAProps = {
  onNext: (thumb: string, blogger: Blogger) => void;
  initialBlogger: Blogger;
};
function StateA({ onNext, initialBlogger }: StateAProps) {
  const [accountInput, setAccountInput] = useState('');
  const [previews, setPreviews] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [pendingFileUrls, setPendingFileUrls] = useState<string[]>([]);
  const [selectedBlogger, setSelectedBlogger] = useState<Blogger>(initialBlogger);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canStart = previews.length > 0 || accountInput.trim().length > 0;

  useEffect(() => {
    const t = setInterval(() => setCarouselIndex(i => (i + 1) % EXAMPLE_CARDS.length), 2400);
    return () => clearInterval(t);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const urls: string[] = [];
      Array.from(files).forEach(f => urls.push(URL.createObjectURL(f)));
      setPendingFileUrls(urls);
      setShowPrivacy(true);
    }
    e.target.value = '';
  };

  const handleStart = () => {
    onNext(previews[0] || EXAMPLE_CARDS[carouselIndex].src, selectedBlogger);
  };

  return (
    <div className="flex flex-col overflow-y-auto scrollbar-hide" style={{ height: '100%', position: 'relative' }}>
      <input ref={fileInputRef} type="file" className="hidden" multiple accept="image/*,video/*" onChange={handleFileChange} />

      {/* 标题区 */}
      <div className="px-5 pt-2 pb-2">
        <div className="flex items-center gap-2.5 mb-0.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(254,44,85,0.15)' }}>
            <Sparkles size={14} color="#FE2C55" />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>AI 礼物推荐</h2>
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
          上传对方的照片、视频或抖音号，AI 帮你选最合适的礼物
        </p>
      </div>

      {/* 上传区 */}
      <div className="px-5 mb-2">
        {previews.length === 0 ? (
          <button
            className="w-full relative overflow-hidden rounded-2xl transition-all active:scale-[0.99]"
            style={{ height: '110px', background: 'rgba(255,255,255,0.03)', border: '1.5px dashed rgba(255,255,255,0.12)' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <Camera size={18} color="rgba(255,255,255,0.35)" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: '2px' }}>上传照片或视频（可多选）</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>拍对方的日常、穿搭、桌面…</p>
              </div>
            </div>
          </button>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {previews.map((url, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden" style={{ width: '72px', height: '72px', flexShrink: 0 }}>
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setPreviews(p => p.filter((_, j) => j !== i))}>
                  <X size={10} color="#fff" strokeWidth={2.5} />
                </button>
              </div>
            ))}
            <button className="rounded-xl flex items-center justify-center" style={{ width: '72px', height: '72px', background: 'rgba(255,255,255,0.04)', border: '1.5px dashed rgba(255,255,255,0.12)', flexShrink: 0 }} onClick={() => fileInputRef.current?.click()}>
              <Plus size={20} color="rgba(255,255,255,0.3)" strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>

      {/* 抖音号输入条 */}
      <div className="px-5 mb-3">
        <div className="flex items-center gap-2.5 px-3.5" style={{ height: '38px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '11px' }}>
          <AtSign size={13} color="rgba(255,255,255,0.25)" />
          <input type="text" placeholder="或输入对方的抖音号" value={accountInput} onChange={e => setAccountInput(e.target.value)} className="flex-1 bg-transparent outline-none" style={{ fontSize: '13px', color: '#fff' }} />
        </div>
      </div>

      {/* 博主选择 */}
      <BloggerSelector selected={selectedBlogger} onSelect={setSelectedBlogger} autoMatched={initialBlogger} />

      {/* 照片/视频示范 — 轮播 */}
      <div className="px-5 mb-0">
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginBottom: '5px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          照片 / 视频示范
        </p>
        <div className="relative rounded-2xl overflow-hidden" style={{ height: '140px' }}>
          {EXAMPLE_CARDS.map((card, i) => (
            <div key={i} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: carouselIndex === i ? 1 : 0 }}>
              <img src={card.src} alt={card.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)' }} />
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <span className="inline-block px-2 py-0.5 rounded-full mb-1.5" style={{ fontSize: '10px', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)' }}>{card.scene}</span>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: '3px' }}>{card.title}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>{card.sub}</p>
              </div>
              <div className="absolute right-3 bottom-3">
                <span className="px-2 py-0.5 rounded-full" style={{ fontSize: '10px', background: 'rgba(254,44,85,0.25)', color: '#FE2C55', border: '1px solid rgba(254,44,85,0.3)' }}>{card.tag}</span>
              </div>
            </div>
          ))}
          <div className="absolute bottom-2.5 left-4 flex gap-1.5">
            {EXAMPLE_CARDS.map((_, i) => (
              <button key={i} onClick={() => setCarouselIndex(i)} style={{ width: carouselIndex === i ? '16px' : '5px', height: '5px', borderRadius: '9999px', background: carouselIndex === i ? '#fff' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s ease', border: 'none', padding: 0 }} />
            ))}
          </div>
        </div>
      </div>

      {/* 开始按钮 */}
      <div className="px-5 pb-6 pt-4">
        <button
          className="w-full btn-coral"
          disabled={!canStart}
          onClick={handleStart}
          style={{ height: '48px', fontSize: '15px', fontWeight: 700, opacity: canStart ? 1 : 0.32 }}
        >
          让 {selectedBlogger.avatar} {selectedBlogger.name} 帮我选
        </button>
      </div>

      {showPrivacy && (
        <PrivacyModal
          onConfirm={() => { setPreviews(prev => [...prev, ...pendingFileUrls]); setPendingFileUrls([]); setShowPrivacy(false); }}
          onCancel={() => { pendingFileUrls.forEach(url => URL.revokeObjectURL(url)); setPendingFileUrls([]); setShowPrivacy(false); }}
        />
      )}
    </div>
  );
}

// ─── 状态B：问题卡 ─────────────────────────────────────────────────────────────
function StateB({ thumbUrl, blogger, onNext }: { thumbUrl: string; blogger: Blogger; onNext: () => void }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({});

  const question = QUESTIONS[currentQ];
  const totalQ = QUESTIONS.length;
  const currentAnswers = answers[question.id] || [];
  const customVal = customValues[question.id] || '';
  const canNext = currentAnswers.length > 0 || customVal.trim().length > 0;
  const progress = ((currentQ + 1) / totalQ) * 100;

  const handleSelect = (option: string) => {
    setShowCustomInput(prev => ({ ...prev, [question.id]: false }));
    setAnswers(prev => {
      const cur = prev[question.id] || [];
      if (question.multiSelect) {
        return { ...prev, [question.id]: cur.includes(option) ? cur.filter(o => o !== option) : [...cur, option] };
      }
      return { ...prev, [question.id]: [option] };
    });
  };

  const handleCustomToggle = () => {
    setShowCustomInput(prev => ({ ...prev, [question.id]: !prev[question.id] }));
    setAnswers(prev => ({ ...prev, [question.id]: [] }));
  };

  const handleNext = () => {
    if (currentQ < totalQ - 1) setCurrentQ(currentQ + 1);
    else onNext();
  };

  return (
    <div className="flex flex-col h-full">
      {/* 顶部：博主头像 + 缩略图 + 进度 */}
      <div className="px-5 pt-1 pb-3 flex items-center gap-3 flex-shrink-0">
        <div className="relative flex-shrink-0">
          <img src={thumbUrl} alt="thumb" className="rounded-xl object-cover" style={{ width: '40px', height: '40px' }} />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
            {blogger.avatar}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>问题 {currentQ + 1} / {totalQ}</span>
            <span className="px-2 py-0.5 rounded-full" style={{ fontSize: '10px', fontWeight: 600, background: question.type === 'required' ? 'rgba(254,44,85,0.15)' : 'rgba(255,255,255,0.07)', color: question.type === 'required' ? '#FE2C55' : 'rgba(255,255,255,0.35)' }}>
              {question.type === 'required' ? '必答' : '选答'}
            </span>
          </div>
          <div className="w-full rounded-full overflow-hidden" style={{ height: '2px', background: 'rgba(255,255,255,0.07)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: '#FE2C55' }} />
          </div>
        </div>
      </div>

      {/* 问题文字 */}
      <div className="px-5 mb-4 flex-shrink-0">
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '5px' }}>{question.purpose}</p>
        <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{question.question}</h3>
      </div>

      {/* 选项区 */}
      <div className="flex-1 px-5 overflow-y-auto scrollbar-hide flex flex-col">
        <div className="flex flex-wrap gap-2.5 content-start mb-3">
          {question.options.map((option) => {
            const selected = currentAnswers.includes(option);
            return (
              <button key={option} onClick={() => handleSelect(option)} style={{ padding: '12px 20px', borderRadius: '14px', whiteSpace: 'nowrap', background: selected ? '#FE2C55' : 'rgba(255,255,255,0.07)', border: `1.5px solid ${selected ? '#FE2C55' : 'rgba(255,255,255,0.09)'}`, color: selected ? '#fff' : 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: selected ? 600 : 400, transition: 'all 0.18s cubic-bezier(0.23,1,0.32,1)', display: 'flex', alignItems: 'center', gap: '5px', transform: selected ? 'scale(1.02)' : 'scale(1)' }}>
                {selected && <Check size={12} strokeWidth={2.5} />}
                {option}
              </button>
            );
          })}
          {(question as { allowCustom?: boolean }).allowCustom && (
            <button onClick={handleCustomToggle} style={{ padding: '12px 20px', borderRadius: '14px', whiteSpace: 'nowrap', background: showCustomInput[question.id] ? 'rgba(254,44,85,0.12)' : 'rgba(255,255,255,0.07)', border: `1.5px solid ${showCustomInput[question.id] ? 'rgba(254,44,85,0.4)' : 'rgba(255,255,255,0.09)'}`, color: showCustomInput[question.id] ? '#FE2C55' : 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: 400, transition: 'all 0.18s cubic-bezier(0.23,1,0.32,1)' }}>
              自定义 ✏️
            </button>
          )}
        </div>
        {showCustomInput[question.id] && (question as { allowCustom?: boolean }).allowCustom && (
          <div className="mb-3">
            <input type="text" placeholder={(question as { customPlaceholder?: string }).customPlaceholder || '请输入...'} value={customVal} onChange={e => setCustomValues(prev => ({ ...prev, [question.id]: e.target.value }))} autoFocus className="w-full bg-transparent outline-none" style={{ height: '44px', padding: '0 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(254,44,85,0.3)', color: '#fff', fontSize: '14px' }} />
          </div>
        )}
        {!showCustomInput[question.id] && (
          <div className="flex-1 flex items-end pb-2">
            <div className="w-full rounded-2xl p-3.5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.22)', lineHeight: 1.6 }}>
                {question.type === 'required' ? '💡 此题为必答，请选择一个选项后继续' : '💡 此题可跳过，根据实际情况选择即可'}
                {question.multiSelect ? '（可多选）' : ''}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="px-5 pb-7 pt-4 flex gap-2.5 flex-shrink-0">
        {currentQ > 0 && (
          <button className="rounded-2xl flex items-center justify-center flex-shrink-0" style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.09)' }} onClick={() => setCurrentQ(currentQ - 1)}>
            <ChevronLeft size={18} color="rgba(255,255,255,0.6)" />
          </button>
        )}
        {question.type === 'optional' && !canNext && (
          <button className="flex-1 rounded-2xl" style={{ height: '48px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }} onClick={handleNext}>跳过</button>
        )}
        <button className="flex-1 btn-coral" disabled={!canNext} style={{ height: '48px', fontSize: '15px', fontWeight: 700, opacity: canNext ? 1 : 0.3 }} onClick={handleNext}>
          {currentQ === totalQ - 1 ? '生成报告 ✨' : '下一题'}
        </button>
      </div>
    </div>
  );
}

// ─── 状态C：博主碎碎念气泡流 ──────────────────────────────────────────────────
function StateC({ thumbUrl, blogger, onDone }: { thumbUrl: string; blogger: Blogger; onDone: () => void }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const bubbles = blogger.thinkingBubbles;

  const typeMessage = useCallback((msg: string, onComplete: () => void) => {
    setIsTyping(true);
    setTypingText('');
    let i = 0;
    const tick = () => {
      i++;
      setTypingText(msg.slice(0, i));
      if (i < msg.length) {
        setTimeout(tick, 28 + Math.random() * 20); // 模拟真人打字节奏
      } else {
        setIsTyping(false);
        onComplete();
      }
    };
    setTimeout(tick, 28);
  }, []);

  useEffect(() => {
    if (visibleCount >= bubbles.length) {
      setTimeout(onDone, 800);
      return;
    }
    // 打字完成后等一会儿再显示下一条
    const delay = visibleCount === 0 ? 400 : 600 + Math.random() * 400;
    const t = setTimeout(() => {
      typeMessage(bubbles[visibleCount], () => {
        setTimeout(() => {
          setVisibleCount(c => c + 1);
          setTypingText('');
        }, 300);
      });
    }, delay);
    return () => clearTimeout(t);
  }, [visibleCount, bubbles, typeMessage, onDone]);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount, typingText]);

  const progress = Math.round(((visibleCount) / bubbles.length) * 100);

  return (
    <div className="flex flex-col h-full">
      {/* 博主信息头 */}
      <div className="px-5 pt-2 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* 博主大头像 */}
          <div className="relative flex-shrink-0">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ background: 'rgba(254,44,85,0.1)', border: '2px solid rgba(254,44,85,0.3)' }}
            >
              {blogger.avatar}
            </div>
            {/* 在线绿点 */}
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full" style={{ background: '#4ade80', border: '2px solid #000' }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{blogger.name}</p>
              <span style={{ fontSize: '10px', color: '#FE2C55', background: 'rgba(254,44,85,0.12)', padding: '2px 7px', borderRadius: '9999px', border: '1px solid rgba(254,44,85,0.2)' }}>
                正在分析
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{blogger.tagline}</p>
          </div>
          {/* 缩略图 */}
          <img src={thumbUrl} alt="thumb" className="rounded-xl object-cover flex-shrink-0" style={{ width: '40px', height: '40px' }} />
        </div>
      </div>

      {/* 分隔线 */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '8px', flexShrink: 0 }} />

      {/* 气泡消息流 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide px-5 flex flex-col gap-2.5 pb-3">
        {/* 已完成的气泡 */}
        {bubbles.slice(0, visibleCount).map((msg, i) => (
          <div
            key={i}
            className="flex items-end gap-2.5"
            style={{ animation: 'fadeSlideUp 0.3s cubic-bezier(0.23,1,0.32,1) both' }}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
              {blogger.avatar}
            </div>
            <div
              className="rounded-2xl rounded-bl-sm px-3.5 py-2.5 max-w-[82%]"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.55 }}>{msg}</p>
            </div>
          </div>
        ))}

        {/* 正在打字的气泡 */}
        {(isTyping || typingText) && (
          <div className="flex items-end gap-2.5" style={{ animation: 'fadeSlideUp 0.2s cubic-bezier(0.23,1,0.32,1) both' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: 'rgba(254,44,85,0.12)', border: '1px solid rgba(254,44,85,0.2)' }}>
              {blogger.avatar}
            </div>
            <div
              className="rounded-2xl rounded-bl-sm px-3.5 py-2.5 max-w-[82%]"
              style={{ background: 'rgba(254,44,85,0.08)', border: '1px solid rgba(254,44,85,0.18)' }}
            >
              <p style={{ fontSize: '13px', color: '#fff', lineHeight: 1.55 }}>
                {typingText}
                <span style={{ display: 'inline-block', width: '1.5px', height: '13px', background: '#FE2C55', marginLeft: '2px', verticalAlign: 'middle', animation: 'pulse-glow 0.7s ease-in-out infinite' }} />
              </p>
            </div>
          </div>
        )}

        {/* 等待下一条时的"..."气泡 */}
        {!isTyping && !typingText && visibleCount < bubbles.length && (
          <div className="flex items-end gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
              {blogger.avatar}
            </div>
            <div className="rounded-2xl rounded-bl-sm px-4 py-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-1 items-center" style={{ height: '14px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)', animation: `pulse-glow 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 进度条 */}
      <div className="px-5 pb-7 pt-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)' }}>选品进度</span>
          <span style={{ fontSize: '11px', color: '#FE2C55', fontWeight: 600 }}>{progress}%</span>
        </div>
        <div className="w-full rounded-full overflow-hidden" style={{ height: '3px', background: 'rgba(255,255,255,0.07)' }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #FE2C55 0%, #ff6b6b 100%)' }} />
        </div>
      </div>
    </div>
  );
}

// ─── 状态D：博主署名报告 ──────────────────────────────────────────────────────
function StateD({ thumbUrl, blogger, onReAnalyze }: { thumbUrl: string; blogger: Blogger; onReAnalyze: () => void }) {
  const [activeTab, setActiveTab] = useState<'report' | 'analysis'>('report');

  // 根据博主偏好品类筛选展示顺序
  const sortedCategories = [...GIFT_REPORT.categories].sort((a, b) => {
    const aIdx = blogger.preferCategories.indexOf(a.id);
    const bIdx = blogger.preferCategories.indexOf(b.id);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  const getBloggerComment = (productId: string) =>
    blogger.productComments.find(c => c.productId === productId)?.comment;

  return (
    <div className="flex flex-col h-full">
      {/* Tab 条 */}
      <div className="flex items-center px-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', paddingTop: '4px' }}>
        <img src={thumbUrl} alt="thumb" className="rounded-lg object-cover flex-shrink-0 mr-3" style={{ width: '30px', height: '30px' }} />
        {(['report', 'analysis'] as const).map((tab) => (
          <button key={tab} className="relative py-3 mr-5" onClick={() => setActiveTab(tab)}>
            <span style={{ fontSize: '14px', fontWeight: activeTab === tab ? 700 : 400, color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.35)', transition: 'all 0.2s' }}>
              {tab === 'report' ? '报告' : '分析'}
            </span>
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#FE2C55' }} />}
          </button>
        ))}
      </div>

      {/* 报告内容 */}
      {activeTab === 'report' && (
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* ── 博主署名卡 ── */}
          <div className="mx-5 mt-4 mb-4 rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(254,44,85,0.1) 0%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(254,44,85,0.2)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'rgba(254,44,85,0.12)', border: '1.5px solid rgba(254,44,85,0.25)' }}>
                {blogger.avatar}
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#FE2C55' }}>{blogger.name}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>为你出具的专属选礼报告</p>
              </div>
              <div className="ml-auto">
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '9999px' }}>
                  {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
            {/* 博主开场语 */}
            <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.25)' }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, fontStyle: 'italic' }}>
                "{blogger.reportIntro}"
              </p>
            </div>
          </div>

          {/* ── 人物画像卡 ── */}
          <div className="mx-5 mb-5 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(37,244,238,0.06) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(37,244,238,0.12)' }}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>人物画像</p>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '28px', lineHeight: 1 }}>{GIFT_REPORT.personaEmoji}</span>
                    <span style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{GIFT_REPORT.personaTitle}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 items-end">
                  {GIFT_REPORT.keywords.slice(0, 2).map(kw => (
                    <span key={kw} className="px-2.5 py-0.5 rounded-full" style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(37,244,238,0.1)', color: '#00F2EA', border: '1px solid rgba(37,244,238,0.2)' }}>
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {GIFT_REPORT.keywords.map(kw => (
                  <span key={kw} className="px-2.5 py-1 rounded-full" style={{ fontSize: '12px', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    # {kw}
                  </span>
                ))}
              </div>
              {/* 博主视角点评 */}
              <div className="flex items-start gap-2">
                <span style={{ fontSize: '14px', flexShrink: 0 }}>{blogger.avatar}</span>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, fontStyle: 'italic' }}>
                  {GIFT_REPORT.portrait}
                </p>
              </div>
            </div>
          </div>

          {/* ── 礼物分类（按博主偏好排序） ── */}
          {sortedCategories.map((cat, catIdx) => (
            <div key={cat.id} className="mb-5">
              <div className="px-5 flex items-center gap-2 mb-1">
                <span style={{ fontSize: '18px' }}>{cat.icon}</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{cat.title}</span>
                {catIdx < blogger.preferCategories.length && (
                  <span className="px-2 py-0.5 rounded-full" style={{ fontSize: '10px', background: 'rgba(254,44,85,0.12)', color: '#FE2C55', border: '1px solid rgba(254,44,85,0.2)' }}>
                    {blogger.name} 推荐
                  </span>
                )}
                <span className="ml-auto px-2 py-0.5 rounded-full" style={{ fontSize: '10px', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' }}>
                  {cat.products.length} 件
                </span>
              </div>
              <div className="mx-5 mb-3 pl-3" style={{ borderLeft: '2px solid rgba(254,44,85,0.35)' }}>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{cat.whyLike}</p>
              </div>
              <div className="flex flex-col gap-2.5 px-5">
                {cat.products.map((product) => {
                  const bloggerComment = getBloggerComment(product.id);
                  return (
                    <a key={product.id} href={product.douyinUrl} target="_blank" rel="noopener noreferrer" className="block rounded-2xl overflow-hidden transition-all active:scale-[0.98]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', textDecoration: 'none' }}>
                      <div className="flex gap-3 p-3">
                        <img src={product.imageUrl} alt={product.name} className="rounded-xl object-cover flex-shrink-0" style={{ width: '72px', height: '72px' }} />
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', lineHeight: 1.3, marginBottom: '3px' }}>{product.name}</p>
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '5px' }}>
                            {product.reason}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#FE2C55' }}>¥{product.price}</span>
                            <span className="px-1.5 py-0.5 rounded-full" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.38)', background: 'rgba(255,255,255,0.06)' }}>{product.bloggerCount}位博主推荐</span>
                            <span className="px-1.5 py-0.5 rounded-full" style={{ fontSize: '10px', color: '#4ade80', background: 'rgba(74,222,128,0.1)' }}>好评{product.goodRate}%</span>
                          </div>
                        </div>
                      </div>
                      {/* 博主口吻短评 */}
                      {bloggerComment && (
                        <div className="flex items-start gap-2 px-3 pb-2.5 pt-0">
                          <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>{blogger.avatar}</span>
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.55, fontStyle: 'italic' }}>
                            {bloggerComment}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-center gap-1.5 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <ExternalLink size={10} color="rgba(255,255,255,0.3)" />
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>在抖音查看</span>
                        <ChevronRight size={10} color="rgba(255,255,255,0.22)" />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
          <div style={{ height: '24px' }} />
        </div>
      )}

      {/* 分析视图 */}
      {activeTab === 'analysis' && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-5">
          <div className="text-center">
            <div className="text-4xl mb-3">🔄</div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>换个博主再分析？</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              上传新的照片或视频，<br />选择不同博主获取不同风格的推荐
            </p>
          </div>
          <button className="btn-coral" onClick={onReAnalyze} style={{ height: '48px', fontSize: '15px', fontWeight: 700, padding: '0 40px', borderRadius: '14px' }}>
            重新上传分析
          </button>
          <button onClick={() => setActiveTab('report')} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none' }}>
            返回查看报告
          </button>
        </div>
      )}
    </div>
  );
}

// ─── 主组件 ──────────────────────────────────────────────────────────────────
export default function GiftFinderSheet({ isOpen, onClose, initialBlogger }: GiftFinderSheetProps) {
  const [state, setState] = useState<SheetState>('A');
  const [thumbUrl, setThumbUrl] = useState<string>(IMAGES.videoThumb1);
  const [selectedBlogger, setSelectedBlogger] = useState<Blogger>(initialBlogger || BLOGGERS[0]);
  const [isExpanded, setIsExpanded] = useState(false);
  const dragStartY = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setState('A');
      setIsExpanded(false);
      if (initialBlogger) setSelectedBlogger(initialBlogger);
    }
  }, [isOpen, initialBlogger]);

  const handleDragStart = (e: React.TouchEvent) => { dragStartY.current = e.touches[0].clientY; };
  const handleDragEnd = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const delta = dragStartY.current - e.changedTouches[0].clientY;
    if (delta > 50) setIsExpanded(true);
    if (delta < -50) setIsExpanded(false);
    dragStartY.current = null;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="absolute inset-0 z-40" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose} />
      <div
        className="absolute bottom-0 left-0 right-0 z-50 half-sheet flex flex-col"
        style={{
          height: isExpanded ? '100%' : '74%',
          animation: 'slideUp 0.38s cubic-bezier(0.23,1,0.32,1) both',
          transition: 'height 0.3s cubic-bezier(0.23,1,0.32,1)',
        }}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
      >
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-9 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
        </div>
        <button
          className="absolute top-3.5 right-4 w-7 h-7 rounded-full flex items-center justify-center z-10"
          style={{ background: 'rgba(255,255,255,0.09)' }}
          onClick={onClose}
        >
          <X size={14} color="rgba(255,255,255,0.7)" strokeWidth={2} />
        </button>

        <div className="flex-1 min-h-0 overflow-hidden">
          {state === 'A' && (
            <StateA
              initialBlogger={selectedBlogger}
              onNext={(thumb, blogger) => { setThumbUrl(thumb); setSelectedBlogger(blogger); setState('B'); }}
            />
          )}
          {state === 'B' && (
            <StateB thumbUrl={thumbUrl} blogger={selectedBlogger} onNext={() => setState('C')} />
          )}
          {state === 'C' && (
            <StateC thumbUrl={thumbUrl} blogger={selectedBlogger} onDone={() => setState('D')} />
          )}
          {state === 'D' && (
            <StateD thumbUrl={thumbUrl} blogger={selectedBlogger} onReAnalyze={() => setState('A')} />
          )}
        </div>
      </div>
    </>
  );
}
