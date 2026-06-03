'use client';
import { NfsaWhitelistDashboard } from "@/components/nfsa-whitelist-dashboard";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";

export default function NfsaWhitelistPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <NfsaWhitelistDashboard />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
