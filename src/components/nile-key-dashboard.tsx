
"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Package, AlertTriangle, Truck, DollarSign, CheckCircle, Bot, Languages, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { generateExportContract, type GenerateExportContractInput } from "@/ai/flows/generate-export-contract";
import { diplomaticTranslate, type DiplomaticTranslateInput } from "@/ai/flows/diplomatic-translator";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/context/language-provider";

export default function NileKeyDashboard() {
  const { language, t } = useLanguage();
  
  type Shipment = { 
    id: string; 
    createdAt: { seconds: number, nanoseconds: number };
    price: number;
    status: string;
  };

  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [contractText, setContractText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationInput, setTranslationInput] = useState("");
  const [translatedText, setTranslatedText] = useState("");

  const shipmentsQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'shipments'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: shipments, isLoading: isLoadingShipments } = useCollection<Shipment>(shipmentsQuery);

  const stats = useMemo(() => {
    if (!shipments) return { totalShipments: 0, totalValue: 0, inTransit: 0, completed: 0 };
    const totalValue = shipments.reduce((sum, s) => sum + s.price, 0);
    const inTransit = shipments.filter(s => s.status === t.shipmentStatusOption4).length;
    const completed = shipments.filter(s => s.status === t.shipmentStatusOption5).length;
    return { totalShipments: shipments.length, totalValue, inTransit, completed };
  }, [shipments, t]);

  
  const handleGenerateContract = async () => {
    setIsGeneratingContract(true);
    setContractText("");
    try {
      const input: GenerateExportContractInput = { language: language === 'ar' ? 'Arabic' : 'English' };
      const result = await generateExportContract(input);
      setContractText(result.contractText);
    } catch (error) {
      console.error("Failed to generate contract:", error);
      toast({ variant: "destructive", title: t.generateContractFailTitle, description: t.generateContractFailDescription });
    } finally {
      setIsGeneratingContract(false);
    }
  };

  const handleTranslate = async () => {
    if (!translationInput.trim()) return;
    setIsTranslating(true);
    setTranslatedText("");
    try {
      const input: DiplomaticTranslateInput = {
        text: translationInput,
        targetLanguage: language === 'ar' ? 'English' : 'Arabic',
        context: 'business email',
      };
      const result = await diplomaticTranslate(input);
      setTranslatedText(result.translatedText);
    } catch (error) {
      console.error("Failed to translate:", error);
      toast({ variant: "destructive", title: t.translateFailTitle, description: t.translateFailDescription });
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {isUserLoading ? (
              <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : user ? (
              <div className="flex flex-col gap-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t.statsTotalShipments}</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{isLoadingShipments ? <Skeleton className="h-8 w-16" /> : stats.totalShipments}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t.statsTotalValue}</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{isLoadingShipments ? <Skeleton className="h-8 w-32" /> : `$${stats.totalValue.toLocaleString()}`}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t.statsInTransit}</CardTitle>
                      <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{isLoadingShipments ? <Skeleton className="h-8 w-16" /> : stats.inTransit}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t.statsCompleted}</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{isLoadingShipments ? <Skeleton className="h-8 w-16" /> : stats.completed}</div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                      <Bot className="h-6 w-6" />
                      {t.aiLabTitle}
                    </CardTitle>
                    <CardDescription>{t.aiLabDescription}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2"><FileText /> {t.contractGeneratorTitle}</h4>
                      <p className="text-sm text-muted-foreground">{t.contractGeneratorDescription}</p>
                      <Button onClick={handleGenerateContract} disabled={isGeneratingContract}>
                        {isGeneratingContract && <Loader2 className="mx-2 h-4 w-4 animate-spin" />}
                        {t.contractGeneratorButton}
                      </Button>
                    </div>
                    {(isGeneratingContract || contractText) && (
                      <div className="rounded-md border bg-background p-4">
                        <h4 className="mb-2 font-semibold text-foreground">{t.resultsTitle}</h4>
                        {isGeneratingContract ? (
                          <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="mx-4 text-muted-foreground">{t.geminiAnalyzing}</p>
                          </div>
                        ) : (
                          <Textarea readOnly value={contractText} className="h-auto min-h-[300px] w-full resize-y bg-muted/30 font-code text-sm" rows={20} />
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2"><Languages /> {t.diplomaticTranslatorTitle}</h4>
                      <p className="text-sm text-muted-foreground">{t.diplomaticTranslatorDescription}</p>
                      <div className="space-y-4">
                        <Textarea value={translationInput} onChange={(e) => setTranslationInput(e.target.value)} placeholder={t.translatorInputPlaceholder} className="min-h-[100px]" />
                        <Button onClick={handleTranslate} disabled={isTranslating}>
                          {isTranslating && <Loader2 className="mx-2 h-4 w-4 animate-spin" />}
                          {t.translatorButton}
                        </Button>
                      </div>
                    </div>
                     {(isTranslating || translatedText) && (
                        <div className="rounded-md border bg-background p-4">
                           <h4 className="mb-2 font-semibold text-foreground">{t.resultsTitle}</h4>
                          {isTranslating ? (
                            <div className="flex items-center justify-center p-8">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              <p className="mx-4 text-muted-foreground">{t.geminiAnalyzing}</p>
                            </div>
                          ) : (
                            <Textarea readOnly value={translatedText} className="h-auto min-h-[100px] w-full resize-y bg-muted/30 font-code text-sm" rows={8}/>
                          )}
                        </div>
                      )}
                  </CardContent>
                </Card>

              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h2 className="mt-4 text-xl font-semibold">{t.loginRequiredTitle}</h2>
                  <p className="mt-2 text-muted-foreground">{t.loginRequiredDescription}</p>

                  <Button asChild className="mt-4">
                    <a href="/login">{t.sidebarLoginButton}</a>
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
    </div>
    </SidebarProvider>
  );
}

    