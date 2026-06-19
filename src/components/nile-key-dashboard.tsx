'use client';

import { useState, useMemo } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Package, AlertTriangle, Truck, FileText, TrendingUp, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/supabase/provider";
import { supabase } from "@/supabase/client";
import { useCollection } from "@/supabase/hooks/use-collection";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/context/language-provider";

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

  const { data: shipments, isLoading: isLoadingShipments } = useCollection<Shipment>(
    supabase,
    'shipments',
    user?.id,
    undefined,
    'created_at',
    'desc'
  );

  const { data: customersData, isLoading: isLoadingCustomers } = useCollection<{ id: string }>(
    supabase,
    'customers',
    user?.id,
    undefined,
    'created_at',
    'desc'
  );

  const { data: tasksData, isLoading: isLoadingTasks } = useCollection<{ id: string; status: string }>(
    supabase,
    'employee_tasks',
    user?.id,
    undefined,
    'created_at',
    'desc'
  );

  const { data: alertsData, isLoading: isLoadingAlerts } = useCollection<{ id: string }>(
    supabase,
    'export_alerts',
    user?.id,
    undefined,
    'created_at',
    'desc'
  );

  const { data: opportunitiesData, isLoading: isLoadingOpportunities } = useCollection<{ id: string }>(
    supabase,
    'export_opportunities',
    user?.id,
    undefined,
    'created_at',
    'desc'
  );

  const stats = useMemo(() => {
    if (!shipments) return { totalShipments: 0, totalValue: 0, inTransit: 0, completed: 0 };
    const totalValue = shipments.reduce((sum, s) => sum + (s.price || 0), 0);
    const inTransit = shipments.filter(s => s.status === 'in_transit').length;
    const completed = shipments.filter(s => s.status === 'completed').length;
    return { totalShipments: shipments.length, totalValue, inTransit, completed };
  }, [shipments]);

  const totalCustomers = customersData?.length ?? 0;
  const openTasks = tasksData?.filter(t => t.status === 'pending' || t.status === 'in_progress').length ?? 0;
  const totalAlerts = alertsData?.length ?? 0;
  const exportOpportunities = opportunitiesData?.length ?? 0;

  const handleGenerateContract = async () => {
    setIsGeneratingContract(true);
    setContractText("");
    try {
      setContractText(language === 'ar' ? '[مسودة العقد غير متاحة - سيتم إضافتها لاحقاً]' : '[Contract draft not available - will be added later]');
    } finally {
      setIsGeneratingContract(false);
    }
  };

  const handleTranslate = async () => {
    if (!translationInput.trim()) return;
    setIsTranslating(true);
    setTranslatedText("");
    try {
      setTranslatedText(language === 'ar' ? '[الترجمة غير متاحة - سيتم إضافتها لاحقاً]' : '[Translation not available - will be added later]');
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
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{language === 'ar' ? 'العملاء' : 'Customers'}</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{isLoadingCustomers ? <Loader2 className="h-8 w-16 animate-spin" /> : totalCustomers}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t.statsTotalShipments}</CardTitle>
                      <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{isLoadingShipments ? <Loader2 className="h-8 w-16 animate-spin" /> : stats.totalShipments}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{language === 'ar' ? 'المهام المفتوحة' : 'Open Tasks'}</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{isLoadingTasks ? <Loader2 className="h-8 w-16 animate-spin" /> : openTasks}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{language === 'ar' ? 'التنبيهات' : 'Alerts'}</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{isLoadingAlerts ? <Loader2 className="h-8 w-16 animate-spin" /> : totalAlerts}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{language === 'ar' ? 'فرص التصدير' : 'Opportunities'}</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{isLoadingOpportunities ? <Loader2 className="h-8 w-16 animate-spin" /> : exportOpportunities}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{language === 'ar' ? 'مصادر موثقة' : 'Verified Sources'}</CardTitle>
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                    </CardContent>
                  </Card>
                </div>

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