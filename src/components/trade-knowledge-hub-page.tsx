'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Brain, Layers3, ShieldCheck, Search, Sparkles, TrendingUp, FilterX, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useSupabase } from '@/supabase/provider';
import { useLanguage } from '@/context/language-provider';
import {
  buildTradeKnowledgeSummary,
  getTradeKnowledgeCategories,
  getTradeKnowledgeStats,
  searchTradeInsights,
  searchVerifiedTradeInsights,
  siteMatchesCategorySlug,
  type TradeInsight,
} from '@/lib/trade-intelligence';

const copy = {
  ar: {
    title: 'مركز المعرفة التصديرية',
    description: 'قاعدة معرفة تشغيلية موثقة لمفتاح النيل، مع ترتيب ذكي للمصادر والفرص والمخاطر وفق المجالات الفعلية للتجارة الدولية.',
    search: 'ابحث في المواقع والفرص...',
    statsTitle: 'ملخص المنصة',
    categoriesTitle: 'الأقسام الموثقة',
    aiTitle: 'الملخص الذكي',
    sourceTitle: 'المصدر',
    opportunityTitle: 'الفرصة',
    credibilityTitle: 'الموثوقية',
    openSite: 'فتح الموقع',
    generated: 'تم التوليد اعتمادًا على قاعدة المعرفة المحلية',
    noResults: 'لا توجد نتائج موثقة كافية لهذا البحث. جرّب كلمة مثل: الجمارك، الأسواق، الامتثال، الشحن، HS Code',
    exploreCategory: 'فتح القسم',
    allSources: 'كل المصادر',
    clearFilter: 'إلغاء الفلتر',
    verifiedOnly: 'مصادر موثقة فقط',
    filterByCategory: 'تصفية بالفئة',
    filterByCountry: 'تصفية بالدولة',
    noVerifiedSources: 'لا توجد مصادر موثقة كافية لهذا البحث',
  },
  en: {
    title: 'Export Knowledge Hub',
    description: 'A verified working knowledge base for Nile Key, ranked by sources, opportunities, risks and trade-relevant value.',
    search: 'Search websites and opportunities...',
    statsTitle: 'Platform snapshot',
    categoriesTitle: 'Verified sections',
    aiTitle: 'Smart brief',
    sourceTitle: 'Source',
    opportunityTitle: 'Opportunity',
    credibilityTitle: 'Credibility',
    openSite: 'Open site',
    generated: 'Generated from the local knowledge base',
    noResults: 'No verified sources found for this query. Try terms like customs, market, compliance, shipping, HS Code.',
    exploreCategory: 'Open section',
    allSources: 'All sources',
    clearFilter: 'Clear filter',
    verifiedOnly: 'Verified sources only',
    filterByCategory: 'Filter by category',
    filterByCountry: 'Filter by country',
    noVerifiedSources: 'No verified sources found for this search',
  },
} as const;

function credibilityTone(percent: number) {
  if (percent >= 97) return 'default';
  if (percent >= 90) return 'secondary';
  return 'outline';
}

function SourceCard({ insight, labels }: { insight: TradeInsight; labels: typeof copy.ar }) {
  const isVerified = insight.is_verified === true || (insight.credibilityPercent || 0) >= 90;
  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={credibilityTone(insight.credibilityPercent)}>{insight.credibilityPercent}%</Badge>
          {isVerified && <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 me-1" />{language === 'ar' ? 'موثق' : 'Verified'}</Badge>}
          <Badge variant="outline">{insight.main_category}</Badge>
        </div>
        <CardTitle className="text-lg leading-tight">{insight.title}</CardTitle>
        <CardDescription className="text-sm leading-6">{insight.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-muted/30 p-4 text-sm leading-7">
          <div className="mb-2 font-semibold text-foreground">{labels.opportunityTitle}</div>
          {insight.ai_analysis_and_opportunities}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{labels.credibilityTitle}: {insight.credibilityPercent}%</span>
          <span>•</span>
          <span>{insight.recommendation}</span>
        </div>
        <Button asChild variant="outline" size="sm" className="w-full">
          <a href={insight.url} target="_blank" rel="noopener noreferrer">
            {labels.openSite}
            <ExternalLink className="ms-2 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

export function TradeKnowledgeHubPage() {
  const { user, isLoading } = useSupabase();
  const { language } = useLanguage();
  const labels = copy[language as 'ar' | 'en'];
  const [query, setQuery] = useState('');
  const [aiBrief, setAiBrief] = useState('');
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [minCredibility, setMinCredibility] = useState(90);

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = '/login';
    }
  }, [isLoading, user]);

  const stats = useMemo(() => getTradeKnowledgeStats(), []);
  const categories = useMemo(() => getTradeKnowledgeCategories(), []);
  const selectedCategory = useMemo(
    () => (selectedCategorySlug === 'all' ? null : categories.find((category) => category.slug === selectedCategorySlug) ?? null),
    [categories, selectedCategorySlug]
  );

  const summary = useMemo(() => {
    const briefQuery = [selectedCategory?.name ?? '', query].filter(Boolean).join(' ').trim();
    return buildTradeKnowledgeSummary(briefQuery);
  }, [query, selectedCategory?.name]);

  const insights = useMemo(() => {
    const briefQuery = [selectedCategory?.name ?? '', query].filter(Boolean).join(' ').trim();
    let results = searchVerifiedTradeInsights(briefQuery || '', 24);
    if (minCredibility > 0) {
      results = results.filter(item => (item.credibilityPercent || 0) >= minCredibility);
    }
    if (!selectedCategory) return results.slice(0, 12);
    return results.filter((item) => siteMatchesCategorySlug(item.main_category, selectedCategory.slug)).slice(0, 12);
  }, [query, selectedCategory, minCredibility]);

  const runAiBrief = async () => {
    setLoadingBrief(true);
    try {
      const response = await fetch('/api/trade-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: [selectedCategory?.name ?? '', query].filter(Boolean).join(' ').trim() }),
      });
      const payload = await response.json();
      setAiBrief(payload?.aiBrief || '');
    } catch (error) {
      console.error(error);
      setAiBrief('');
    } finally {
      setLoadingBrief(false);
    }
  };

  if (isLoading || !user) {
    return <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary"><Sparkles className="me-1 h-3.5 w-3.5" />AI Ready</Badge>
            <Badge variant="outline"><ShieldCheck className="me-1 h-3.5 w-3.5" />Company-only</Badge>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl">{labels.title}</CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7">{labels.description}</CardDescription>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-dashed">
              <CardHeader className="p-4 pb-2"><CardDescription>Sources</CardDescription></CardHeader>
              <CardContent className="p-4 pt-0 text-2xl font-semibold">{stats.totalSites}</CardContent>
            </Card>
            <Card className="border-dashed">
              <CardHeader className="p-4 pb-2"><CardDescription>Categories</CardDescription></CardHeader>
              <CardContent className="p-4 pt-0 text-2xl font-semibold">{stats.totalCategories}</CardContent>
            </Card>
            <Card className="border-dashed">
              <CardHeader className="p-4 pb-2"><CardDescription>90%+ credibility</CardDescription></CardHeader>
              <CardContent className="p-4 pt-0 text-2xl font-semibold">{stats.highCredibilityCount}</CardContent>
            </Card>
            <Card className="border-dashed">
              <CardHeader className="p-4 pb-2"><CardDescription>Avg. credibility</CardDescription></CardHeader>
              <CardContent className="p-4 pt-0 text-2xl font-semibold">{stats.averageCredibility}%</CardContent>
            </Card>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={labels.search}
                className="ps-9"
              />
            </div>
            <Button onClick={runAiBrief} disabled={loadingBrief} className="md:w-auto">
              <Brain className="me-2 h-4 w-4" />
              {loadingBrief ? 'جارٍ التوليد...' : 'Generate AI brief'}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} id="verified-toggle" />
              <label htmlFor="verified-toggle" className="text-sm cursor-pointer">{labels.verifiedOnly}</label>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Min credibility:</label>
              <select 
                value={minCredibility} 
                onChange={(e) => setMinCredibility(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm bg-background"
              >
                <option value={0}>All</option>
                <option value={80}>80%+</option>
                <option value={90}>90%+</option>
                <option value={95}>95%+</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><TrendingUp className="h-5 w-5" />{labels.aiTitle}</CardTitle>
            <CardDescription>{labels.generated}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiBrief ? (
              <div className="rounded-2xl border bg-muted/30 p-4 whitespace-pre-wrap leading-7">{aiBrief}</div>
            ) : (
              <div className="rounded-2xl border bg-muted/30 p-4 whitespace-pre-wrap leading-7">
                {query || selectedCategory
                  ? summary.topInsights.slice(0, 3).map((item, index) => `${index + 1}. ${item.title}: ${item.recommendation}`).join('\n\n')
                  : 'اكتب كلمة بحث ثم اضغط توليد الملخص الذكي للحصول على أفضل الفرص العملية.'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><Layers3 className="h-5 w-5" />{labels.categoriesTitle}</CardTitle>
            <CardDescription>{selectedCategory ? `${selectedCategory.count} ${language === 'ar' ? 'مصدر داخل هذا القسم' : 'sources in this section'}` : labels.allSources}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant={selectedCategory ? 'outline' : 'default'}
              size="sm"
              className="w-full justify-start"
              onClick={() => setSelectedCategorySlug('all')}
            >
              {labels.allSources}
            </Button>
            {categories.map((category) => (
              <div
                key={category.slug}
                className={`rounded-xl border p-3 transition ${selectedCategorySlug === category.slug ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-medium">{language === 'ar' ? category.name : category.nameEn}</div>
                    <div className="text-xs text-muted-foreground">
                      {category.count} {language === 'ar' ? 'مصادر' : 'sources'}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/important-sites/${category.slug}`}>{labels.exploreCategory}</Link>
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {category.topSites.slice(0, 3).map((site) => (
                    <button
                      key={`${category.slug}-${site.url}`}
                      type="button"
                      onClick={() => setSelectedCategorySlug(category.slug)}
                      className="rounded-full border border-muted-foreground/20 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary hover:text-foreground"
                    >
                      {site.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {selectedCategory && (
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setSelectedCategorySlug('all')}>
                <FilterX className="me-2 h-4 w-4" />
                {labels.clearFilter}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {insights.length > 0 ? insights.map((insight) => (
          <SourceCard key={`${insight.title}-${insight.url}`} insight={insight} labels={labels} />
        )) : (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="p-8 text-center text-muted-foreground">{labels.noResults}</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
