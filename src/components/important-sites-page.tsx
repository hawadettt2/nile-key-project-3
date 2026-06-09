'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ExternalLink,
  Globe,
  Shield,
  Search,
  Database,
  Code,
  Briefcase,
  Building2,
  AlertTriangle,
  ArrowLeft,
  Layers3,
  Sprout,
  Plane,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useSupabase } from '@/supabase/provider';
import { useLanguage } from '@/context/language-provider';
import {
  buildTradeKnowledgeSummary,
  findTradeKnowledgeCategoryBySlug,
  getTradeKnowledgeCategories,
  searchVerifiedTradeInsights,
  siteMatchesCategorySlug,
  type TradeKnowledgeCategory,
  type TradeInsight,
} from '@/lib/trade-intelligence';

const iconComponents: { [key: string]: React.ReactNode } = {
  Globe: <Globe className="h-8 w-8" />,
  Shield: <Shield className="h-8 w-8" />,
  Search: <Search className="h-8 w-8" />,
  Database: <Database className="h-8 w-8" />,
  Code: <Code className="h-8 w-8" />,
  Briefcase: <Briefcase className="h-8 w-8" />,
  Building2: <Building2 className="h-8 w-8" />,
  Sprout: <Sprout className="h-8 w-8" />,
  Plane: <Plane className="h-8 w-8" />,
  Default: <Globe className="h-8 w-8" />,
};

const copy = {
  ar: {
    title: 'قسم المواقع الهامة',
    subtitle: 'عرض تفصيلي للقطاع المختار داخل قاعدة المعرفة التجارية لمفتاح النيل.',
    search: 'ابحث داخل هذا القسم...',
    back: 'العودة إلى مركز المعرفة',
    openSite: 'فتح الموقع',
    opportunity: 'الفرصة',
    credibility: 'الموثوقية',
    allSources: 'كل المصادر',
    noCategory: 'القسم المطلوب غير موجود أو غير متاح في قاعدة المعرفة الحالية.',
    categoryLabel: 'القسم',
    sourcesLabel: 'مصدر',
    clearFilter: 'إلغاء الفلتر',
  },
  en: {
    title: 'Important Sites',
    subtitle: 'A focused view of the selected knowledge section for Nile Key.',
    search: 'Search within this section...',
    back: 'Back to knowledge hub',
    openSite: 'Open site',
    opportunity: 'Opportunity',
    credibility: 'Credibility',
    allSources: 'All sources',
    noCategory: 'The requested section was not found in the current knowledge base.',
    categoryLabel: 'Section',
    sourcesLabel: 'source',
    clearFilter: 'Clear filter',
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
          <Badge variant={credibilityTone(insight.credibilityPercent)}>{insight.credibilityPercent}%</Badge>
          <Badge variant="outline">{insight.main_category}</Badge>
        </div>
        <CardTitle className="text-lg leading-tight">{insight.title}</CardTitle>
        <CardDescription className="text-sm leading-6">{insight.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-muted/30 p-4 text-sm leading-7">
          <div className="mb-2 font-semibold text-foreground">{labels.opportunity}</div>
          {insight.ai_analysis_and_opportunities}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{labels.credibility}: {insight.credibilityPercent}%</span>
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

function CategoryHeader({ category, language }: { category: TradeKnowledgeCategory; language: 'ar' | 'en' }) {
  const title = language === 'ar' ? category.name : category.nameEn;
  const description = language === 'ar' ? category.descriptionAr : category.descriptionEn;
  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{category.count} {language === 'ar' ? 'مصدر' : 'sources'}</Badge>
              <Badge variant="outline">{title}</Badge>
            </div>
            <CardTitle className="flex items-center gap-3 text-3xl">
              {iconComponents.Default}
              {title}
            </CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export function ImportantSitesPage({ categoryId: categorySlug }: { categoryId?: string }) {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useSupabase();
  const { language } = useLanguage();
  const labels = copy[language as 'ar' | 'en'];
  const categories = useMemo(() => getTradeKnowledgeCategories(), []);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.replace('/login');
    }
  }, [isUserLoading, router, user]);

  const category = useMemo(
    () => (categorySlug ? findTradeKnowledgeCategoryBySlug(categorySlug) : null),
    [categorySlug]
  );

  const summary = useMemo(() => {
    const query = [category?.name ?? '', search].filter(Boolean).join(' ').trim();
    return buildTradeKnowledgeSummary(query);
  }, [category?.name, search]);

  const visibleInsights = useMemo(() => {
    if (!category) return [];
    const base = searchVerifiedTradeInsights([category.name, search].filter(Boolean).join(' ').trim() || category.name, 30);
    return base.filter((site) => siteMatchesCategorySlug(site.main_category, category.slug)).slice(0, 12);
  }, [category, search]);

  if (isUserLoading || !user) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{language === 'ar' ? 'القسم غير موجود' : 'Section not found'}</AlertTitle>
          <AlertDescription>{labels.noCategory}</AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">{labels.title}</CardTitle>
            <CardDescription>{labels.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((item) => (
              <Button key={item.slug} variant="outline" asChild className="h-auto justify-start rounded-2xl p-4 text-start">
                <a href={`/important-sites/${item.slug}`}>
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-medium">{language === 'ar' ? item.name : item.nameEn}</span>
                    <span className="text-xs text-muted-foreground">{item.count} {labels.sourcesLabel}</span>
                  </div>
                </a>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const title = language === 'ar' ? category.name : category.nameEn;
  const description = language === 'ar' ? category.descriptionAr : category.descriptionEn;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{category.count} {labels.sourcesLabel}</Badge>
            <Badge variant="outline">{title}</Badge>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-2">
                <CardTitle className="text-3xl">{title}</CardTitle>
                <CardDescription className="max-w-3xl text-base leading-7">{description}</CardDescription>
              </div>

              <Button variant="outline" onClick={() => router.push('/important-sites')}>
                <ArrowLeft className="me-2 h-4 w-4" />
                {labels.back}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-dashed">
              <CardHeader className="p-4 pb-2"><CardDescription>{language === 'ar' ? 'إجمالي المصادر' : 'Total sources'}</CardDescription></CardHeader>
              <CardContent className="p-4 pt-0 text-2xl font-semibold">{category.count}</CardContent>
            </Card>
            <Card className="border-dashed">
              <CardHeader className="p-4 pb-2"><CardDescription>{language === 'ar' ? 'الأعلى موثوقية' : 'High credibility'}</CardDescription></CardHeader>
              <CardContent className="p-4 pt-0 text-2xl font-semibold">{category.topSites.filter((site) => /9\d|100/.test(site.credibility_score)).length}</CardContent>
            </Card>
            <Card className="border-dashed">
              <CardHeader className="p-4 pb-2"><CardDescription>{language === 'ar' ? 'النتائج الظاهرة' : 'Visible results'}</CardDescription></CardHeader>
              <CardContent className="p-4 pt-0 text-2xl font-semibold">{visibleInsights.length}</CardContent>
            </Card>
            <Card className="border-dashed">
              <CardHeader className="p-4 pb-2"><CardDescription>{language === 'ar' ? 'متوسط الثقة' : 'Average credibility'}</CardDescription></CardHeader>
              <CardContent className="p-4 pt-0 text-2xl font-semibold">{summary.averageCredibility}%</CardContent>
            </Card>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={labels.search}
              className="ps-9"
            />
          </div>
          <Button variant="outline" onClick={() => setSearch('')}>
            {labels.clearFilter}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleInsights.length > 0 ? visibleInsights.map((insight) => (
          <InsightCard key={`${insight.title}-${insight.url}`} insight={insight} labels={labels} />
        )) : (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="p-8 text-center text-muted-foreground">
              {language === 'ar' ? 'لا توجد نتائج داخل هذا القسم. جرّب كلمات مثل: الجمارك، الشحن، الامتثال، HS Code.' : 'No results in this section. Try terms like customs, shipping, compliance, or HS Code.'}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
