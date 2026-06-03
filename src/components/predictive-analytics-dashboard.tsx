'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/language-provider";
import { Brain, Loader2, CalendarClock, TrendingUp, Sparkles, MapPin, Search, Info, ShieldCheck, Database, AlertTriangle } from "lucide-react";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Separator } from './ui/separator';
import { useSupabase } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import type { PredictiveAnalytics, HsCode, ExportOpportunity } from '@/lib/supabase-types';

function cleanValue(value: unknown) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function includesAny(source: string, query: string) {
  if (!query.trim()) return true;
  const needle = query.toLowerCase().trim();
  return source.toLowerCase().includes(needle);
}

function HarvestAdvisor() {
  const { t, language } = useLanguage();
  const { user } = useSupabase();
  const [crop, setCrop] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ analytics: PredictiveAnalytics[]; hsCodes: HsCode[]; note: string } | null>(null);

  const handlePredict = async () => {
    if (!crop.trim()) return;
    setIsLoading(true);
    setResults(null);
    try {
      const [analyticsResp, hsResp] = await Promise.all([
        user
          ? supabase.from('predictive_analytics').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null } as any),
        supabase
          .from('hs_codes')
          .select('*')
          .or(`code.ilike.%${crop}%,product_name_ar.ilike.%${crop}%,product_name_en.ilike.%${crop}%,product_description.ilike.%${crop}%`)
          .order('code', { ascending: true })
          .limit(6),
      ]);

      const analytics = (analyticsResp?.data ?? []).filter((row: PredictiveAnalytics) => includesAny(row.crop_type || '', crop));
      const hsCodes = (hsResp.data ?? []).filter((row) => includesAny([row.code, row.product_name_ar, row.product_name_en, row.product_description, row.category].filter(Boolean).join(' '), crop));

      setResults({
        analytics,
        hsCodes,
        note: location.trim()
          ? (language === 'ar'
              ? `تمت المراجعة على أساس المحصول والموقع: ${crop} / ${location}`
              : `Reviewed using crop and location: ${crop} / ${location}`)
          : (language === 'ar'
              ? `تمت المراجعة على أساس المحصول: ${crop}`
              : `Reviewed using crop: ${crop}`),
      });
    } catch (error) {
      console.error(error);
      setResults({ analytics: [], hsCodes: [], note: language === 'ar' ? 'تعذر جلب السجلات الموثقة من قاعدة البيانات.' : 'Could not load verified records from the database.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border p-6">
      <h3 className="font-headline text-xl flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" />{t.harvestAdvisorTitle}</h3>
      <p className="text-muted-foreground">{t.harvestAdvisorDescription}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="crop-harvest">{t.harvestAdvisorCropLabel}</Label>
          <Input id="crop-harvest" value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="e.g., Dates / التمور" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location-harvest">{t.harvestAdvisorLocationLabel}</Label>
          <Input id="location-harvest" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Minya, Egypt" />
        </div>
      </div>
      <Button onClick={handlePredict} disabled={isLoading || !crop.trim()}>
        {isLoading && <Loader2 className="mx-2 h-4 w-4 animate-spin" />}
        {t.harvestAdvisorButton}
      </Button>
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mx-4 text-muted-foreground">{language === 'ar' ? 'جارٍ التحقق من السجلات الموثقة...' : 'Checking verified records...'}</p>
        </div>
      )}
      {results && (
        <div className="space-y-4 pt-4">
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle className="font-bold">{language === 'ar' ? 'نتائج موثقة فقط' : 'Verified results only'}</AlertTitle>
            <AlertDescription>{results.note}</AlertDescription>
          </Alert>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-lg border p-4">
              <h4 className="font-semibold flex items-center gap-2"><Database className="h-4 w-4" />{language === 'ar' ? 'السجلات التنبؤية' : 'Predictive records'}</h4>
              {results.analytics.length > 0 ? results.analytics.map((row) => (
                <div key={row.id} className="rounded-md border bg-muted/30 p-3 text-sm space-y-2">
                  <div className="font-medium">{row.crop_type || (language === 'ar' ? 'محصول غير محدد' : 'Unnamed crop')}</div>
                  <div><span className="font-semibold">{language === 'ar' ? 'نافذة الحصاد' : 'Harvest window'}:</span> {row.harvest_time_prediction || (language === 'ar' ? 'غير متوفر' : 'Not available')}</div>
                  <div><span className="font-semibold">{language === 'ar' ? 'الفرص السوقية' : 'Market opportunities'}:</span> {Array.isArray(row.market_opportunities) ? row.market_opportunities.map((v: any) => cleanValue(v)).join(' • ') : cleanValue(row.market_opportunities) || (language === 'ar' ? 'لا توجد بيانات موثقة' : 'No verified data')}</div>
                </div>
              )) : (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  {language === 'ar' ? 'لا توجد سجلات تنبؤية موثقة لهذا المحصول بعد.' : 'No verified predictive records exist for this crop yet.'}
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <h4 className="font-semibold flex items-center gap-2"><Search className="h-4 w-4" />{language === 'ar' ? 'مطابقة أكواد HS' : 'Matched HS codes'}</h4>
              {results.hsCodes.length > 0 ? results.hsCodes.map((code) => (
                <div key={code.id} className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
                  <div className="font-medium">{code.code} — {code.product_name_ar || code.product_name_en || (language === 'ar' ? 'منتج غير محدد' : 'Unnamed product')}</div>
                  <div className="text-muted-foreground">{code.product_description}</div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{language === 'ar' ? 'الفئة' : 'Category'}: {code.category || '-'}</span>
                    <span>•</span>
                    <span>{language === 'ar' ? 'تعرفة' : 'Tariff'}: {code.tariff_rate != null ? `${Number(code.tariff_rate) * 100}%` : '-'}</span>
                    <span>•</span>
                    <span>{language === 'ar' ? 'زراعي' : 'Agricultural'}: {code.is_agricultural ? (language === 'ar' ? 'نعم' : 'Yes') : (language === 'ar' ? 'لا' : 'No')}</span>
                  </div>
                </div>
              )) : (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  {language === 'ar' ? 'لا توجد أكواد HS مطابقة موثقة لهذا البحث.' : 'No verified HS code matches were found for this search.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MarketOpportunityFinder() {
  const { t, language } = useLanguage();
  const [product, setProduct] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ opportunities: ExportOpportunity[]; note: string } | null>(null);

  const handleSearch = async () => {
    if (!product.trim()) return;
    setIsLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase
        .from('export_opportunities')
        .select('*')
        .or(`product_name_ar.ilike.%${product}%,product_name_en.ilike.%${product}%,target_country.ilike.%${product}%`)
        .order('confidence_score', { ascending: false })
        .limit(6);
      if (error) throw error;
      setResult({
        opportunities: (data ?? []).filter((row: ExportOpportunity) => includesAny([row.product_name_ar, row.product_name_en, row.target_country, row.target_market_region ?? ''].filter(Boolean).join(' '), product)),
        note: language === 'ar'
          ? 'النتائج التالية مأخوذة من سجلات فرص التصدير الموثقة في قاعدة البيانات.'
          : 'The results below are taken from verified export-opportunity records in the database.',
      });
    } catch (error) {
      console.error(error);
      setResult({ opportunities: [], note: language === 'ar' ? 'تعذر جلب فرص التصدير الموثقة.' : 'Could not load verified export opportunities.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border p-6">
      <h3 className="font-headline text-xl flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />{t.marketOpportunityTitle}</h3>
      <p className="text-muted-foreground">{t.marketOpportunityDescription}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="crop-market">{t.marketOpportunityCropLabel}</Label>
          <Input id="crop-market" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g., Egyptian Garlic" />
        </div>
      </div>
      <Button onClick={handleSearch} disabled={isLoading || !product.trim()}>
        {isLoading && <Loader2 className="mx-2 h-4 w-4 animate-spin" />}
        {t.marketOpportunityButton}
      </Button>
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mx-4 text-muted-foreground">{language === 'ar' ? 'جارٍ التحقق من الفرص الموثقة...' : 'Checking verified opportunities...'}</p>
        </div>
      )}
      {result && (
        <div className="space-y-4 pt-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle className="font-bold">{language === 'ar' ? 'فرص موثقة فقط' : 'Verified opportunities only'}</AlertTitle>
            <AlertDescription>{result.note}</AlertDescription>
          </Alert>
          {result.opportunities.length > 0 ? (
            <div className="space-y-3">
              {result.opportunities.map((opp) => (
                <div key={opp.id} className="p-4 border rounded-md bg-muted/30 space-y-2">
                  <div className="font-bold flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> {opp.target_country} {opp.target_market_region ? `• ${opp.target_market_region}` : ''}
                  </div>
                  <p className="font-semibold text-primary">{opp.product_name_ar || opp.product_name_en}</p>
                  <p className="text-sm text-muted-foreground">{opp.hs_code_id ? `HS Code Ref: ${opp.hs_code_id}` : (language === 'ar' ? 'مرجع HS Code غير متوفر' : 'No HS code reference')}</p>
                  <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                    <span>{language === 'ar' ? 'الطلب' : 'Demand'}: {opp.demand_trend || '-'}</span>
                    <span>{language === 'ar' ? 'المنافسة' : 'Competition'}: {opp.competition_level || '-'}</span>
                    <span>{language === 'ar' ? 'الثقة' : 'Confidence'}: {opp.confidence_score != null ? Number(opp.confidence_score).toFixed(2) : '-'}</span>
                    <span>{language === 'ar' ? 'الحالة' : 'Status'}: {opp.status || '-'}</span>
                  </div>
                  {opp.logistics_notes && <p className="text-sm text-muted-foreground">{opp.logistics_notes}</p>}
                  {opp.entry_barriers && <p className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">{cleanValue(opp.entry_barriers)}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              {language === 'ar' ? 'لا توجد فرص تصدير موثقة مطابقة لهذا البحث.' : 'No verified export opportunities matched this search.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PredictiveAnalyticsDashboard() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Brain className="h-6 w-6" /> {t.predictiveAnalyticsTitle}
          </CardTitle>
          <CardDescription>{t.predictiveAnalyticsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <Info className="h-4 w-4 !text-blue-500" />
            <AlertTitle className="text-blue-800 dark:text-blue-300">{t.aiDataSourceTitle}</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-400">
              {t.aiDataSourceDescription}
            </AlertDescription>
          </Alert>
          <HarvestAdvisor />
          <Separator />
          <MarketOpportunityFinder />
        </CardContent>
      </Card>
    </div>
  );
}
