import tradeSites from '@/data/trade-intelligence-sites.json';

export type TradeKnowledgeSite = {
  title: string;
  url: string;
  main_category: string;
  description: string;
  credibility_score: number;
  ai_analysis_and_opportunities: string;
  is_verified?: boolean;
  verificationStatus?: 'verified' | 'pending' | 'rejected';
  sourceType?: 'official' | 'institutional' | 'market' | 'logistics' | 'customs';
  lastVerifiedAt?: string;
};

export type TradeInsight = TradeKnowledgeSite & {
  credibilityPercent: number;
  relevanceScore: number;
  recommendation: string;
  searchTerms: string[];
};

export type TradeKnowledgeCategory = {
  slug: string;
  name: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  count: number;
  sites: TradeKnowledgeSite[];
  topSites: TradeKnowledgeSite[];
};

export type TradeKnowledgeSummary = {
  query: string;
  totalSites: number;
  matchedSites: number;
  topInsights: TradeInsight[];
  categories: Array<{ name: string; count: number }>;
  highCredibilityCount: number;
  averageCredibility: number;
};

const SITES = tradeSites as TradeKnowledgeSite[];

const SUSPECT_PATTERNS = [
  /Portal\s*\d+/i,
  /Insights Agency v\d+/i,
  /Operator v\d+/i,
  /Bureau\s*\d+/i,
  /trade-insights-hub-\d+/i,
  /customs-gov-portal-\d+/i,
  /logistics-tracker-\d+/i,
  /compliance-finance-\d+/i,
];

function isSuspectSource(site: TradeKnowledgeSite): boolean {
  if (site.is_verified === true) return false;
  if (site.verificationStatus === 'verified') return false;
  for (const pattern of SUSPECT_PATTERNS) {
    if (pattern.test(site.title) || pattern.test(site.url)) return true;
  }
  return false;
}

export function getVerifiedTradeSources(): TradeKnowledgeSite[] {
  return SITES.filter(site => !isSuspectSource(site) && site.is_verified !== false);
}

export function getTopVerifiedSources(limit = 12): TradeKnowledgeSite[] {
  return getVerifiedTradeSources()
    .sort((a, b) => (b.credibility_score || 0) - (a.credibility_score || 0))
    .slice(0, limit);
}

const CATEGORY_ALIASES: Record<string, string> = {
  'الجهاتها الحكومية والجمارك والوزارات الاستراتيجية': 'الجهات الحكومية والجمارك والوزارات الاستراتيجية',
  'اللوجستيات, الشحن الدولي وسلاسل الإمداد': 'اللوجستيات، الشحن الدولي وسلاسل الإمداد',
};

const CATEGORY_META: Record<string, {
  slug: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
}> = {
  'المنظمات والمنصات التحليلية العالمية': {
    slug: 'global-trade-intelligence',
    nameEn: 'Global Trade Intelligence',
    descriptionAr: 'مصادر تحليلية دولية لمتابعة الأسواق، السياسات، البيانات التجارية، وفرص التوسع الذكي.',
    descriptionEn: 'Global analytical sources for market tracking, trade policy, statistics, and smart expansion opportunities.',
  },
  'الجهات الحكومية والجمارك والوزارات الاستراتيجية': {
    slug: 'government-customs',
    nameEn: 'Government & Customs',
    descriptionAr: 'بوابات حكومية وجمركية ووزارية لمتابعة اللوائح، الإجراءات، التراخيص، والامتثال الرسمي.',
    descriptionEn: 'Official government and customs portals for regulations, procedures, licensing, and compliance.',
  },
  'اللوجستيات، الشحن الدولي وسلاسل الإمداد': {
    slug: 'logistics-supply-chain',
    nameEn: 'Logistics & Supply Chain',
    descriptionAr: 'أدوات الشحن، التتبع، الموانئ، وسلاسل الإمداد لتحسين زمن وكلفة الحركة التجارية.',
    descriptionEn: 'Shipping, tracking, ports, and supply-chain tools to optimize time and cost in trade flows.',
  },
  'تمويل التجارة، المطابقة والامتثال القانوني': {
    slug: 'trade-finance-compliance',
    nameEn: 'Trade Finance & Compliance',
    descriptionAr: 'مراجع تمويل التجارة، المطابقة، الاعتمادات، التأمين، والمواصفات القياسية.',
    descriptionEn: 'Trade finance, compliance, letters of credit, insurance, and standards references.',
  },
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[ً-ٰٟ]/g, '')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeTradeCategoryName(value: string): string {
  const trimmed = value.trim();
  return CATEGORY_ALIASES[trimmed] ?? trimmed;
}

function getCategoryMeta(value: string) {
  const normalized = normalizeTradeCategoryName(value);
  return CATEGORY_META[normalized] ?? {
    slug: normalized
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, ''),
    nameEn: normalized,
    descriptionAr: 'مصدر موثوق ضمن قاعدة المعرفة التجارية.',
    descriptionEn: 'A trusted source within the trade knowledge base.',
  };
}

export function slugifyTradeCategory(value: string): string {
  return getCategoryMeta(value).slug;
}

export function siteMatchesCategorySlug(categoryName: string, slug: string): boolean {
  return slugifyTradeCategory(categoryName) === slug;
}

function extractPercent(value: string | number): number {
  if (typeof value === 'number') return Math.min(100, value);
  const match = value?.match?.(/(\d{1,3})/);
  return match ? Math.min(100, Number.parseInt(match[1], 10)) : 0;
}

function tokenize(query: string): string[] {
  const normalized = normalizeText(query);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean).slice(0, 12);
}

function getRecommendation(site: TradeKnowledgeSite): string {
  const category = normalizeTradeCategoryName(site.main_category);
  if (category.includes('حكومية')) return 'مصدر رسمي لقرارات الجمارك والتشريعات والتراخيص.';
  if (category.includes('لوجستيات')) return 'مفيد لتخطيط الشحنات وتتبع الحاويات وتقليل التأخير.';
  if (category.includes('تمويل')) return 'مفيد لتقليل مخاطر السداد ورفع جودة الامتثال.';
  if (category.includes('تحليلية')) return 'مفيد لفهم تحركات السوق والمنافسة والطلب.';
  return 'مصدر مرجعي يمكن تحويله إلى إشارة تشغيلية داخل الشركة.';
}

function scoreSite(site: TradeKnowledgeSite, query: string): number {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return extractPercent(site.credibility_score) * 1.5;
  }

  const haystack = normalizeText([
    site.title,
    site.description,
    site.ai_analysis_and_opportunities,
    site.main_category,
    site.url,
  ].join(' '));

  let score = 0;
  for (const token of tokens) {
    if (!token) continue;
    if (haystack.includes(token)) score += 12;
    if (normalizeText(site.title).includes(token)) score += 24;
    if (normalizeText(site.main_category).includes(token)) score += 20;
    if (normalizeText(site.ai_analysis_and_opportunities).includes(token)) score += 10;
  }

  score += extractPercent(site.credibility_score) * 1.2;
  if (site.main_category.includes('حكومية')) score += 8;
  return score;
}

export function getAllTradeKnowledgeSites(): TradeKnowledgeSite[] {
  return SITES;
}

export function getTradeKnowledgeStats() {
  const categories = new Map<string, number>();
  let totalCredibility = 0;
  let highCredibilityCount = 0;

  for (const site of SITES) {
    const category = normalizeTradeCategoryName(site.main_category);
    categories.set(category, (categories.get(category) ?? 0) + 1);
    const percent = extractPercent(site.credibility_score);
    totalCredibility += percent;
    if (percent >= 90) highCredibilityCount += 1;
  }

  return {
    totalSites: SITES.length,
    totalCategories: categories.size,
    highCredibilityCount,
    averageCredibility: SITES.length ? Math.round(totalCredibility / SITES.length) : 0,
    categories: [...categories.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count })),
  };
}

export function getTradeKnowledgeCategories(): TradeKnowledgeCategory[] {
  const grouped = new Map<string, TradeKnowledgeSite[]>();

  for (const site of SITES) {
    const category = normalizeTradeCategoryName(site.main_category);
    const list = grouped.get(category) ?? [];
    list.push(site);
    grouped.set(category, list);
  }

  return [...grouped.entries()]
    .map(([name, sites]) => {
      const meta = getCategoryMeta(name);
      const sortedSites = sites.sort((a, b) => extractPercent(b.credibility_score) - extractPercent(a.credibility_score));
      return {
        slug: meta.slug,
        name,
        nameEn: meta.nameEn,
        descriptionAr: meta.descriptionAr,
        descriptionEn: meta.descriptionEn,
        count: sortedSites.length,
        sites: sortedSites,
        topSites: sortedSites.slice(0, 4),
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ar'));
}

export function findTradeKnowledgeCategoryBySlug(slug: string): TradeKnowledgeCategory | null {
  return getTradeKnowledgeCategories().find((category) => category.slug === slug) ?? null;
}

export function groupTradeKnowledgeSites() {
  return getTradeKnowledgeCategories().map((category) => ({
    name: category.name,
    slug: category.slug,
    descriptionAr: category.descriptionAr,
    descriptionEn: category.descriptionEn,
    sites: category.sites,
  }));
}

export function searchTradeInsights(query: string, limit = 12): TradeInsight[] {
  const normalizedQuery = query.trim();
  const ranked = SITES
    .map((site) => {
      const credibilityPercent = extractPercent(site.credibility_score);
      return {
        ...site,
        credibilityPercent,
        relevanceScore: scoreSite(site, normalizedQuery),
        recommendation: getRecommendation(site),
        searchTerms: tokenize(normalizedQuery),
      } satisfies TradeInsight;
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore || b.credibilityPercent - a.credibilityPercent || a.title.localeCompare(b.title, 'ar'));

  return ranked.slice(0, limit);
}

export function searchVerifiedTradeInsights(query: string, limit = 12): TradeInsight[] {
  const normalizedQuery = query.trim();
  return searchTradeInsights(normalizedQuery, 100)
    .filter(insight => insight.is_verified !== false)
    .slice(0, limit);
}

export function getOpportunityFeed() {
  return getVerifiedTradeSources()
    .filter(site => site.sourceType === 'market' || site.sourceType === 'official')
    .sort((a, b) => (b.credibility_score || 0) - (a.credibility_score || 0))
    .slice(0, 12);
}

export function buildTradeKnowledgeSummary(query: string): TradeKnowledgeSummary {
  const topInsights = searchTradeInsights(query, 8);
  const stats = getTradeKnowledgeStats();
  const matchedSites = query.trim() ? topInsights.length : stats.totalSites;

  return {
    query,
    totalSites: stats.totalSites,
    matchedSites,
    topInsights,
    categories: stats.categories,
    highCredibilityCount: stats.highCredibilityCount,
    averageCredibility: stats.averageCredibility,
  };
}
