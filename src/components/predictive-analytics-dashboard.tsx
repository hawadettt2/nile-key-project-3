'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/language-provider";
import { Brain, Loader2, CalendarClock, TrendingUp, Sparkles, MapPin, Search, Info } from "lucide-react";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { predictHarvestTime, PredictHarvestTimeOutput } from '@/ai/flows/predict-harvest-time';
import { findMarketOpportunities, FindMarketOpportunitiesOutput } from '@/ai/flows/find-market-opportunities';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Separator } from './ui/separator';

function HarvestAdvisor() {
    const { t, language } = useLanguage();
    const { toast } = useToast();
    const [crop, setCrop] = useState('');
    const [location, setLocation] = useState('Egypt');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<PredictHarvestTimeOutput | null>(null);

    const handlePredict = async () => {
        if (!crop.trim()) return;
        setIsLoading(true);
        setResult(null);
        try {
            const prediction = await predictHarvestTime({ 
                crop, 
                location,
                language: language === 'ar' ? 'Arabic' : 'English'
            });
            setResult(prediction);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: t.aiSearchFailTitle, description: t.aiSearchFailDescription });
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
                    <Input id="crop-harvest" value={crop} onChange={e => setCrop(e.target.value)} placeholder="e.g. Navel Oranges"/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="location-harvest">{t.harvestAdvisorLocationLabel}</Label>
                    <Input id="location-harvest" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Minya, Egypt"/>
                </div>
            </div>
            <Button onClick={handlePredict} disabled={isLoading}>
                {isLoading && <Loader2 className="mx-2 h-4 w-4 animate-spin" />}
                {t.harvestAdvisorButton}
            </Button>
            {isLoading && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mx-4 text-muted-foreground">{t.geminiAnalyzing}</p>
                </div>
            )}
            {result && (
                <div className="space-y-4 pt-4">
                    <Alert>
                        <Sparkles className="h-4 w-4" />
                        <AlertTitle className="font-bold">{result.optimalWindow}</AlertTitle>
                        <AlertDescription>{t.harvestResultsTitle}</AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                        <h4 className="font-semibold">{t.harvestFactorsTitle}</h4>
                        <ul className="list-disc pl-5 text-muted-foreground space-y-1 text-sm">
                            {result.keyFactors.map((factor, i) => <li key={i}>{factor}</li>)}
                        </ul>
                    </div>
                     <div className="space-y-2">
                        <h4 className="font-semibold">{t.harvestAdviceTitle}</h4>
                        <p className="text-muted-foreground text-sm">{result.strategicAdvice}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

function MarketOpportunityFinder() {
    const { t, language } = useLanguage();
    const { toast } = useToast();
    const [crop, setCrop] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<FindMarketOpportunitiesOutput | null>(null);

    const handleSearch = async () => {
        if (!crop.trim()) return;
        setIsLoading(true);
        setResult(null);
        try {
            const opportunities = await findMarketOpportunities({ 
                crop, 
                exportingCountry: "Egypt",
                language: language === 'ar' ? 'Arabic' : 'English'
            });
            setResult(opportunities);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: t.aiSearchFailTitle, description: t.aiSearchFailDescription });
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
                    <Input id="crop-market" value={crop} onChange={e => setCrop(e.target.value)} placeholder="e.g. Egyptian Garlic"/>
                </div>
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading && <Loader2 className="mx-2 h-4 w-4 animate-spin" />}
                {t.marketOpportunityButton}
            </Button>
            {isLoading && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mx-4 text-muted-foreground">{t.geminiAnalyzing}</p>
                </div>
            )}
            {result && (
                <div className="space-y-4 pt-4">
                   <h4 className="font-semibold">{t.marketOpportunityResultsTitle}</h4>
                    {result.opportunities.map((opp, i) => (
                        <div key={i} className="p-4 border rounded-md bg-muted/30">
                            <div className="font-bold flex items-center gap-2"><MapPin className="h-4 w-4" /> {opp.region} ({opp.window})</div>
                            <p className="font-semibold text-primary">{opp.opportunity}</p>
                            <p className="text-sm text-muted-foreground">{opp.reasoning}</p>
                            <p className="text-xs font-mono pt-2">{t.confidenceScore}: {opp.confidenceScore.toFixed(2)}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
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
