
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ExternalLink, Globe, Shield, Search, Database, Code, Briefcase, Building2, AlertTriangle, PlusCircle, Trash2, Loader2, Landmark, Sprout, Plane } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useSupabase } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import { useLanguage } from '@/context/language-provider';
import { DeleteCategoryAlert } from './delete-category-alert';
import { AddSiteDialog } from './add-site-dialog';
import { defaultSiteCategories } from '@/lib/default-sites';
import type { TranslationKeys } from '@/lib/i18n';
import { searchTradeInsights } from '@/lib/trade-intelligence';

const iconComponents: { [key: string]: React.ReactNode } = {
  Globe: <Globe className="h-8 w-8" />,
  Shield: <Shield className="h-8 w-8" />,
  Search: <Search className="h-8 w-8" />,
  Database: <Database className="h-8 w-8" />,
  Code: <Code className="h-8 w-8" />,
  Briefcase: <Briefcase className="h-8 w-8" />,
  Building2: <Building2 className="h-8 w-8" />,
  Landmark: <Landmark className="h-8 w-8" />,
  Sprout: <Sprout className="h-8 w-8" />,
  Plane: <Plane className="h-8 w-8" />,
  Default: <Globe className="h-8 w-8" />,
};

interface ImportantSitesPageProps {
  categoryId?: string;
}

export function ImportantSitesPage({ categoryId: propCategoryId }: ImportantSitesPageProps) {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useSupabase();
  const { t } = useLanguage();
  const categoryId = propCategoryId || (params?.categoryId as string | undefined);

  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false);
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isCustomCategory = useMemo(
    () => Boolean(categoryId && !defaultSiteCategories.some((c) => c.id === categoryId)),
    [categoryId]
  );

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    if (!categoryId) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        if (!isCustomCategory) {
          const defaultData = defaultSiteCategories.find((c) => c.id === categoryId) ?? null;
          setCategory(defaultData);
          setSites(defaultData?.sites ?? []);
          return;
        }

        const { data: catData, error: catError } = await supabase
          .from('site_categories')
          .select('*')
          .eq('id', categoryId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (catError) throw catError;
        setCategory(catData ?? null);

        const { data: sitesData, error: sitesError } = await supabase
          .from('sites')
          .select('*')
          .eq('category_id', categoryId)
          .eq('user_id', user.id)
          .order('title', { ascending: true });

        if (sitesError) throw sitesError;
        setSites(sitesData ?? []);
      } catch (error) {
        console.error('Error fetching important sites data:', error);
        setCategory(null);
        setSites([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [categoryId, isCustomCategory, isUserLoading, router, user]);

  const aiInsights = useMemo(() => {
    const categoryTitle = isCustomCategory
      ? (category?.title || category?.name || '')
      : (category ? t[(category.titleKey as TranslationKeys)] : '');
    const baseQuery = [categoryTitle, search].filter(Boolean).join(' ');
    return searchTradeInsights(baseQuery || categoryTitle || '', 6);
  }, [category, isCustomCategory, search, t]);

  if (isLoading || isUserLoading) {
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

  const currentCategory = isCustomCategory ? category : defaultSiteCategories.find((c) => c.id === categoryId) ?? null;
  const currentSites = isCustomCategory ? sites : currentCategory?.sites ?? [];

  if (!currentCategory && categoryId) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Category Not Found</AlertTitle>
        <AlertDescription>The requested category does not exist or you do not have permission to view it.</AlertDescription>
      </Alert>
    );
  }

  const iconKey = currentCategory?.icon || 'Default';
  const IconComponent = iconComponents[iconKey] || iconComponents.Default;
  const title = isCustomCategory
    ? currentCategory?.title || currentCategory?.name || 'Untitled Category'
    : currentCategory
      ? t[currentCategory.titleKey as TranslationKeys]
      : 'Important Sites';
  const description = isCustomCategory
    ? currentCategory?.description || ''
    : currentCategory
      ? t[currentCategory.descriptionKey as TranslationKeys]
      : '';

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 space-y-2">
              <CardTitle className="font-headline flex items-center gap-3 text-3xl">
                {IconComponent}
                {title}
              </CardTitle>
              <CardDescription className="text-base leading-7">{description}</CardDescription>
              {isCustomCategory && <Badge variant="secondary">Custom company category</Badge>}
            </div>
            {isCustomCategory && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsAddSiteOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add site
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setIsDeleteCategoryOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete category
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search within this category..."
              className="ps-9"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {aiInsights.map((item) => (
              <Card key={`${item.title}-${item.url}`} className="h-full">
                <CardHeader className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{item.main_category}</Badge>
                    <Badge variant="secondary">{item.credibility_score}</Badge>
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-7 text-muted-foreground">{item.ai_analysis_and_opportunities}</p>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a href={item.url.startsWith('http') ? item.url : `https://${item.url}`} target="_blank" rel="noopener noreferrer">
                      Visit source <ExternalLink className="ms-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Accordion type="single" collapsible className="w-full space-y-2">
            {currentSites.length > 0 ? (
              currentSites.map((site: any, siteIndex: number) => {
                const siteTitle = isCustomCategory ? site.title : t[site.titleKey as TranslationKeys];
                const siteDescription = isCustomCategory ? site.description : t[site.descriptionKey as TranslationKeys];
                return (
                  <AccordionItem value={`site-${siteIndex}`} key={site.id || site.url} className="rounded-md border bg-muted/30">
                    <AccordionTrigger className="px-4 py-3 text-start text-base font-medium hover:no-underline">
                      {siteTitle}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 px-4 pb-4 text-sm">
                      <p className="text-muted-foreground">{siteDescription}</p>
                      <Button asChild variant="outline" size="sm">
                        <a href={site.url.startsWith('http') ? site.url : `https://${site.url}`} target="_blank" rel="noopener noreferrer">
                          {t.visitSiteButton}
                          <ExternalLink className="ms-2 h-4 w-4" />
                        </a>
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
                <p className="text-muted-foreground">{isCustomCategory ? 'Add your first site to this category using the Add site button.' : 'This default category has no sites.'}</p>
              </div>
            )}
          </Accordion>
        </CardContent>
      </Card>

      {isCustomCategory && (
        <>
          <AddSiteDialog isOpen={isAddSiteOpen} onOpenChange={setIsAddSiteOpen} categoryId={categoryId as string} />
          <DeleteCategoryAlert isOpen={isDeleteCategoryOpen} onOpenChange={setIsDeleteCategoryOpen} categoryId={categoryId as string} onDeleted={() => router.push('/important-sites')} />
        </>
      )}
    </div>
  );
}
