"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  GiftStrategy,
  Offer,
  VideoItem,
  VisualAnalysis,
} from "@/server/ai/types";

type GiftResult = {
  offerId: string;
  strategy: GiftStrategy;
  reason: string;
  evidence: string[];
  caveat: string | null;
  offer: Offer;
  videos: VideoItem[];
};

type RecommendResponse = {
  status: "completed" | "no_candidates";
  analysis: VisualAnalysis;
  summary?: string;
  gifts?: GiftResult[];
  message?: string;
  timings?: {
    visualMs: number;
    recallMs: number;
    selectionMs?: number;
    totalMs: number;
  };
  error?: string;
};

type SheetStage = "input" | "loading" | "result";
type IntentContext = {
  source: "gift_advice" | "product_inspiration" | "manual";
  eyebrow: string;
  title: string;
  description: string;
  clue: string;
};

const feedVideos = [
  {
    id: "guide",
    src: "/videos/feed-gift-guide.m4v",
    author: "恋爱观察室",
    avatar: "礼",
    description: "送礼不是越贵越好，真正重要的是有没有看见 TA。",
    tags: ["#送礼攻略", "#恋爱技巧", "#生日礼物"],
    likes: "8.7万",
    comments: "1924",
    shares: "5.2万",
    prompt: "正在纠结送什么？",
    triggerMode: "auto",
    intent: {
      source: "gift_advice",
      eyebrow: "识别到送礼意图",
      title: "你正在看送礼攻略",
      description: "不照抄清单，让 AI 从 TA 的视觉线索里选",
      clue: "用户从一条送礼攻略视频进入；攻略仅用于理解送礼意图，不默认采用视频中的商品清单",
    },
  },
  {
    id: "handmade",
    src: "/videos/feed-handmade.m4v",
    author: "晚安梵梵",
    avatar: "梵",
    description: "一个人送给另一个人最珍贵的礼物，是时间。",
    tags: ["#手工DIY", "#礼物", "#我们俩"],
    likes: "12.4万",
    comments: "3281",
    shares: "8.9万",
    prompt: "想把这份灵感送给 TA？",
    triggerMode: "pause",
    intent: {
      source: "product_inspiration",
      eyebrow: "捕捉到好物灵感",
      title: "你停下来看了这件手作",
      description: "把它当线索，继续找更适合 TA 的礼物",
      clue: "用户在一条双人手作好物视频上主动暂停；该内容只作为礼物灵感，不默认推荐同款",
    },
  },
  {
    id: "for-him",
    src: "/videos/feed-gift-for-him.m4v",
    author: "酥小橙",
    avatar: "橙",
    description: "这些礼物让男朋友傻笑了三天，但每个人喜欢的真的不一样。",
    tags: ["#送男生礼物", "#恋爱助攻", "#七夕"],
    likes: "23.1万",
    comments: "6847",
    shares: "15.3万",
    prompt: "别抄清单，直接读懂 TA",
    triggerMode: "auto",
    intent: {
      source: "gift_advice",
      eyebrow: "识别到送礼意图",
      title: "你正在看送男友礼物",
      description: "每个人都不同，从 TA 的真实线索开始",
      clue: "用户从一条送男友礼物视频进入；视频仅提供关系和场景上下文，不默认采用其中的商品",
    },
  },
] as const;

const manualIntent: IntentContext = {
  source: "manual",
  eyebrow: "抖音 AI 入口",
  title: "为重要的人认真选一次",
  description: "选择好友或上传一张生活切片",
  clue: "用户从抖音 AI 选礼入口主动进入",
};

const demoFriends = [
  {
    id: "yuan",
    name: "阿远",
    handle: "@yuan_is_playing",
    avatar: "远",
    note: "游戏 · 科幻 · 桌搭",
    image: "/demo-friend-gaming.jpg",
    workCount: 6,
  },
  {
    id: "chuan",
    name: "川川",
    handle: "@film_with_chuan",
    avatar: "川",
    note: "胶片 · 城市散步 · 影像",
    image: "/demo-friend-photo.jpg",
    workCount: 9,
  },
  {
    id: "xiaoyue",
    name: "小月",
    handle: "@moonlight_life",
    avatar: "月",
    note: "香氛 · 阅读 · 生活方式",
    image: "/demo-friend-fragrance.jpg",
    workCount: 5,
  },
] as const;

const occasions = [
  "生日",
  "纪念日",
  "七夕",
  "日常惊喜",
  "毕业",
] as const;
const budgetOptions = [
  { label: "¥0–300", min: 0, max: 300 },
  { label: "¥100–800", min: 100, max: 800 },
  { label: "¥500–1500", min: 500, max: 1500 },
] as const;
const relationships = ["情侣", "朋友", "家人", "同事", "同学"] as const;
const giftCompanions = [
  {
    id: "mentor",
    emoji: "💼",
    name: "大厂 Mentor",
    description: "职场送礼的分寸和质感",
    intro:
      "来自互联网大厂的送礼经验，擅长把那些不说破的人情分寸，变成恰到好处的礼物建议。不会只看价格，更会先判断关系距离、使用场景和对方的表达偏好。",
    strengths: ["入职与晋升", "重要合作", "低调有质感"],
    approach: [
      "先判断礼物该传递感谢、祝贺还是建立信任",
      "优先选高频能用、但不显得过度私人化的好物",
      "避开品牌露出太强或价值感难拿捏的选择",
    ],
    mockVideos: ["不贵但很有分量的升职礼物", "送同事不踩雷的桌面好物"],
  },
  {
    id: "girlfriend",
    emoji: "🎀",
    name: "女友好物搭子",
    description: "小众、好看又有心意",
    intro:
      "长期关注小众生活方式内容，知道礼物的心意常常藏在颜色、质感和使用瞬间里。会帮你避开“看起来很贵但她不会用”的东西，找到真正贴近她日常的小惊喜。",
    strengths: ["纪念日心意", "氛围感好物", "不撞款礼物"],
    approach: [
      "从她的穿搭、房间和收藏里找审美线索",
      "用细节感和专属感替代过度隆重的仪式感",
      "优先推荐有故事、能融入日常的礼物",
    ],
    mockVideos: ["把日常变成礼物的 3 个小众好物", "女友会反复用的精致礼物"],
  },
  {
    id: "jiahao",
    emoji: "✨",
    name: "嘉豪好物雷达",
    description: "跟着嘉豪发现有趣好物",
    intro:
      "从嘉豪式的真实体验内容里提炼出“有趣但不鸡肋”的选礼方法。它特别会识别让人忍不住上手、分享或立刻用起来的产品，把预算花在真正能带来惊喜的细节上。",
    strengths: ["新奇有趣", "实用主义", "日常惊喜"],
    approach: [
      "先看产品是否能马上带来一个好玩的使用瞬间",
      "在新奇和实用之间保留恰好的平衡",
      "优先推荐容易讲出“为什么想到送这个”的好物",
    ],
    mockVideos: ["最近让人眼前一亮的实用好物", "预算不高也能送出惊喜"],
  },
] as const;

const loadingStages = [
  ["正在看 TA 的公开线索", "识别兴趣、审美和已经拥有的物品"],
  ["正在拆解“为什么会喜欢”", "区分稳定兴趣与偶然入镜"],
  ["正在匹配礼物与本地体验", "结合预算、场合和重庆供给"],
  ["正在核对买错风险", "过滤重复物品与不相关内容"],
] as const;

const strategyMeta: Record<
  GiftStrategy,
  { label: string; short: string; icon: string }
> = {
  interest_direct: {
    label: "兴趣直击",
    short: "沿着 TA 已经喜欢的方向",
    icon: "↗",
  },
  interest_adjacent: {
    label: "相邻兴趣",
    short: "不重复已有物的聪明延伸",
    icon: "≈",
  },
  shared_experience: {
    label: "一起体验",
    short: "把兴趣变成两个人的记忆",
    icon: "∞",
  },
};

type IconName =
  | "at"
  | "back"
  | "camera"
  | "check"
  | "close"
  | "comment"
  | "external"
  | "gift"
  | "heart"
  | "home"
  | "music"
  | "play"
  | "plus"
  | "refresh"
  | "search"
  | "share"
  | "spark"
  | "user";

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    at: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M16.5 15.5c-1.2 1-2.7.3-2.7-.9V9.4" />
        <circle cx="11.2" cy="12" r="3.1" />
      </>
    ),
    back: (
      <>
        <path d="m15 5-7 7 7 7" />
        <path d="M8 12h11" />
      </>
    ),
    camera: (
      <>
        <path d="M4 7.5h3l1.4-2h7.2l1.4 2h3v11H4Z" />
        <circle cx="12" cy="13" r="3.3" />
      </>
    ),
    check: <path d="m5 12.5 4.2 4L19 7" />,
    close: (
      <>
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </>
    ),
    comment: <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 9.3 9.3 0 0 1-4-.9L4 20l1.3-3.8A7.7 7.7 0 1 1 20 11.5Z" />,
    external: (
      <>
        <path d="M13 5h6v6" />
        <path d="m11 13 8-8" />
        <path d="M19 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5H10" />
      </>
    ),
    gift: (
      <>
        <path d="M4 10h16v10H4Z" />
        <path d="M3 7h18v3H3Z" />
        <path d="M12 7v13" />
        <path d="M12 7c-2.4 0-5-1-5-3 0-1.1.9-2 2-2 2 0 3 3 3 5Zm0 0c2.4 0 5-1 5-3 0-1.1-.9-2-2-2-2 0-3 3-3 5Z" />
      </>
    ),
    heart: <path d="M20.8 8.7c0 5-8.8 10.2-8.8 10.2S3.2 13.7 3.2 8.7A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.8 2.3Z" />,
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </>
    ),
    music: (
      <>
        <path d="M9 18V6l10-2v12" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="16.5" cy="16" r="2.5" />
      </>
    ),
    play: <path d="m9 7 8 5-8 5Z" />,
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M19 12a7 7 0 1 0-1.7 4.6" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 4 4" />
      </>
    ),
    share: (
      <>
        <circle cx="18" cy="5" r="2" />
        <circle cx="6" cy="12" r="2" />
        <circle cx="18" cy="19" r="2" />
        <path d="m8 11 8-5" />
        <path d="m8 13 8 5" />
      </>
    ),
    spark: (
      <>
        <path d="M12 2.5c.5 4.6 2.9 7 7.5 7.5-4.6.5-7 2.9-7.5 7.5-.5-4.6-2.9-7-7.5-7.5 4.6-.5 7-2.9 7.5-7.5Z" />
        <path d="M19 16.5c.2 2 1.3 3.1 3.3 3.3-2 .2-3.1 1.3-3.3 3.2-.2-1.9-1.3-3-3.3-3.2 2-.2 3.1-1.3 3.3-3.3Z" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21c.8-4.2 3.3-6.4 7.5-6.4s6.7 2.2 7.5 6.4" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      >
        {paths[name]}
      </g>
    </svg>
  );
}

function FeedAction({
  icon,
  value,
}: {
  icon: "heart" | "comment" | "share";
  value: string;
}) {
  return (
    <button
      className="feed-action"
      onClick={(event) => event.stopPropagation()}
      type="button"
    >
      <span>
        <Icon name={icon} size={27} />
      </span>
      <small>{value}</small>
    </button>
  );
}

function FeedVideoSlide({
  video,
  active,
  onOpen,
}: {
  video: (typeof feedVideos)[number];
  active: boolean;
  onOpen: (context: IntentContext) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    if (active && !paused) {
      element.play().catch(() => undefined);
      return;
    }
    element.pause();
    if (!active) {
      element.currentTime = 0;
    }
  }, [active, paused]);

  // 统一：仅暂停时显示气泡，播放/恢复时立即消失
  const promptVisible = active && paused;

  return (
    <section
      className="video-slide"
      onClick={() => {
        if (!active) return;
        setPaused((value) => !value);
      }}
    >
      <video
        autoPlay={active}
        className="feed-video"
        loop
        muted
        playsInline
        preload={active ? "auto" : "metadata"}
        ref={videoRef}
        src={video.src}
      />
      <div className="feed-shade" />
      {paused && (
        <span className="pause-indicator" aria-hidden="true">
          <i />
          <i />
        </span>
      )}
      <div className="video-actions">
        <button
          className="avatar-action"
          onClick={(event) => event.stopPropagation()}
          type="button"
        >
          <span>{video.avatar}</span>
          <i>
            <Icon name="plus" size={10} />
          </i>
        </button>
        <FeedAction icon="heart" value={video.likes} />
        <FeedAction icon="comment" value={video.comments} />
        <FeedAction icon="share" value={video.shares} />
        <span className="music-disc">
          <Icon name="music" size={18} />
        </span>
      </div>
      <div className="feed-copy">
        <strong>@{video.author}</strong>
        <p>{video.description}</p>
        <div>
          {video.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
      {promptVisible && (
        <button
          className="gift-capsule"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(video.intent);
          }}
          type="button"
        >
          <span>
            <Icon name="spark" size={16} />
          </span>
          <div>
            <small>{video.intent.eyebrow}</small>
            <strong>{video.prompt}</strong>
          </div>
          <b>帮我选</b>
        </button>
      )}
    </section>
  );
}

function VideoFeed({
  onOpen,
}: {
  onOpen: (context: IntentContext) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () =>
      setActiveIndex(Math.round(container.scrollTop / container.clientHeight));
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="video-feed" ref={containerRef}>
      {feedVideos.map((video, index) => (
        <FeedVideoSlide
          active={activeIndex === index}
          key={video.id}
          onOpen={onOpen}
          video={video}
        />
      ))}
    </div>
  );
}

function DouyinChrome({
  onOpen,
}: {
  onOpen: (context: IntentContext) => void;
}) {
  return (
    <>
      <div className="dynamic-island" aria-hidden="true">
        <span />
        <i />
      </div>
      <div className="status-bar">
        <strong>9:41</strong>
        <span>5G&nbsp;&nbsp;◒&nbsp;▰</span>
      </div>
      <div className="feed-top-nav">
        <button type="button">关注</button>
        <button className="active" type="button">
          推荐
        </button>
        <button aria-label="搜索" className="top-search" type="button">
          <Icon name="search" size={22} />
        </button>
      </div>
      <nav className="douyin-bottom-nav" aria-label="抖音底部导航">
        <button className="active" type="button">
          <Icon name="home" size={21} />
          <span>首页</span>
        </button>
        <button type="button">
          <Icon name="user" size={21} />
          <span>朋友</span>
        </button>
        <button
          aria-label="打开 AI 选礼"
          className="douyin-create"
          onClick={() => onOpen(manualIntent)}
          type="button"
        >
          <Icon name="gift" size={23} />
        </button>
        <button type="button">
          <Icon name="comment" size={21} />
          <span>消息</span>
        </button>
        <button type="button">
          <Icon name="user" size={21} />
          <span>我</span>
        </button>
      </nav>
    </>
  );
}

function offerAction(offer: Offer) {
  if (offer.sourceUrl.includes("douyin.com")) {
    return {
      label: offer.kind === "experience" ? "查看抖音团购" : "在抖音查看",
      url: offer.sourceUrl,
    };
  }
  return {
    label: "搜抖音同类",
    url: `https://www.douyin.com/search/${encodeURIComponent(offer.title)}`,
  };
}

function parseCustomBudget(value: string) {
  const values = value.replace(/[¥￥,\s]/g, "").match(/\d+/g);
  if (!values?.length) return null;
  const [first, second] = values.map(Number);
  if (!Number.isFinite(first)) return null;
  if (!second) return { min: 0, max: first };
  return first < second ? { min: first, max: second } : { min: second, max: first };
}

export default function GiftWorkbench() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [stage, setStage] = useState<SheetStage>("input");
  const [file, setFile] = useState<File | null>(null);
  const [occasion, setOccasion] = useState<(typeof occasions)[number] | "自定义">(
    "生日",
  );
  const [budgetIndex, setBudgetIndex] = useState(1);
  const [friendHandle, setFriendHandle] = useState("");
  const [companionId, setCompanionId] = useState("mentor");
  const [detailCompanionId, setDetailCompanionId] = useState<string | null>(
    null,
  );
  const [customOccasion, setCustomOccasion] = useState("");
  const [customBudget, setCustomBudget] = useState("");
  const [relationship, setRelationship] =
    useState<(typeof relationships)[number] | "自定义">("情侣");
  const [customRelationship, setCustomRelationship] = useState("");
  const [clueContext, setClueContext] = useState("");
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [error, setError] = useState("");
  const [intentContext, setIntentContext] =
    useState<IntentContext>(manualIntent);

  const selectedFriend = demoFriends[0];
  const uploadPreview = useMemo(
    () => (file ? URL.createObjectURL(file) : ""),
    [file],
  );
  const activePreview = uploadPreview || selectedFriend.image;
  const detailCompanion = giftCompanions.find(
    (companion) => companion.id === detailCompanionId,
  );

  useEffect(
    () => () => {
      if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    },
    [uploadPreview],
  );

  useEffect(() => {
    if (stage !== "loading") return;
    const timer = window.setInterval(
      () => setLoadingIndex((current) => Math.min(current + 1, 3)),
      2200,
    );
    return () => window.clearInterval(timer);
  }, [stage]);

  function openGiftFinder(context: IntentContext) {
    setIntentContext(context);
    setSheetOpen(true);
    if (stage === "result" && !result) setStage("input");
  }

  function acceptFile(nextFile?: File) {
    if (!nextFile) return;
    if (!nextFile.type.startsWith("image/")) {
      setError("当前 Demo 先支持 JPG、PNG、WebP 图片");
      return;
    }
    if (nextFile.size > 5 * 1024 * 1024) {
      setError("图片请控制在 5MB 以内");
      return;
    }
    setFile(nextFile);
    setResult(null);
    setError("");
  }

  async function friendImageAsFile() {
    const response = await fetch(selectedFriend.image);
    if (!response.ok) throw new Error("示例好友素材读取失败");
    const blob = await response.blob();
    return new File([blob], `${selectedFriend.name}-公开作品.jpg`, {
      type: blob.type || "image/jpeg",
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("先上传一张 TA 的桌面、房间、穿搭或公开作品截图");
      return;
    }

    const budget =
      budgetIndex === -1
        ? parseCustomBudget(customBudget)
        : budgetOptions[budgetIndex];
    if (!budget || budget.max <= budget.min) {
      setError("请输入有效预算，例如 ¥300–500");
      return;
    }

    setError("");
    setResult(null);
    setLoadingIndex(0);
    setStage("loading");

    try {
      const analysisFile = file || (await friendImageAsFile());
      if (!analysisFile) throw new Error("没有可分析的视觉线索");
      const form = new FormData();
      form.append("image", analysisFile);
      form.append(
        "occasion",
        occasion === "自定义" ? customOccasion || "自定义场合" : occasion,
      );
      form.append("budgetMin", String(budget.min));
      form.append("budgetMax", String(budget.max));
      form.append("city", "重庆");
      form.append(
        "clueContext",
        [
          friendHandle || selectedFriend.handle
            ? `送礼对象抖音号为 ${friendHandle || selectedFriend.handle}，素材来自模拟公开作品`
            : "素材来自用户主动上传的伴侣生活场景",
          intentContext.clue,
          `用户与送礼对象的关系：${
            relationship === "自定义"
              ? customRelationship || "未说明"
              : relationship
          }`,
          `已选择的送礼搭子：${
            giftCompanions.find((companion) => companion.id === companionId)
              ?.name || "未选择"
          }`,
          clueContext,
        ]
          .filter(Boolean)
          .join("；"),
      );

      const response = await fetch("/api/recommend", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as RecommendResponse;
      if (!response.ok || payload.error) {
        throw new Error(payload.error || "推荐生成失败");
      }
      setResult(payload);
      setStage("result");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "AI 暂时没有读懂，换一张更清晰的图片试试",
      );
      setStage("input");
    }
  }

  function reset() {
    setResult(null);
    setFile(null);
    setError("");
    setStage("input");
  }

  return (
    <main className="douyin-demo">
      <div className="iphone-device">
        <span className="iphone-button iphone-silent" />
        <span className="iphone-button iphone-volume-up" />
        <span className="iphone-button iphone-volume-down" />
        <span className="iphone-button iphone-power" />
        <div className="phone-shell">
          <VideoFeed onOpen={openGiftFinder} />
          <DouyinChrome onOpen={openGiftFinder} />

          {sheetOpen && (
          <>
            <button
              aria-label="关闭 AI 选礼"
              className="sheet-backdrop"
              onClick={() => setSheetOpen(false)}
              type="button"
            />
            <section
              className={`gift-sheet gift-sheet-${stage}`}
              aria-label="抖音 AI 选礼"
            >
              <div className="sheet-handle" />
              <header className="sheet-header">
                {stage === "result" ? (
                  <button aria-label="返回重新分析" onClick={reset} type="button">
                    <Icon name="back" size={20} />
                  </button>
                ) : (
                  <span className="sheet-logo">
                    <Icon name="spark" size={16} />
                  </span>
                )}
                <div>
                  <strong>AI 选礼</strong>
                  <small>抖音视觉搜索</small>
                </div>
                <button
                  aria-label="关闭"
                  className="sheet-close"
                  onClick={() => setSheetOpen(false)}
                  type="button"
                >
                  <Icon name="close" size={18} />
                </button>
              </header>

              {stage === "input" && (
                <>
                <form className="sheet-scroll input-flow" onSubmit={submit}>
                  <div className="recipient-field">
                    <span>送给谁？</span>
                    <label>
                      <Icon name="at" size={17} />
                      <input
                        aria-label="抖音好友或抖音号"
                        onChange={(event) => setFriendHandle(event.target.value)}
                        placeholder="输入抖音号或 @ 提及好友"
                        value={friendHandle}
                      />
                    </label>
                  </div>

                  {/* 上传区（常驻）*/}
                  <div className="upload-section">
                    <input
                      accept="image/jpeg,image/png,image/webp"
                      hidden
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        acceptFile(event.target.files?.[0])
                      }
                      ref={fileInputRef}
                      type="file"
                    />
                    <button
                      className={uploadPreview ? "has-preview" : ""}
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      {uploadPreview ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt="准备分析的视觉线索" src={uploadPreview} />
                          <span>换一张</span>
                        </>
                      ) : (
                        <>
                          <i>
                            <Icon name="camera" size={22} />
                          </i>
                          <strong>拍一张，或从相册选择</strong>
                          <small>桌面 / 房间 / 穿搭 / 公开作品截图</small>
                        </>
                      )}
                    </button>
                    <p>图片只用于本次分析，不建立长期画像</p>
                  </div>

                  {/* 博主选择（常驻）*/}
                  <div className="friend-section">
                    <div className="section-title">
                      <div>
                        <strong>挑个懂送礼的搭子</strong>
                        <small>博主选礼经验整理成不同专长的搭子</small>
                      </div>
                    </div>
                    <div className="companion-list">
                      {giftCompanions.map((companion) => (
                        <button
                          className={
                            companionId === companion.id ? "selected" : ""
                          }
                          key={companion.id}
                          onClick={() => setDetailCompanionId(companion.id)}
                          type="button"
                        >
                          <span aria-hidden="true">{companion.emoji}</span>
                          <div>
                            <strong>{companion.name}</strong>
                            <small>{companion.description}</small>
                          </div>
                          <i>
                            {companionId === companion.id && (
                              <Icon name="check" size={12} />
                            )}
                          </i>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="quick-question">
                    <div className="section-title">
                      <div>
                        <strong>这次为什么送？</strong>
                        <small>场合会影响仪式感与风险偏好</small>
                      </div>
                    </div>
                    <div className="choice-row">
                      {occasions.map((item) => (
                        <button
                          className={occasion === item ? "selected" : ""}
                          key={item}
                          onClick={() => setOccasion(item)}
                          type="button"
                        >
                          {item}
                        </button>
                      ))}
                      {occasion === "自定义" ? (
                        <input
                          aria-label="自定义送礼场合"
                          autoFocus
                          className="inline-custom-input"
                          maxLength={12}
                          onChange={(event) => setCustomOccasion(event.target.value)}
                          placeholder="输入场合"
                          value={customOccasion}
                        />
                      ) : (
                        <button
                          onClick={() => setOccasion("自定义")}
                          type="button"
                        >
                          自定义
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="quick-question">
                    <div className="section-title">
                      <div>
                        <strong>预算大概多少？</strong>
                        <small>先做硬筛选，避免推荐不可履约</small>
                      </div>
                    </div>
                    <div className="budget-row">
                      {budgetOptions.map((item, index) => (
                        <button
                          className={budgetIndex === index ? "selected" : ""}
                          key={item.label}
                          onClick={() => setBudgetIndex(index)}
                          type="button"
                        >
                          {item.label}
                        </button>
                      ))}
                      {budgetIndex === -1 ? (
                        <input
                          aria-label="自定义预算"
                          autoFocus
                          className="inline-custom-input"
                          onChange={(event) => setCustomBudget(event.target.value)}
                          placeholder="¥300–500"
                          value={customBudget}
                        />
                      ) : (
                        <button
                          onClick={() => setBudgetIndex(-1)}
                          type="button"
                        >
                          自定义
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="quick-question relationship-question">
                    <div className="section-title">
                      <div>
                        <strong>你和 TA 是什么关系？</strong>
                      </div>
                    </div>
                    <div className="choice-row">
                      {relationships.map((item) => (
                        <button
                          className={relationship === item ? "selected" : ""}
                          key={item}
                          onClick={() => setRelationship(item)}
                          type="button"
                        >
                          {item}
                        </button>
                      ))}
                      {relationship === "自定义" ? (
                        <input
                          aria-label="自定义关系"
                          autoFocus
                          className="inline-custom-input"
                          maxLength={12}
                          onChange={(event) =>
                            setCustomRelationship(event.target.value)
                          }
                          placeholder="输入关系"
                          value={customRelationship}
                        />
                      ) : (
                        <button
                          onClick={() => setRelationship("自定义")}
                          type="button"
                        >
                          自定义
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="compact-inputs">
                    <label>
                      <span>补充一句（可选）</span>
                      <input
                        aria-label="补充线索"
                        maxLength={60}
                        onChange={(event) =>
                          setClueContext(event.target.value)
                        }
                        placeholder="比如：最近开始备赛"
                        value={clueContext}
                      />
                    </label>
                  </div>

                  {error && <p className="sheet-error">{error}</p>}

                  <button className="start-analysis" type="submit">
                    <Icon name="spark" size={18} />
                    开始推荐好物视频
                  </button>
                </form>
                {detailCompanion && (
                  <section
                    aria-label={`${detailCompanion.name}介绍`}
                    className="companion-detail"
                  >
                    <header>
                      <button
                        aria-label="返回送礼搭子列表"
                        onClick={() => setDetailCompanionId(null)}
                        type="button"
                      >
                        <Icon name="back" size={20} />
                      </button>
                      <strong>搭子介绍</strong>
                    </header>
                    <div className="companion-detail-hero">
                      <span aria-hidden="true">{detailCompanion.emoji}</span>
                      <div>
                        <small>送礼搭子</small>
                        <h2>{detailCompanion.name}</h2>
                        <p>{detailCompanion.description}</p>
                      </div>
                    </div>
                    <p className="companion-detail-intro">
                      {detailCompanion.intro}
                    </p>
                    <section className="companion-detail-section">
                      <h3>TA 擅长帮你解决</h3>
                      <div>
                        {detailCompanion.strengths.map((strength) => (
                          <span key={strength}>{strength}</span>
                        ))}
                      </div>
                    </section>
                    <section className="companion-detail-section">
                      <h3>TA 会怎么帮你选</h3>
                      <ol className="companion-approach">
                        {detailCompanion.approach.map((step, index) => (
                          <li key={step}>
                            <i>{index + 1}</i>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </section>
                    <section className="companion-detail-section">
                      <h3>TA 最近在看</h3>
                      <div className="mock-video-list">
                        {detailCompanion.mockVideos.map((video, index) => (
                          <article key={video}>
                            <i>{index + 1}</i>
                            <span>{video}</span>
                            <Icon name="play" size={14} />
                          </article>
                        ))}
                      </div>
                    </section>
                    <button
                      className="choose-companion"
                      onClick={() => {
                        setCompanionId(detailCompanion.id);
                        setDetailCompanionId(null);
                      }}
                      type="button"
                    >
                      选择 TA 帮我选
                    </button>
                  </section>
                )}
                </>
              )}

              {stage === "loading" && (
                <div className="sheet-scroll loading-flow" aria-live="polite">
                  <div className="scan-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" src={activePreview} />
                    <div />
                    <span />
                    <small>
                      {uploadPreview
                        ? "用户上传 · 生活切片"
                        : `${selectedFriend.handle} · 公开作品`}
                    </small>
                  </div>
                  <div className="loading-title">
                    <span className="thinking-orb">
                      <Icon name="spark" size={18} />
                    </span>
                    <div>
                      <strong>{loadingStages[loadingIndex][0]}</strong>
                      <p>{loadingStages[loadingIndex][1]}</p>
                    </div>
                  </div>
                  <div className="loading-list">
                    {loadingStages.map((item, index) => (
                      <div
                        className={
                          index < loadingIndex
                            ? "done"
                            : index === loadingIndex
                              ? "active"
                              : ""
                        }
                        key={item[0]}
                      >
                        <i>
                          {index < loadingIndex ? (
                            <Icon name="check" size={12} />
                          ) : (
                            index + 1
                          )}
                        </i>
                        <span>{item[0]}</span>
                      </div>
                    ))}
                  </div>
                  <p className="loading-note">
                    视觉分析和商品召回正在真实运行，通常需要 9–14 秒
                  </p>
                </div>
              )}

              {stage === "result" && result && (
                <div className="sheet-scroll result-flow">
                  <section className="visual-insight">
                    <div className="visual-insight-head">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt="" src={activePreview} />
                      <div>
                        <span>AI 看到了</span>
                        <strong>{result.analysis.sceneSummary}</strong>
                      </div>
                    </div>
                    <div className="interest-tags">
                      {result.analysis.interests.map((interest) => (
                        <span key={interest}># {interest}</span>
                      ))}
                    </div>
                    <div className="evidence-peek">
                      {result.analysis.evidence.slice(0, 2).map((item) => (
                        <p key={item.observation}>
                          <Icon name="check" size={13} />
                          <span>
                            <strong>{item.observation}</strong>
                            {item.implication}
                          </span>
                        </p>
                      ))}
                    </div>
                  </section>

                  <div className="result-summary">
                    <span>
                      <Icon name="spark" size={15} />
                      选礼工作台
                    </span>
                    <h2>不是同款，而是 TA 会喜欢的延伸</h2>
                    <p>{result.summary || result.message}</p>
                  </div>

                  <div className="mobile-gift-list">
                    {result.gifts?.map((gift) => {
                      const meta = strategyMeta[gift.strategy];
                      const action = offerAction(gift.offer);
                      return (
                        <article className="mobile-gift-card" key={gift.offerId}>
                          <div className="gift-card-top">
                            <span className={`strategy-chip ${gift.strategy}`}>
                              <b>{meta.icon}</b>
                              {meta.label}
                            </span>
                            <small>{meta.short}</small>
                          </div>
                          <div className="gift-card-main">
                            <div
                              className={`gift-art gift-art-${gift.offer.kind}`}
                            >
                              {gift.offer.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img alt="" src={gift.offer.imageUrl} />
                              ) : (
                                <>
                                  <Icon
                                    name={
                                      gift.offer.kind === "experience"
                                        ? "play"
                                        : "gift"
                                    }
                                    size={26}
                                  />
                                  <span>
                                    {gift.offer.kind === "experience"
                                      ? "体验"
                                      : "礼物"}
                                  </span>
                                </>
                              )}
                            </div>
                            <div>
                              <h3>{gift.offer.title}</h3>
                              <p>
                                {gift.offer.merchant ||
                                  gift.offer.sourcePlatform}
                              </p>
                              <strong>¥{gift.offer.price}</strong>
                              <small>
                                {gift.offer.priceStatus === "snapshot"
                                  ? "页面价格快照"
                                  : "Demo 预算参考"}
                              </small>
                            </div>
                          </div>
                          <p className="gift-reason">{gift.reason}</p>
                          <div className="gift-proof">
                            {gift.evidence.slice(0, 2).map((evidence) => (
                              <span key={evidence}>
                                <Icon name="check" size={12} />
                                {evidence}
                              </span>
                            ))}
                          </div>
                          {gift.caveat && (
                            <p className="gift-caveat">
                              <b>选前确认</b>
                              {gift.caveat}
                            </p>
                          )}
                          {gift.videos.length > 0 && (
                            <div className="related-videos">
                              <strong>先看内容再决定</strong>
                              {gift.videos.map((video) => (
                                <a
                                  href={video.sourceUrl}
                                  key={video.id}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  <i>
                                    <Icon name="play" size={12} />
                                  </i>
                                  <span>{video.title}</span>
                                  <Icon name="external" size={13} />
                                </a>
                              ))}
                            </div>
                          )}
                          <a
                            className="gift-action"
                            href={action.url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {action.label}
                            <Icon name="external" size={15} />
                          </a>
                        </article>
                      );
                    })}
                  </div>

                  <button className="reanalyze" onClick={reset} type="button">
                    <Icon name="refresh" size={16} />
                    换一个人或换一张图
                  </button>
                  {result.timings && (
                    <p className="timing-note">
                      本次真实分析用时{" "}
                      {(result.timings.totalMs / 1000).toFixed(1)} 秒
                    </p>
                  )}
                </div>
              )}
            </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
