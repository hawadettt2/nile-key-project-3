
  'use client';

  import { useEffect, useMemo, useState } from 'react';
  import Link from 'next/link';
  import { ExternalLink, Brain, Layers3, ShieldCheck, Search, Sparkles, TrendingUp } from 'lucide-react';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
  import { Badge } from '@/components/ui/badge';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import { useSupabase } from '@/supabase/provider';
  import { useLanguage } from '@/context/language-provider';
  import { defaultSiteCategories } from '@/lib/default-sites';
import type { TranslationKeys } from '@/lib/i18n';
  import {
    buildTradeKnowledgeSummary,
    getTradeKnowledgeStats,
    searchTradeInsights,
    type TradeInsight,
  } from '@/lib/trade-intelligence';

  const copy = {
    ar: {
      title: 'مركز المعرفة التصديرية',
      description: 'قاعدة معرفة تشغيلية مبنية على 190 مصدرًا موثوقًا لمفتاح النيل، مع ترتيب ذكي للفرص والمخاطر والمرجعيات.',
      search: 'ابحث في المواقع والفرص...',
      statsTitle: 'ملخص المنصة',
      categoriesTitle: 'الأقسام السريعة',
      aiTitle: 'الملخص الذكي',
      sourceTitle: 'المصدر',
      opportunityTitle: 'الفرصة',
      credibilityTitle: 'الموثوقية',
      openSite: 'فتح الموقع',
      generated: 'تم التوليد اعتمادًا على قاعدة المعرفة المحلية',
      noResults: 'لا توجد نتائج مطابقة، جرّب كلمة مثل: الجمارك، الأسواق، الامتثال، الشحن، HS Code',
      exploreCategory: 'استعراض القسم',
    },
    en: {
      title: 'Export Knowledge Hub',
      description: 'A working knowledge base for Nile Key with 190 trusted sources, ranked for opportunities, risks and operational value.',
      search: 'Search websites and opportunities...',
      statsTitle: 'Platform snapshot',
      categoriesTitle: 'Quick sections',
      aiTitle: 'Smart brief',
      sourceTitle: 'Source',
      opportunityTitle: 'Opportunity',
      credibilityTitle: 'Credibility',
      openSite: 'Open site',
      generated: 'Generated from the local knowledge base',
      noResults: 'No matching results. Try terms like customs, market, compliance, shipping, HS Code.',
      exploreCategory: 'Explore section',
    },
  } as const;

  function credibilityTone(percent: number) {
    if (percent >= 97) return 'default';
    if (percent >= 90) return 'secondary';
    return 'outline';
  }

  function InsightCard({ insight, labels }: { insight: TradeInsight; labels: typeof copy.ar }) {
    return (
      <Card className="h-full">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={credibilityTone(insight.credibilityPercent)}>{insight.credibility_score}</Badge>
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
    const { language, t } = useLanguage();
    const labels = copy[language as 'ar' | 'en'];
    const [query, setQuery] = useState('');
    const [aiBrief, setAiBrief] = useState('');
    const [loadingBrief, setLoadingBrief] = useState(false);

    useEffect(() => {
      if (!isLoading && !user) {
        window.location.href = '/login';
      }
    }, [isLoading, user]);

    const stats = useMemo(() => getTradeKnowledgeStats(), []);
    const insights = useMemo(() => searchTradeInsights(query || '', 9), [query]);
    const summary = useMemo(() => buildTradeKnowledgeSummary(query), [query]);

    const categoryCards = useMemo(() => {
      return [...defaultSiteCategories].slice(0, 6);
    }, []);

    const runAiBrief = async () => {
      setLoadingBrief(true);
      try {
        const response = await fetch('/api/trade-intelligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
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
              <CardTitle className="text-3xl">{copy[language as 'ar' | 'en'].title}</CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7">{copy[language as 'ar' | 'en'].description}</CardDescription>
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
          <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={copy[language as 'ar' | 'en'].search}
                className="ps-9"
              />
            </div>
            <Button onClick={runAiBrief} disabled={loadingBrief} className="md:w-auto">
              <Brain className="me-2 h-4 w-4" />
              {loadingBrief ? 'جارٍ التوليد...' : 'Generate AI brief'}
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl"><TrendingUp className="h-5 w-5" />{copy[language as 'ar' | 'en'].aiTitle}</CardTitle>
              <CardDescription>{copy[language as 'ar' | 'en'].generated}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiBrief ? (
                <div className="rounded-2xl border bg-muted/30 p-4 whitespace-pre-wrap leading-7">{aiBrief}</div>
              ) : (
                <div className="rounded-2xl border bg-muted/30 p-4 whitespace-pre-wrap leading-7">
                  {query
                    ? summary.topInsights.slice(0, 3).map((item, index) => `${index + 1}. ${item.title}: ${item.recommendation}`).join('\n\n')
                    : 'اكتب كلمة بحث ثم اضغط توليد الملخص الذكي للحصول على أفضل الفرص العملية.'}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl"><Layers3 className="h-5 w-5" />{copy[language as 'ar' | 'en'].categoriesTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryCards.map((category) => (
                <div key={category.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{t[category.titleKey as TranslationKeys]}</div>
                      <div className="text-xs text-muted-foreground">{category.sites.length} sites</div>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/important-sites/${category.id}`}>{copy[language as 'ar' | 'en'].exploreCategory}</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {insights.length > 0 ? insights.map((insight) => (
            <InsightCard key={`${insight.title}-${insight.url}`} insight={insight} labels={labels} />
          )) : (
            <Card className="md:col-span-2 xl:col-span-3">
              <CardContent className="p-8 text-center text-muted-foreground">{copy[language as 'ar' | 'en'].noResults}</CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }
