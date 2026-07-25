"use client";

import {
  type ChangeEvent,
  type DragEvent,
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
  clarification?: VisualAnalysis["clarification"];
  message?: string;
  timings?: {
    visualMs: number;
    recallMs: number;
    selectionMs?: number;
    totalMs: number;
  };
  error?: string;
};

const occasions = ["纪念日", "生日", "七夕", "日常惊喜"] as const;

const budgetOptions = [
  { label: "小预算", range: "¥0–300", min: 0, max: 300 },
  { label: "刚刚好", range: "¥100–800", min: 100, max: 800 },
  { label: "认真准备", range: "¥500–1500", min: 500, max: 1500 },
] as const;

const strategyMeta: Record<
  GiftStrategy,
  { label: string; eyebrow: string; icon: string }
> = {
  interest_direct: {
    label: "兴趣直击",
    eyebrow: "01 · 看懂 TA 真正喜欢的",
    icon: "↗",
  },
  interest_adjacent: {
    label: "相邻兴趣",
    eyebrow: "02 · 不买错的聪明延伸",
    icon: "≈",
  },
  shared_experience: {
    label: "一起体验",
    eyebrow: "03 · 把礼物变成共同记忆",
    icon: "∞",
  },
};

const loadingStages = [
  {
    title: "正在读懂画面里的线索",
    detail: "区分已有物、兴趣信号与偶然出现",
  },
  {
    title: "正在寻找不容易买错的方向",
    detail: "避开型号、尺寸、香型等未知参数",
  },
  {
    title: "正在匹配商品与抖音内容",
    detail: "综合兴趣、预算、场合与重庆本地体验",
  },
  {
    title: "正在组织推荐理由",
    detail: "让每个选择都能回到看得见的证据",
  },
] as const;

function Icon({
  name,
  size = 20,
}: {
  name:
    | "spark"
    | "upload"
    | "at"
    | "arrow"
    | "camera"
    | "check"
    | "play"
    | "map"
    | "external"
    | "refresh"
    | "shield";
  size?: number;
}) {
  const paths = {
    spark: (
      <>
        <path d="M12 2.5c.5 4.6 2.9 7 7.5 7.5-4.6.5-7 2.9-7.5 7.5-.5-4.6-2.9-7-7.5-7.5 4.6-.5 7-2.9 7.5-7.5Z" />
        <path d="M19 16.5c.2 2 1.3 3.1 3.3 3.3-2 .2-3.1 1.3-3.3 3.2-.2-1.9-1.3-3-3.3-3.2 2-.2 3.1-1.3 3.3-3.3Z" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 14.5v4.2A1.3 1.3 0 0 0 6.3 20h11.4a1.3 1.3 0 0 0 1.3-1.3v-4.2" />
      </>
    ),
    at: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M16.5 15.5c-1.2 1-2.7.3-2.7-.9V9.4" />
        <circle cx="11.2" cy="12" r="3.1" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </>
    ),
    camera: (
      <>
        <path d="M4 7.5h3l1.4-2h7.2l1.4 2h3v11H4Z" />
        <circle cx="12" cy="13" r="3.3" />
      </>
    ),
    check: <path d="m5 12.5 4.2 4L19 7" />,
    play: <path d="m9 7 8 5-8 5Z" />,
    map: (
      <>
        <path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    external: (
      <>
        <path d="M13 5h6v6" />
        <path d="m11 13 8-8" />
        <path d="M19 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5H10" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M19 12a7 7 0 1 0-1.7 4.6" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      >
        {paths[name]}
      </g>
    </svg>
  );
}

function formatPrice(offer: Offer) {
  return `¥${offer.price}`;
}

function sourceLabel(offer: Offer) {
  if (offer.priceStatus === "snapshot") return "页面价格快照";
  if (offer.priceStatus === "estimated") return "预算参考价";
  return "商品价格";
}

export default function GiftWorkbench() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const [entryMode, setEntryMode] = useState<"upload" | "friend">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [occasion, setOccasion] = useState<(typeof occasions)[number]>("纪念日");
  const [budgetIndex, setBudgetIndex] = useState(1);
  const [city, setCity] = useState("重庆");
  const [clueContext, setClueContext] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [error, setError] = useState("");

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : ""),
    [file],
  );

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  useEffect(() => {
    if (!isLoading) return;
    const timer = window.setInterval(() => {
      setLoadingStage((stage) =>
        Math.min(stage + 1, loadingStages.length - 1),
      );
    }, 2100);
    return () => window.clearInterval(timer);
  }, [isLoading]);

  function acceptFile(nextFile?: File) {
    if (!nextFile) return;
    if (!nextFile.type.startsWith("image/")) {
      setError("请上传 JPG、PNG 或 WebP 图片");
      return;
    }
    if (nextFile.size > 5 * 1024 * 1024) {
      setError("图片请控制在 5MB 以内");
      return;
    }
    setError("");
    setResult(null);
    setFile(nextFile);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    acceptFile(event.target.files?.[0]);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  }

  async function useDemoFriend() {
    setError("");
    try {
      const response = await fetch("/demo-ta.jpg");
      if (!response.ok) throw new Error("DEMO_NOT_READY");
      const blob = await response.blob();
      setFile(new File([blob], "示例好友公开作品.jpg", { type: blob.type }));
    } catch {
      setError("示例素材暂未加载，请先上传一张普通照片");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError(
        entryMode === "friend"
          ? "请先选择示例好友或上传一张公开作品截图"
          : "请先上传一张能代表 TA 的照片",
      );
      return;
    }

    setError("");
    setResult(null);
    setLoadingStage(0);
    setIsLoading(true);

    const budget = budgetOptions[budgetIndex];
    const form = new FormData();
    form.append("image", file);
    form.append("occasion", occasion);
    form.append("budgetMin", String(budget.min));
    form.append("budgetMax", String(budget.max));
    form.append("city", city);
    form.append(
      "clueContext",
      [
        entryMode === "friend"
          ? "素材来自伴侣公开发布的抖音作品"
          : "素材来自用户上传的伴侣生活场景",
        clueContext,
      ]
        .filter(Boolean)
        .join("；"),
    );

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as RecommendResponse;
      if (!response.ok || payload.error) {
        throw new Error(payload.error || "推荐生成失败");
      }
      setResult(payload);
      window.setTimeout(
        () => resultRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message !== "推荐生成失败"
          ? caught.message
          : "AI 暂时没有读懂这张图，换一张更清晰的生活场景试试",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setFile(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const currentStage = loadingStages[loadingStage];

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="TA 的世界首页">
          <span className="brand-mark">TA</span>
          <span>
            <strong>TA 的世界</strong>
            <small>VISUAL GIFT SEARCH</small>
          </span>
        </a>
        <div className="topbar-note">
          <span className="live-dot" />
          临时视角 · 不改变主推荐流
        </div>
        <a className="quiet-link" href="#how-it-works">
          这是怎么做到的
          <Icon name="arrow" size={17} />
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-orbit hero-orbit-one" />
        <div className="hero-orbit hero-orbit-two" />
        <div className="hero-copy">
          <p className="kicker">
            <Icon name="spark" size={17} />
            为年轻伴侣设计的视觉选礼助手
          </p>
          <h1>
            不用猜 TA 想要什么，
            <br />
            <em>看一眼 TA 的世界。</em>
          </h1>
          <p className="hero-description">
            上传一张 TA 的桌面、房间、穿搭或公开作品。AI 从画面里的真实线索出发，
            找到 TA 会喜欢、你也不容易买错的礼物。
          </p>
          <div className="hero-proof">
            <div>
              <strong>3</strong>
              <span>种选礼策略</span>
            </div>
            <div>
              <strong>36</strong>
              <span>个精选方案</span>
            </div>
            <div>
              <strong>42</strong>
              <span>条内容证据</span>
            </div>
          </div>
          <div className="hero-footnote">
            <Icon name="shield" size={18} />
            仅分析你主动提供的图片或公开内容，不建立长期画像
          </div>
        </div>

        <form className="input-card" onSubmit={submit}>
          <div className="card-heading">
            <div>
              <span className="step-label">STEP 01</span>
              <h2>给我一点关于 TA 的线索</h2>
            </div>
            <span className="time-pill">约 8 秒</span>
          </div>

          <div className="entry-switch" role="tablist" aria-label="选择线索来源">
            <button
              aria-selected={entryMode === "upload"}
              className={entryMode === "upload" ? "active" : ""}
              onClick={() => setEntryMode("upload")}
              role="tab"
              type="button"
            >
              <Icon name="upload" size={18} />
              上传生活切片
            </button>
            <button
              aria-selected={entryMode === "friend"}
              className={entryMode === "friend" ? "active" : ""}
              onClick={() => setEntryMode("friend")}
              role="tab"
              type="button"
            >
              <Icon name="at" size={18} />
              @ 选择好友
              <span className="demo-badge">DEMO</span>
            </button>
          </div>

          {entryMode === "friend" && !file ? (
            <div className="friend-picker">
              <div className="friend-avatar">屿</div>
              <div className="friend-copy">
                <strong>示例好友 · 阿屿</strong>
                <span>公开作品：摄影 / 桌搭 / 城市散步</span>
              </div>
              <button type="button" onClick={useDemoFriend}>
                选择
              </button>
              <p>
                黑客松 Demo 用一张模拟公开作品代表主页视觉线索；真实产品可接入用户授权后的公开作品。
              </p>
            </div>
          ) : (
            <div
              className={`upload-zone ${isDragging ? "dragging" : ""} ${
                previewUrl ? "has-preview" : ""
              }`}
              onClick={() => !previewUrl && fileInputRef.current?.click()}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={onDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={onFileChange}
                type="file"
              />
              {previewUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="待分析的 TA 的视觉线索" src={previewUrl} />
                  <div className="preview-shade">
                    <span>
                      <Icon name="check" size={16} />
                      视觉线索已准备
                    </span>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      type="button"
                    >
                      换一张
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="upload-icon">
                    <Icon name="camera" size={28} />
                  </span>
                  <strong>拖入照片，或点击选择</strong>
                  <span>桌面 / 房间 / 穿搭 / 公开作品截图</span>
                  <small>JPG、PNG、WebP · 不超过 5MB</small>
                </>
              )}
            </div>
          )}

          <div className="field-group">
            <label>送礼场合</label>
            <div className="chip-row">
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
            </div>
          </div>

          <div className="field-group">
            <label>预算范围</label>
            <div className="budget-grid">
              {budgetOptions.map((item, index) => (
                <button
                  className={budgetIndex === index ? "selected" : ""}
                  key={item.label}
                  onClick={() => setBudgetIndex(index)}
                  type="button"
                >
                  <span>{item.label}</span>
                  <strong>{item.range}</strong>
                </button>
              ))}
            </div>
          </div>

          <div className="two-fields">
            <label>
              <span>所在城市</span>
              <span className="text-field">
                <Icon name="map" size={17} />
                <input
                  aria-label="所在城市"
                  onChange={(event) => setCity(event.target.value)}
                  value={city}
                />
              </span>
            </label>
            <label>
              <span>你还知道什么？</span>
              <input
                aria-label="补充线索"
                className="plain-input"
                maxLength={80}
                onChange={(event) => setClueContext(event.target.value)}
                placeholder="例如：最近开始学摄影"
                value={clueContext}
              />
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button" disabled={isLoading} type="submit">
            <span>开始读懂 TA</span>
            <Icon name="arrow" size={20} />
          </button>
        </form>
      </section>

      {isLoading && (
        <section className="thinking-panel" aria-live="polite">
          <div className="thinking-visual">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={previewUrl} />
            )}
            <span className="scan-line" />
            <span className="scan-corner corner-one" />
            <span className="scan-corner corner-two" />
            <span className="scan-corner corner-three" />
            <span className="scan-corner corner-four" />
          </div>
          <div className="thinking-copy">
            <span className="step-label">AI IS READING THE CLUES</span>
            <h2>{currentStage.title}</h2>
            <p>{currentStage.detail}</p>
            <div className="stage-list">
              {loadingStages.map((stage, index) => (
                <div
                  className={
                    index < loadingStage
                      ? "done"
                      : index === loadingStage
                        ? "active"
                        : ""
                  }
                  key={stage.title}
                >
                  <span>{index < loadingStage ? "✓" : index + 1}</span>
                  {stage.title}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {result && (
        <section className="results" ref={resultRef}>
          <div className="result-heading">
            <div>
              <p className="kicker">
                <Icon name="spark" size={17} />
                AI 已读完这张生活切片
              </p>
              <h2>我在 TA 的世界里，发现了这些。</h2>
              <p>{result.summary || result.message}</p>
            </div>
            <button className="secondary-button" onClick={reset} type="button">
              <Icon name="refresh" size={17} />
              换一张重新分析
            </button>
          </div>

          <div className="insight-board">
            <div className="insight-summary">
              <span>视觉理解</span>
              <h3>{result.analysis.sceneSummary}</h3>
              <div className="tag-cloud">
                {result.analysis.interests.map((interest) => (
                  <span key={interest}># {interest}</span>
                ))}
                {result.analysis.aesthetics.map((aesthetic) => (
                  <span className="soft" key={aesthetic}>
                    {aesthetic}
                  </span>
                ))}
              </div>
            </div>
            <div className="evidence-list">
              <span className="board-label">AI 的判断依据</span>
              {result.analysis.evidence.slice(0, 3).map((item, index) => (
                <div className="evidence-row" key={`${item.observation}-${index}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{item.observation}</strong>
                    <p>{item.implication}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="avoid-list">
              <span className="board-label">这次先避开</span>
              {result.analysis.avoidances.slice(0, 3).map((item) => (
                <p key={item}>
                  <span>×</span>
                  {item}
                </p>
              ))}
            </div>
          </div>

          {result.gifts && result.gifts.length > 0 ? (
            <div className="gift-grid">
              {result.gifts.map((gift) => {
                const strategy = strategyMeta[gift.strategy];
                return (
                  <article className="gift-card" key={gift.offerId}>
                    <div className="gift-media">
                      {gift.offer.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt="" src={gift.offer.imageUrl} />
                      ) : (
                        <div className={`media-placeholder ${gift.offer.kind}`}>
                          <span>{strategy.icon}</span>
                          <small>
                            {gift.offer.kind === "experience"
                              ? "LOCAL EXPERIENCE"
                              : "GIFT OBJECT"}
                          </small>
                        </div>
                      )}
                      <span className={`strategy strategy-${gift.strategy}`}>
                        {strategy.label}
                      </span>
                    </div>
                    <div className="gift-body">
                      <span className="gift-eyebrow">{strategy.eyebrow}</span>
                      <h3>{gift.offer.title}</h3>
                      <p className="merchant">
                        {gift.offer.merchant || gift.offer.sourcePlatform}
                      </p>
                      <p className="gift-reason">{gift.reason}</p>
                      <div className="gift-evidence">
                        {gift.evidence.slice(0, 2).map((item) => (
                          <span key={item}>
                            <Icon name="check" size={14} />
                            {item}
                          </span>
                        ))}
                      </div>
                      {gift.caveat && (
                        <p className="caveat">
                          <strong>选前确认</strong>
                          {gift.caveat}
                        </p>
                      )}
                      <div className="price-row">
                        <div>
                          <strong>{formatPrice(gift.offer)}</strong>
                          <span>{sourceLabel(gift.offer)}</span>
                        </div>
                        <a
                          href={gift.offer.sourceUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {gift.offer.kind === "experience"
                            ? "查看抖音"
                            : "查看详情"}
                          <Icon name="external" size={15} />
                        </a>
                      </div>
                    </div>

                    {gift.videos.length > 0 && (
                      <div className="video-strip">
                        <span className="board-label">内容怎么说</span>
                        {gift.videos.map((video) => (
                          <a
                            className="video-item"
                            href={video.sourceUrl}
                            key={video.id}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <div className="video-cover">
                              {video.coverUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img alt="" src={video.coverUrl} />
                              ) : (
                                <span className="cover-fallback">抖音</span>
                              )}
                              <i>
                                <Icon name="play" size={13} />
                              </i>
                            </div>
                            <div>
                              <strong>{video.title}</strong>
                              <span>@{video.author}</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-result">
              <h3>这次还没有找到足够合适的方案</h3>
              <p>{result.message}</p>
              <button className="secondary-button" onClick={reset} type="button">
                换个预算或线索再试
              </button>
            </div>
          )}

          {result.timings && (
            <p className="timing-note">
              本次分析用时 {(result.timings.totalMs / 1000).toFixed(1)} 秒 ·
              推荐来自当前 Demo 商品库，实时价格与库存以下单页面为准
            </p>
          )}
        </section>
      )}

      <section className="how-it-works" id="how-it-works">
        <div>
          <p className="kicker">WHY VISUAL SEARCH</p>
          <h2>
            送礼真正难的，
            <br />
            不是搜商品。
          </h2>
        </div>
        <div className="principle-grid">
          <article>
            <span>01</span>
            <h3>视觉先把话说清楚</h3>
            <p>
              一张桌面或穿搭，能同时表达兴趣、审美、已有物和生活状态——这些很难被压缩成一句搜索词。
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>不找廉价同款</h3>
            <p>
              看见昂贵向往物，不代表推荐低价平替。系统寻找兴趣的延续、低风险周边和共同体验。
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>从内容走到履约</h3>
            <p>
              推荐结果同时给出可行动方案与关联视频，让真实体验内容帮助用户完成最后判断。
            </p>
          </article>
        </div>
      </section>

      <footer>
        <div className="brand footer-brand">
          <span className="brand-mark">TA</span>
          <span>
            <strong>TA 的世界</strong>
            <small>BLACK HACKATHON DEMO</small>
          </span>
        </div>
        <p>Visual clues → human understanding → a gift that feels right.</p>
        <span>重庆 · 2026</span>
      </footer>
    </main>
  );
}
