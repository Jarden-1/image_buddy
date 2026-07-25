// 抖音送礼指南 Mock 数据
// 注：原项目使用 manus 平台托管的图片（/manus-storage/*），此处替换为 Unsplash 公开图，保证开箱即用。

// ─── 图片资源（集中管理）──────────────────────────────────────────────────────
export const IMAGES = {
  // 视频缩略图（竖屏 9:16）
  videoThumb1: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=700&fit=crop&auto=format',
  videoThumb2: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=700&fit=crop&auto=format',
  videoThumb3: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&h=700&fit=crop&auto=format',
  // 产品图（正方形）
  productCakeCard: 'https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=300&h=300&fit=crop&auto=format',
  productCandle: 'https://images.unsplash.com/photo-1602874801006-e26c4b7b1f2d?w=300&h=300&fit=crop&auto=format',
  productPerfume: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop&auto=format',
  productTea: 'https://images.unsplash.com/photo-1582793988951-9aed5509eb97?w=300&h=300&fit=crop&auto=format',
  productJewelry: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=300&h=300&fit=crop&auto=format',
  productPlant: 'https://images.unsplash.com/photo-1459156212016-c812468e2115?w=300&h=300&fit=crop&auto=format',
} as const;

// ─── 视频资源（真实 mp4，放在 public/videos/）───────────────────────────────
export const VIDEO_SOURCES = {
  v1: '/videos/v1-handmade.mp4',
  v2: '/videos/v2-gift-guide.mp4',
  v3: '/videos/v3-gift-for-him.mp4',
} as const;

// ─── 类型定义 ─────────────────────────────────────────────────────────────────
export interface VideoItem {
  id: string;
  videoUrl: string;       // 真实视频源
  thumbUrl: string;       // 封面图（video 的 poster）
  authorName: string;
  authorAvatar: string;
  description: string;
  tags: string[];
  likes: string;
  comments: string;
  shares: string;
  capsules: { text: string; type: 'analysis' | 'ai' }[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  bloggerCount: number;
  goodRate: number;
  reason: string;
  douyinUrl: string;
}

export interface ProductCategory {
  id: string;
  title: string;
  icon: string;
  whyLike: string;
  products: Product[];
}

export interface BloggerComment {
  productId: string;
  comment: string; // 博主口吻短评
}

export interface Blogger {
  id: string;
  name: string;         // @xxx
  avatar: string;       // emoji 头像
  tagline: string;      // 一句话定位
  styleTags: string[];  // 风格标签
  matchVideoTags: string[]; // 自动匹配的视频标签关键词
  thinkingBubbles: string[]; // 状态C碎碎念气泡（7条）
  reportIntro: string;  // 报告开头语
  preferCategories: string[]; // 偏好品类 id
  productComments: BloggerComment[]; // 每个商品的专属短评
}

export interface GiftReport {
  portrait: string;
  keywords: string[];
  personaEmoji: string;
  personaTitle: string;
  categories: ProductCategory[];
}

// ─── 博主数据 ─────────────────────────────────────────────────────────────────
export const BLOGGERS: Blogger[] = [
  {
    id: 'b1',
    name: '@仪式感研究所',
    avatar: '🎀',
    tagline: '送礼要让人记一辈子',
    styleTags: ['情感浓度', '手作温度', '仪式感'],
    matchVideoTags: ['仪式感', '生日贺卡', '手作礼物', '纪念日', '手工'],
    thinkingBubbles: [
      '等一下，我先看看她的日常…',
      '嗯，桌上有香薰，这个人很注重生活氛围感 🕯️',
      '她发的内容有很多手作的东西，说明她欣赏用心程度',
      '预算在这个范围，可以做到有质感又不显得刻意',
      '我觉得她不需要贵的，需要"被看见"的那种感觉',
      '手作类或者有故事感的礼物，打开那一刻会让她哭的',
      '好了，我帮你选了三个方向，每一个都能让她记一辈子 🎀',
    ],
    reportIntro: '我看完她的内容，这个人对仪式感的要求很高——不是要贵的，是要"你懂我"的。下面是我给你选的礼物方向，每一个都经过我反复斟酌。',
    preferCategories: ['c1', 'c2'],
    productComments: [
      { productId: 'p1', comment: '这款我给三个朋友买过，收到的人都哭了，仪式感拉满 🥹' },
      { productId: 'p2', comment: '点燃的瞬间真的很治愈，她每次用都会想起你' },
      { productId: 'p3', comment: '木质调很有故事感，不是那种甜腻的香，适合她' },
      { productId: 'p4', comment: '泡茶这件事本身就是仪式感，送这个很懂她' },
      { productId: 'p5', comment: '设计师款，低调但有人会问"这哪里买的"' },
      { productId: 'p6', comment: '有生命力的礼物，每天浇水都会想起你，很有意思' },
    ],
  },
  {
    id: 'b2',
    name: '@生活方式编辑',
    avatar: '☕',
    tagline: '好用才是真的好',
    styleTags: ['实用主义', '日常好物', '性价比'],
    matchVideoTags: ['日常', 'vlog', '生活', '好物', '分享', '实用'],
    thinkingBubbles: [
      '先看看她平时用什么…',
      '好，她是那种很务实的人，不喜欢摆着好看但没用的东西',
      '这个预算其实可以买到很不错的日常好物',
      '我不推那种"看起来很高级但用不上"的礼物',
      '她需要的是那种每天都会用到、每次用都觉得"好好用"的东西 ☕',
      '实用的礼物才是真的在乎她，不是在炫耀你有钱',
      '选好了，三个方向都是我自己用过觉得值的，放心送',
    ],
    reportIntro: '看完她的内容，这是个很务实的人——不需要你送贵的，需要你送"对的"。我帮你选了几个她每天都会用到的好物，实用才是最好的仪式感。',
    preferCategories: ['c2', 'c3'],
    productComments: [
      { productId: 'p1', comment: '手作贺卡这种东西，实用性一般，但情感价值很高，看你们关系' },
      { productId: 'p2', comment: '香薰蜡烛是我自己会买的东西，实用又有氛围感，不踩雷' },
      { productId: 'p3', comment: '这款香水我测评过，留香时间真的比同价位的好很多' },
      { productId: 'p4', comment: '茶礼盒包装好，送长辈或者喜欢喝茶的人非常稳' },
      { productId: 'p5', comment: '925银日常戴不会过敏，设计简单好搭，买了不会后悔' },
      { productId: 'p6', comment: '多肉好养活，放桌上很好看，价格也亲民，性价比高' },
    ],
  },
  {
    id: 'b3',
    name: '@时尚选品官',
    avatar: '✨',
    tagline: '颜值即正义，细节定输赢',
    styleTags: ['颜值优先', '品位派', '设计感'],
    matchVideoTags: ['穿搭', '时尚', '美妆', '颜值', '设计', '潮流', '高级感'],
    thinkingBubbles: [
      '先看她的穿搭风格…',
      '嗯，她对颜值的要求很高，那种大众款直接排除',
      '她的配色偏好很明显，送礼也要符合她的审美体系',
      '这个预算在小众设计师品牌里能买到很不错的东西',
      '包装也很重要——礼物的第一印象就是打开那一刻 ✨',
      '我不推那种"看起来贵但没有设计感"的东西，踩雷',
      '好了，这几个都是我反复筛过的，颜值和品质都在线',
    ],
    reportIntro: '她的审美很在线——送礼如果不好看，不如不送。我帮你选了几个颜值和品质都能打的礼物，打开的瞬间就能让她眼前一亮。',
    preferCategories: ['c3', 'c1'],
    productComments: [
      { productId: 'p1', comment: '立体贺卡打开那一刻的视觉冲击，朋友圈必发，颜值满分' },
      { productId: 'p2', comment: '这款蜡烛的包装设计很好，放桌上就是装饰品' },
      { productId: 'p3', comment: '瓶身设计很有质感，放梳妆台上比大牌还好看' },
      { productId: 'p4', comment: '茶礼盒的包装做得很精致，送人拿出来不丢分' },
      { productId: 'p5', comment: '这条项链的设计感是同价位里最好的，我自己也在戴' },
      { productId: 'p6', comment: '多肉组合的造型很好看，放在她桌上绝对加分' },
    ],
  },
  {
    id: 'b4',
    name: '@体验派旅人',
    avatar: '🌿',
    tagline: '最好的礼物是一段体验',
    styleTags: ['感性风格', '体验优先', '有故事感'],
    matchVideoTags: ['旅行', '美食', '体验', '探店', '自然', '户外', '感性'],
    thinkingBubbles: [
      '我先感受一下她是什么样的人…',
      '她喜欢体验感强的东西，不是那种买回来放着的礼物',
      '送礼物最重要的是"这个礼物有没有故事"',
      '她可能更喜欢那种能带来新体验的东西 🌿',
      '这个预算可以做到很有质感，不一定要买贵的',
      '我在想，如果是我收到这个礼物，会不会觉得"这个人真的懂我"',
      '好了，这几个方向都是我觉得能让她产生"哇"的瞬间的礼物',
    ],
    reportIntro: '她是那种很感性的人——礼物不需要贵，需要有故事。我帮你选了几个能带来真实体验感的礼物，让她觉得"你真的懂我"。',
    preferCategories: ['c2', 'c3'],
    productComments: [
      { productId: 'p1', comment: '手作这件事本身就是一段体验，她打开的那一刻会感受到你的用心' },
      { productId: 'p2', comment: '香薰蜡烛点燃的那一刻，是一种很沉浸的体验感' },
      { productId: 'p3', comment: '香水是最能触发记忆的东西，她以后闻到这个味道就会想起你' },
      { productId: 'p4', comment: '泡一杯好茶，是给自己的一段安静体验，很适合她' },
      { productId: 'p5', comment: '戴上它的那一刻，她会觉得自己是有故事的人' },
      { productId: 'p6', comment: '养一盆多肉，是一段持续的体验，每天都有新变化' },
    ],
  },
];

// 根据视频标签自动匹配博主
export function matchBloggerByVideo(videoTags: string[], description: string): Blogger {
  const text = [...videoTags, description].join(' ');
  let bestMatch = BLOGGERS[0];
  let bestScore = 0;
  for (const blogger of BLOGGERS) {
    const score = blogger.matchVideoTags.filter(tag => text.includes(tag)).length;
    if (score > bestScore) { bestScore = score; bestMatch = blogger; }
  }
  return bestMatch;
}

// ─── 视频数据 ─────────────────────────────────────────────────────────────────
export const VIDEOS: VideoItem[] = [
  {
    id: 'v1',
    videoUrl: VIDEO_SOURCES.v1,
    thumbUrl: IMAGES.videoThumb1,
    authorName: '手作礼物研究所',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&auto=format',
    description: '【立体蛋糕贺卡】手工制作教程，送给最重要的人 ❤️ 每一折都是心意',
    tags: ['#手作礼物', '#生日贺卡', '#仪式感'],
    likes: '12.4万',
    comments: '3281',
    shares: '8.9万',
    capsules: [
      { text: '适合重视仪式感的人', type: 'analysis' },
      { text: '手作温度，适合亲密关系', type: 'analysis' },
      { text: '让AI帮你选礼物？', type: 'ai' },
    ],
  },
  {
    id: 'v2',
    videoUrl: VIDEO_SOURCES.v2,
    thumbUrl: IMAGES.videoThumb2,
    authorName: '馬逸尘的礼物日记',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format',
    description: '时间礼物盒——把我们在一起的每个瞬间装进去 🎁 比任何东西都有意义',
    tags: ['#时间礼物', '#手工', '#情侣礼物'],
    likes: '8.7万',
    comments: '1924',
    shares: '5.2万',
    capsules: [
      { text: '有心意，但送同事略显越界', type: 'analysis' },
      { text: '这件更日常，也更符合预算', type: 'analysis' },
      { text: '让AI帮你选礼物？', type: 'ai' },
    ],
  },
  {
    id: 'v3',
    videoUrl: VIDEO_SOURCES.v3,
    thumbUrl: IMAGES.videoThumb3,
    authorName: '香氛生活家',
    authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format',
    description: '这款香水真的绝了！送女朋友她直接哭了 😭 木质调+茉莉，高级感拉满',
    tags: ['#香水测评', '#送礼推荐', '#高级感'],
    likes: '23.1万',
    comments: '6847',
    shares: '15.3万',
    capsules: [
      { text: '适合追求精致生活的她', type: 'analysis' },
      { text: '木质调香气，适合25-35岁', type: 'analysis' },
      { text: '让AI帮你选礼物？', type: 'ai' },
    ],
  },
];

// ─── 礼物报告 ─────────────────────────────────────────────────────────────────
export const GIFT_REPORT: GiftReport = {
  portrait: 'TA 是 26-35 岁的文艺青年，重视仪式感与情感表达，喜欢有温度的手作物品。生活中注重品质而非奢华，偏好有故事感的礼物。对美有独特见解，不喜欢千篇一律的商业化礼物，更在意送礼人的用心程度。',
  keywords: ['仪式感', '手作温度', '有故事', '不从众'],
  personaEmoji: '🎨',
  personaTitle: '文艺青年',
  categories: [
    {
      id: 'c1',
      title: '手作礼物',
      icon: '🎨',
      whyLike: 'TA 重视手作温度，认为亲手制作或精选的礼物远比昂贵商品更有意义。立体贺卡、手工皂等能传递真实情感的物品，会让 TA 感受到被珍视。',
      products: [
        {
          id: 'p1',
          name: '立体蛋糕贺卡·手作版',
          price: 128,
          imageUrl: IMAGES.productCakeCard,
          bloggerCount: 12,
          goodRate: 98,
          reason: '手工立体贺卡兼具视觉冲击与情感温度，打开瞬间的惊喜感极强。适合生日、纪念日等重要场合，让对方感受到你的用心。',
          douyinUrl: 'https://www.douyin.com/search/%E7%AB%8B%E4%BD%93%E8%9B%8B%E7%B3%95%E8%B4%BA%E5%8D%A1',
        },
        {
          id: 'p2',
          name: '手工香薰蜡烛礼盒',
          price: 89,
          imageUrl: IMAGES.productCandle,
          bloggerCount: 8,
          goodRate: 96,
          reason: '天然大豆蜡，搭配干花装饰，既是生活用品又是艺术品。点燃时的香气与光晕，能让对方每次使用都想起你。',
          douyinUrl: 'https://www.douyin.com/search/%E6%89%8B%E5%B7%A5%E9%A6%99%E8%96%B0%E8%9C%A1%E7%83%9B',
        },
      ],
    },
    {
      id: 'c2',
      title: '香氛生活',
      icon: '🌸',
      whyLike: 'TA 对生活品质有追求，香氛类产品能提升日常仪式感。高品质香水或香薰能让 TA 在忙碌生活中找到片刻宁静，是实用与美学的完美结合。',
      products: [
        {
          id: 'p3',
          name: '木质调淡香水 50ml',
          price: 268,
          imageUrl: IMAGES.productPerfume,
          bloggerCount: 31,
          goodRate: 97,
          reason: '木质调与茉莉的融合，清新而不失深度，适合文艺气质的人。留香持久，每次喷洒都是一次小确幸。',
          douyinUrl: 'https://www.douyin.com/search/%E6%9C%A8%E8%B4%A8%E8%B0%83%E9%A6%99%E6%B0%B4',
        },
        {
          id: 'p4',
          name: '高山茶礼盒套装',
          price: 158,
          imageUrl: IMAGES.productTea,
          bloggerCount: 15,
          goodRate: 95,
          reason: '精选高山茶叶，配以精美礼盒包装。茶文化与仪式感的结合，适合有生活情趣的人，每次泡茶都是一次放松。',
          douyinUrl: 'https://www.douyin.com/search/%E9%AB%98%E5%B1%B1%E8%8C%B6%E7%A4%BC%E7%9B%92',
        },
      ],
    },
    {
      id: 'c3',
      title: '精致饰品',
      icon: '✨',
      whyLike: 'TA 喜欢低调而有质感的配饰，不追求大牌标志，更在意设计感与工艺。轻奢珠宝或设计师饰品能让 TA 在日常穿搭中展现个性，是长期使用的礼物首选。',
      products: [
        {
          id: 'p5',
          name: '925银小众设计项链',
          price: 198,
          imageUrl: IMAGES.productJewelry,
          bloggerCount: 22,
          goodRate: 99,
          reason: '设计师原创款式，925纯银材质，简约而不失精致。可日常佩戴，每次看到都会想起送礼人的心意。',
          douyinUrl: 'https://www.douyin.com/search/%E5%B0%8F%E4%BC%97%E9%A1%B9%E9%93%BE%E9%A6%99%E8%96%B0',
        },
        {
          id: 'p6',
          name: '多肉植物礼盒',
          price: 68,
          imageUrl: IMAGES.productPlant,
          bloggerCount: 9,
          goodRate: 94,
          reason: '精心挑选的多肉组合，配以手绘卡片。有生命力的礼物，每天浇水时都能感受到被关心，适合喜欢自然的人。',
          douyinUrl: 'https://www.douyin.com/search/%E5%A4%9A%E8%82%89%E6%A4%8D%E7%89%A9%E7%A4%BC%E7%9B%92',
        },
      ],
    },
  ],
};

// ─── 问题卡数据 ───────────────────────────────────────────────────────────────
export const QUESTIONS = [
  {
    id: 'q1',
    type: 'required' as const,
    question: '预算范围？',
    purpose: '用于筛选商品价格区间',
    options: ['100以内', '100-300', '300-500', '500+'],
    multiSelect: false,
    allowCustom: true,
    customPlaceholder: '自定义金额，如 800',
  },
  {
    id: 'q2',
    type: 'required' as const,
    question: '送礼对象是？',
    purpose: '帮助AI理解关系亲密度',
    options: ['朋友', '伴侣', '家人', '同事', '自己'],
    multiSelect: false,
    allowCustom: true,
    customPlaceholder: '其他，如 导师、前辈',
  },
  {
    id: 'q3',
    type: 'optional' as const,
    question: '对方的风格偏好？',
    purpose: '帮助AI更精准推荐',
    options: ['文艺小清新', '简约极简', '甜美可爱', '成熟稳重', '潮流时尚'],
    multiSelect: true,
  },
  {
    id: 'q4',
    type: 'optional' as const,
    question: '送礼场合？',
    purpose: '帮助AI匹配合适场景',
    options: ['生日', '纪念日', '节日', '日常惊喜', '感谢'],
    multiSelect: false,
  },
  {
    id: 'q5',
    type: 'optional' as const,
    question: '对方的年龄段？',
    purpose: '帮助AI了解喜好特征',
    options: ['18-24岁', '25-30岁', '31-40岁', '40岁以上'],
    multiSelect: false,
  },
];

export const AI_THINKING_STEPS = [
  '正在解析上传内容...',
  '识别视频/图片中的物品特征...',
  '分析受众群体偏好...',
  '结合预算与送礼对象筛选...',
  '匹配商品库中的精选好物...',
  '生成个性化推荐理由...',
  '整理报告中，即将完成...',
];
