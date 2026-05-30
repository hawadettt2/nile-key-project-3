
import tradeSites from '@/data/trade-intelligence-sites.json';

export type TradeKnowledgeSite = {
  title: string;
  url: string;
  main_category: string;
  description: string;
  credibility_score: string;
  ai_analysis_and_opportunities: string;
};

export type TradeInsight = TradeKnowledgeSite & {
  credibilityPercent: number;
  relevanceScore: number;
  recommendation: string;
  searchTerms: string[];
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

const CATEGORY_ALIASES: Record<string, string> = {
  'الجهاتها الحكومية والجمارك والوزارات الاستراتيجية': 'الجهات الحكومية والجمارك والوزارات الاستراتيجية',
  'اللوجستيات, الشحن الدولي وسلاسل الإمداد': 'اللوجستيات، الشحن الدولي وسلاسل الإمداد',
};

function normalizeCategory(value: string): string {
  return CATEGORY_ALIASES[value.trim()] ?? value.trim();
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[ً-ٰٟ]/g, '')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPercent(value: string): number {
  const match = value.match(/(\d{1,3})/);
  return match ? Math.min(100, Number.parseInt(match[1], 10)) : 0;
}

function tokenize(query: string): string[] {
  const normalized = normalizeText(query);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean).slice(0, 12);
}

function getRecommendation(site: TradeKnowledgeSite): string {
  const category = normalizeCategory(site.main_category);
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
    const category = normalizeCategory(site.main_category);
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

export function groupTradeKnowledgeSites() {
  const grouped = new Map<string, TradeKnowledgeSite[]>();
  for (const site of SITES) {
    const category = normalizeCategory(site.main_category);
    const list = grouped.get(category) ?? [];
    list.push(site);
    grouped.set(category, list);
  }

  return [...grouped.entries()]
    .map(([name, sites]) => ({
      name,
      sites: sites.sort((a, b) => extractPercent(b.credibility_score) - extractPercent(a.credibility_score)),
    }))
    .sort((a, b) => b.sites.length - a.sites.length);
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
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  return normalizedQuery ? ranked.slice(0, limit) : ranked.slice(0, limit);
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
