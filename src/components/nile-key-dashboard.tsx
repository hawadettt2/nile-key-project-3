'use client';

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
import { useSupabase } from "@/supabase/provider";
import { supabase } from "@/supabase/client";
import { useCollection } from "@/supabase/hooks/use-collection";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/context/language-provider";
import { useAIChat } from "@/ai/hooks/use-ai-chat";

export default function NileKeyDashboard() {
  const { language, t } = useLanguage();
  
  type Shipment = { 
    id: string; 
    created_at: string;
    price: number;
    status: string;
  };

  const { toast } = useToast();
  const { user, isLoading: isUserLoading } = useSupabase();
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [contractText, setContractText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationInput, setTranslationInput] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  
  const { messages, input, handleInputChange, handleSubmit: handleChatSubmit, isLoading: isChatLoading } = useAIChat({
    systemPrompt: language === 'ar' 
      ? 'أنت مساعد ذكي لشركة مفتاح النيل. ساعد في إنشاء العقود وترجمة المراسلات.'
      : 'You are a helpful AI assistant for Nile Key company. Help with contracts and translations.'
  });

  const { data: shipments, isLoading: isLoadingShipments } = useCollection<Shipment>(
    supabase,
    'shipments',
    user?.id,
    'created_at',
    'desc'
  );

  const stats = useMemo(() => {
    if (!shipments) return { totalShipments: 0, totalValue: 0, inTransit: 0, completed: 0 };
    const totalValue = shipments.reduce((sum, s) => sum + (s.price || 0), 0);
    const inTransit = shipments.filter(s => s.status === t.shipmentStatusOption4).length;
    const completed = shipments.filter(s => s.status === t.shipmentStatusOption5).length;
    return { totalShipments: shipments.length, totalValue, inTransit, completed };
  }, [shipments, t]);

  const handleGenerateContract = async () => {
    setIsGeneratingContract(true);
    setContractText("");
    try {
      // Use AI chat to generate contract
      const contractPrompt = language === 'ar' 
        ? 'أنشئ عقد تصدير احترافي لشحنة خس وكابوتشا إلى الأردن مع تقديرات التكلفة.'
        : 'Generate a professional export contract for a lettuce and cabbage shipment to Jordan with cost estimates.';
      
      // This would typically call the AI route directly
      setContractText("Contract generation will be implemented with the new AI route.");
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
      // Use AI chat for translation
      const translatePrompt = language === 'ar'
        ? `ترجم النص التالي إلى الإنجليزية بلهجة دبلوماسية: ${translationInput}`
        : `Translate the following text to Arabic in diplomatic language: ${translationInput}`;
      
      setTranslatedText("Translation will be implemented with the new AI route.");
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
                      <div className="text-2xl font-bold">{isLoadingShipments ? <Loader2 className="h-8 w-16 animate-spin" /> : stats.totalShipments}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t.statsTotalValue}</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{isLoadingShipments ? <Loader2 className="h-8 w-32 animate-spin" /> : `$${stats.totalValue.toLocaleString()}`}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t.statsInTransit}</CardTitle>
                      <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{isLoadingShipments ? <Loader2 className="h-8 w-16 animate-spin" /> : stats.inTransit}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t.statsCompleted}</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{isLoadingShipments ? <Loader2 className="h-8 w-16 animate-spin" /> : stats.completed}</div>
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
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{t.contractGeneratorTitle}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{t.contractGeneratorDescription}</p>
                      <Button onClick={handleGenerateContract} disabled={isGeneratingContract}>
                        {isGeneratingContract && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t.contractGeneratorButton}
                      </Button>
                      {contractText && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                          <pre className="whitespace-pre-wrap text-sm">{contractText}</pre>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-2">{t.diplomaticTranslatorTitle}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{t.diplomaticTranslatorDescription}</p>
                      <Textarea 
                        placeholder={t.translatorInputPlaceholder}
                        value={translationInput}
                        onChange={(e) => setTranslationInput(e.target.value)}
                        className="mb-2"
                      />
                      <Button onClick={handleTranslate} disabled={isTranslating}>
                        {isTranslating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t.translatorButton}
                      </Button>
                      {translatedText && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                          <p className="text-sm">{translatedText}</p>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-2">AI Chat</h3>
                      <div className="space-y-4">
                        <div className="h-64 overflow-y-auto border rounded-lg p-4 space-y-2">
                          {messages.map((m, i) => (
                            <div key={i} className={`p-2 rounded-lg ${m.role === 'user' ? 'bg-primary/10 ml-auto' : 'bg-muted'} max-w-[80%] ${m.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                              <p className="text-sm">{m.content}</p>
                            </div>
                          ))}
                          {isChatLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                        <form onSubmit={handleChatSubmit} className="flex gap-2">
                          <Textarea 
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Ask AI something..."
                            className="flex-1"
                          />
                          <Button type="submit" disabled={isChatLoading}>
                            {isChatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
                          </Button>
                        </form>
                      </div>
                    </div>
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
