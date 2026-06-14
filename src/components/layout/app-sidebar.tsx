'use client';

import Link from "next/link";
import React, { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  Truck,
  LayoutDashboard,
  Settings,
  LogOut,
  Users,
  Building2,
  Briefcase,
  Globe,
  ChevronRight,
  PlusCircle,
  Shield,
} from "lucide-react";
import { useSupabase } from "@/supabase/provider";
import { supabase } from "@/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/language-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useDoc } from "@/supabase/hooks/use-doc";


const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' },
];

export function AppSidebar() {
  const { language, setLanguage, t } = useLanguage();
  const { user, isLoading: isUserLoading, signOut } = useSupabase();
  const { toast } = useToast();
  const pathname = usePathname();

  // CRITICAL OWNER IDENTITY
  const isOwnerByEmail = user?.email === 'hawadettt@gmail.com';

  const userProfileRef = useMemo(() => {
    if (!user) return null;
    return { tableName: 'profiles', id: user.id };
  }, [user]);

  // Use any to avoid TypeScript errors with profile fields
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<any>(
    supabase,
    'profiles',
    user?.id
  );
  
  // Updated to use new role system
  const hasAdminRole = userProfile?.role && ['owner', 'admin', 'employee'].includes(userProfile.role);
  const isAdmin = isOwnerByEmail || hasAdminRole;

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: t.logoutSuccessTitle,
        description: t.logoutSuccessDescription,
      });
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        variant: "destructive",
        title: t.logoutFailTitle,
        description: t.logoutFailDescription,
      });
    }
  };

  const getRoleDisplay = (): string => {
    if (isOwnerByEmail) {
      return 'Company Owner';
    }
    if (userProfile?.role) {
      // Simple mapping for role display
      const roleMap: Record<string, string> = {
        'owner': 'Owner',
        'admin': 'Admin',
        'employee': 'Employee',
        'importer': 'Importer',
        'supplier': 'Supplier',
        'agent': 'Agent',
      };
      return roleMap[userProfile.role] || userProfile.role;
    }
    return 'User';
  };

  return (
    <>
    <Sidebar side={language === 'ar' ? 'right' : 'left'}>
      <SidebarHeader>
        <div className="flex flex-col gap-2">
            <div className="px-2 text-xs font-medium text-muted-foreground">{t.chooseLanguage}</div>
            <div className="px-2">
              <Select value={language} onValueChange={(value) => setLanguage(value as 'en' | 'ar')}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t.chooseLanguage} />
                  </SelectTrigger>
                  <SelectContent align="center">
                      {supportedLanguages.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
            </div>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <div className="p-2">
        {isUserLoading ? (
            <div className="flex items-center gap-3 rounded-md border border-transparent p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-28" />
                </div>
            </div>
) : user ? (
             <div className="flex items-center gap-3 rounded-md p-2">
                     <Avatar className="h-10 w-10 border-2 border-sidebar-accent">
                       <AvatarImage src={userProfile?.avatar_url || user?.user_metadata?.avatar_url} />
                       <AvatarFallback>{userProfile?.display_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
                     </Avatar>
                 <Link href="/settings" className="flex-grow overflow-hidden">
                     <div className="flex flex-col justify-center h-full">
                        <p className="truncate text-sm font-semibold text-sidebar-foreground">{getRoleDisplay()}</p>
                     </div>
                 </Link>
                 <LogOut onClick={handleLogout} className="ms-auto h-5 w-5 flex-shrink-0 cursor-pointer text-muted-foreground hover:text-foreground" />
             </div>
            ) : (
            <div className="px-2 py-2">
                <Link href="/login" passHref>
                <Button className="w-full">
                    <LogOut className="mx-2 h-4 w-4" />
                    {t.sidebarLoginButton}
                </Button>
                </Link>
            </div>
        )}
      </div>
      <SidebarSeparator />
      <SidebarContent className="p-2">
        <SidebarMenu>
            <div className="px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t.sidebarSectionMain}</div>
            <SidebarMenuItem>
              <Link href="/">
                <SidebarMenuButton isActive={pathname === '/'} size="sm">
                  <Home />
                  <span>{t.sidebarHome}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/services">
                <SidebarMenuButton isActive={pathname === '/services'} size="sm">
                  <Briefcase />
                  <span>{t.sidebarServices}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/dashboard">
                <SidebarMenuButton isActive={pathname === '/dashboard'} size="sm">
                  <LayoutDashboard />
                  <span>{t.sidebarDashboard}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            
        </SidebarMenu>

        {(user && !isUserLoading && isProfileLoading && !isOwnerByEmail) && (
            <SidebarMenu className="mt-4">
                <div className="px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t.sidebarSectionManagement}</div>
                <div className="space-y-1 p-2">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                </div>
            </SidebarMenu>
        )}

        {isAdmin && (
            <SidebarMenu className="mt-4">
                <div className="px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t.sidebarSectionManagement}</div>
                <SidebarMenuItem>
                  <Collapsible defaultOpen={pathname.startsWith('/shipments')}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                          isActive={pathname.startsWith('/shipments')}
                          size="sm"
                      >
                        <Truck />
                        <span>{t.sidebarShipments}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <Link href="/shipments">
                            <SidebarMenuButton isActive={pathname === '/shipments'} size="sm">
                              <span>{t.sidebarShipmentsDashboard}</span>
                            </SidebarMenuButton>
                          </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <Link href="/shipments/new">
                            <SidebarMenuButton isActive={pathname === '/shipments/new'} size="sm">
                              <PlusCircle />
                              <span>{t.sidebarNewShipment}</span>
                            </SidebarMenuButton>
                          </Link>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Collapsible defaultOpen={pathname.startsWith('/customers')}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                          isActive={pathname.startsWith('/customers')}
                          size="sm"
                      >
                        <Users />
                        <span>{t.sidebarCustomers}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <Link href="/customers">
                            <SidebarMenuButton isActive={pathname === '/customers'} size="sm">
                              <span>{t.sidebarCustomersDashboard}</span>
                            </SidebarMenuButton>
                          </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <Link href="/customers/new">
                            <SidebarMenuButton isActive={pathname === '/customers/new'} size="sm">
                              <PlusCircle />
                              <span>{t.sidebarNewCustomer}</span>
                            </SidebarMenuButton>
                          </Link>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Collapsible defaultOpen={pathname.startsWith('/suppliers')}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                          isActive={pathname.startsWith('/suppliers')}
                          size="sm"
                      >
                        <Building2 />
                        <span>{t.sidebarSuppliers}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <Link href="/suppliers">
                            <SidebarMenuButton isActive={pathname === '/suppliers'} size="sm">
                              <span>{t.sidebarSuppliersDashboard}</span>
                            </SidebarMenuButton>
                          </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <Link href="/suppliers/new">
                            <SidebarMenuButton isActive={pathname === '/suppliers/new'} size="sm">
                              <PlusCircle />
                              <span>{t.sidebarNewSupplier}</span>
                            </SidebarMenuButton>
                          </Link>
                        </SidebarMenuItem>
                        
                      </SidebarMenu>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Link href="/dashboard/admin">
                    <SidebarMenuButton isActive={pathname === '/dashboard/admin'} size="sm">
                      <Shield />
                      <span>{t.sidebarAdminDashboard}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
            </SidebarMenu>
        )}

        {!isAdmin && user && (
            <SidebarMenu className="mt-4">
                <div className="px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t.sidebarSectionManagement}</div>
                <SidebarMenuItem>
                  <Link href="/settings">
                    <SidebarMenuButton isActive={pathname === '/settings'} size="sm">
                      <Settings />
                      <span>{t.sidebarSettings}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
            </SidebarMenu>
        )}
      </SidebarContent>
      <SidebarFooter className="p-2">
        <div className="px-2 text-xs text-muted-foreground">
          Nile Key v3 © {new Date().getFullYear()}
        </div>
      </SidebarFooter>
    </Sidebar>
    </>
  );
}
