
"use client";

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
  Search,
  Database,
  Code,
  Shield,
  Landmark,
  Sprout,
  Book,
  BadgeCheck,
  Brain,
  LockKeyhole,
} from "lucide-react";
import { useAuth, useCollection, useFirestore, useUser, useDoc, setDocumentNonBlocking } from "@/firebase";
import { signOut } from "firebase/auth";
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
import { collection, query, orderBy, doc, DocumentReference } from "firebase/firestore";
import { EditAvatarDialog } from "../edit-avatar-dialog";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { TranslationKeys } from "@/lib/i18n";
import { defaultSiteCategories } from "@/lib/default-sites";

const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');


const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' },
];

const iconComponents: { [key: string]: React.ReactNode } = {
  Globe: <Globe className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
  Search: <Search className="h-4 w-4" />,
  Database: <Database className="h-4 w-4" />,
  Code: <Code className="h-4 w-4" />,
  Briefcase: <Briefcase className="h-4 w-4" />,
  Building2: <Building2 className="h-4 w-4" />,
  Landmark: <Landmark className="h-4 w-4" />,
  Sprout: <Sprout className="h-4 w-4" />,
  Default: <ChevronRight className="h-4 w-4" />,
};

type SiteCategory = {
  id: string;
  title: string;
  icon: string;
}

export function AppSidebar() {
  const { language, setLanguage, t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const pathname = usePathname();
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);

  // CRITICAL OWNER IDENTITY
  const isOwnerByEmail = user?.email === 'hawadettt@gmail.com';

  const userProfileRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid) as DocumentReference<any>;
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<any>(userProfileRef);

  const customCategoriesQuery = React.useMemo(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'siteCategories'), orderBy('createdAt', 'asc'));
  }, [firestore, user]);

  const { data: customCategories, isLoading: isLoadingCategories } = useCollection<SiteCategory>(customCategoriesQuery);

  const hasAdminRole = userProfile?.role && ['owner', 'admin', 'staff'].includes(userProfile.role);
  const isAdmin = isOwnerByEmail || hasAdminRole;


  const handleLogout = async () => {
    try {
      await signOut(auth);
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

  const handleAvatarSelect = async (newAvatarUrl: string) => {
    if (!userProfileRef || !user) {
        toast({ variant: 'destructive', title: t.avatarUpdatedFail });
        return;
    }
    try {
        const dataToSave: { photoURL: string; id?: string; email?: string | null; role?: string } = { photoURL: newAvatarUrl };

        if (!userProfile) {
            dataToSave.id = user.uid;
            if (user.email) {
                dataToSave.email = user.email;
                if (user.email === 'hawadettt@gmail.com') {
                    dataToSave.role = 'owner';
                }
            }
        }
        
        setDocumentNonBlocking(userProfileRef, dataToSave, { merge: true });

        toast({ title: t.avatarUpdatedSuccess });
        setIsAvatarDialogOpen(false);
    } catch (error) {
        console.error("Avatar update initiation failed:", error);
        toast({ variant: 'destructive', title: t.avatarUpdatedFail });
    }
  };

  const getRoleDisplay = () => {
    if (isOwnerByEmail) {
      return t.roleCompanyOwner;
    }
    if (userProfile?.role) {
      const roleKey = `role${userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}` as TranslationKeys;
      return t[roleKey] || userProfile.role;
    }
    return t.sidebarUser;
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
                <button onClick={() => setIsAvatarDialogOpen(true)} className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <Avatar className="h-10 w-10 border-2 border-sidebar-accent">
                    <AvatarImage src={userProfile?.photoURL || user?.photoURL || userAvatar?.imageUrl} />
                    <AvatarFallback>{userProfile?.userName?.[0].toUpperCase() ?? user?.email?.[0].toUpperCase() ?? 'U'}</AvatarFallback>
                  </Avatar>
                </button>
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
            <SidebarMenuItem>
              <Link href="/predictive-analytics">
                <SidebarMenuButton isActive={pathname === '/predictive-analytics'} size="sm">
                  <Brain />
                  <span>{t.sidebarPredictiveAnalytics}</span>
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
                          className="w-full justify-between group"
                      >
                        <div className="flex items-center gap-2">
                            <LockKeyhole className="h-4 w-4 text-primary" />
                            <span>{t.sidebarShipments}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-1">
                      <SidebarMenu className="pl-7">
                          <SidebarMenuItem>
                            <Link href="/shipments">
                              <SidebarMenuButton isActive={pathname === '/shipments'} size="sm">
                                <span>{t.sidebarViewAll}</span>
                              </SidebarMenuButton>
                            </Link>
                          </SidebarMenuItem>
                          <SidebarMenuItem>
                            <Link href="/shipments/new">
                              <SidebarMenuButton isActive={pathname === '/shipments/new'} size="sm">
                                <span>{t.sidebarAddNew}</span>
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
                          className="w-full justify-between group"
                      >
                        <div className="flex items-center gap-2">
                            <LockKeyhole className="h-4 w-4 text-primary" />
                            <span>{t.sidebarSuppliers}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-1">
                      <SidebarMenu className="pl-7">
                          <SidebarMenuItem>
                            <Link href="/suppliers">
                              <SidebarMenuButton isActive={pathname === '/suppliers'} size="sm">
                                <span>{t.sidebarPublicDatabase}</span>
                              </SidebarMenuButton>
                            </Link>
                          </SidebarMenuItem>
                          <SidebarMenuItem>
                            <Link href="/suppliers/whitelist">
                              <SidebarMenuButton isActive={pathname === '/suppliers/whitelist'} size="sm">
                              <BadgeCheck className="h-4 w-4"/>
                                <span>{t.sidebarNfsaWhitelist}</span>
                              </SidebarMenuButton>
                            </Link>
                          </SidebarMenuItem>
                          <SidebarMenuItem>
                            <Link href="/suppliers/new">
                              <SidebarMenuButton isActive={pathname === '/suppliers/new'} size="sm">
                                <span>{t.sidebarAddPrivate}</span>
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
                          className="w-full justify-between group"
                      >
                        <div className="flex items-center gap-2">
                            <LockKeyhole className="h-4 w-4 text-primary" />
                            <span>{t.sidebarCustomers}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-1">
                      <SidebarMenu className="pl-7">
                          <SidebarMenuItem>
                            <Link href="/customers">
                              <SidebarMenuButton isActive={pathname === '/customers'} size="sm">
                                <span>{t.sidebarViewAll}</span>
                              </SidebarMenuButton>
                            </Link>
                          </SidebarMenuItem>
                          <SidebarMenuItem>
                            <Link href="/customers/new">
                              <SidebarMenuButton isActive={pathname === '/customers/new'} size="sm">
                                <span>{t.sidebarAddNew}</span>
                              </SidebarMenuButton>
                            </Link>
                          </SidebarMenuItem>
                      </SidebarMenu>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
            </SidebarMenu>
        )}

        <SidebarMenu className="mt-4">
            <div className="px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t.sidebarSectionResources}</div>
            <SidebarMenuItem>
              <Collapsible defaultOpen={pathname.startsWith('/important-sites')}>
                <CollapsibleTrigger asChild>
                   <SidebarMenuButton
                      isActive={pathname.startsWith('/important-sites')}
                      size="sm"
                      className="w-full justify-between group"
                   >
                     <div className="flex items-center gap-2">
                        <Globe />
                        <span>{t.sidebarImportantSites}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                   </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-1">
                  <SidebarMenu className="pl-7">
                      {isLoadingCategories ? (
                        <div className="space-y-1">
                          <Skeleton className="h-7 w-full" />
                          <Skeleton className="h-7 w-full" />
                        </div>
                      ) : (
                        <>
                          {customCategories && customCategories.map(category => (
                            <SidebarMenuItem key={category.id}>
                              <Link href={`/important-sites/${category.id}`}>
                                <SidebarMenuButton isActive={pathname === `/important-sites/${category.id}`} size="sm">
                                  {iconComponents[category.icon] || iconComponents.Default}
                                  <span>{category.title}</span>
                                </SidebarMenuButton>
                              </Link>
                            </SidebarMenuItem>
                          ))}

                          {customCategories && customCategories.length > 0 && defaultSiteCategories.length > 0 && (
                            <SidebarSeparator className="my-2" />
                          )}

                          {defaultSiteCategories.map(category => (
                            <SidebarMenuItem key={category.id}>
                              <Link href={`/important-sites/${category.id}`}>
                                <SidebarMenuButton isActive={pathname === `/important-sites/${category.id}`} size="sm">
                                    {iconComponents[category.icon] || iconComponents.Default}
                                    <span>{t[category.titleKey as TranslationKeys]}</span>
                                </SidebarMenuButton>
                              </Link>
                            </SidebarMenuItem>
                          ))}
                        </>
                      )}
                      <SidebarMenuItem>
                        <Link href="/important-sites/new">
                          <SidebarMenuButton isActive={pathname === '/important-sites/new'} size="sm">
                            <PlusCircle className="h-4 w-4" />
                            <span>{t.sidebarAddNewCategory}</span>
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                  </SidebarMenu>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/exporters-guide">
                <SidebarMenuButton isActive={pathname === '/exporters-guide'} size="sm">
                  <Book />
                  <span>{t.sidebarExportersGuide}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <Link href="/settings">
                <SidebarMenuButton isActive={pathname === '/settings'} size="sm">
                  <Settings />
                  <span>{t.sidebarSettings}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
        </SidebarMenu>

      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-2 flex justify-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground">
            <span className="font-headline text-lg font-bold text-background">N</span>
        </div>
      </SidebarFooter>
    </Sidebar>
    <EditAvatarDialog
        isOpen={isAvatarDialogOpen}
        onOpenChange={setIsAvatarDialogOpen}
        onAvatarSelect={handleAvatarSelect}
      />
    </>
  );
}
