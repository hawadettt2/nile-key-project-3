'use client';
import { PredictiveAnalyticsDashboard } from "@/components/predictive-analytics-dashboard";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";

export default function PredictiveAnalyticsPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <PredictiveAnalyticsDashboard />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
