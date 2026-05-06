'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/language-provider";
import { ExternalLink, Globe, Shield, Search, Database, Code, Briefcase, Building2, AlertTriangle, PlusCircle, Trash2, Loader2, Landmark, Sprout, Plane } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { collection, doc, DocumentReference, query, orderBy } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';
import React, { useState, useMemo } from 'react';
import { DeleteCategoryAlert } from './delete-category-alert';
import { AddSiteDialog } from './add-site-dialog';
import { defaultSiteCategories } from '@/lib/default-sites';
import type { TranslationKeys } from '@/lib/i18n';

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

export function ImportantSitesPage() {
  const params = useParams();
  const categoryId = params.categoryId as string;
  const { user } = useUser();
  const firestore = useFirestore();
  const { t } = useLanguage();
  const router = useRouter();

  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false);
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);

  // Determine if the current category is a custom one by checking its ID against the default list
  const isCustomCategory = useMemo(() => !defaultSiteCategories.some(c => c.id === categoryId), [categoryId]);

  // --- Firestore Data Hooks (only run for custom categories) ---
  const categoryDocRef = useMemo(() => {
    if (!isCustomCategory || !user || !categoryId) return null;
    return doc(firestore, 'users', user.uid, 'siteCategories', categoryId) as DocumentReference<any>;
  }, [firestore, user, categoryId, isCustomCategory]);
  const { data: firestoreCategory, isLoading: isLoadingFirestoreCategory } = useDoc<any>(categoryDocRef);

  const sitesQuery = useMemo(() => {
    if (!isCustomCategory || !user || !categoryId) return null;
    return query(collection(firestore, 'users', user.uid, 'siteCategories', categoryId, 'sites'), orderBy('title', 'asc'));
  }, [firestore, user, categoryId, isCustomCategory]);
  const { data: firestoreSites, isLoading: isLoadingFirestoreSites } = useCollection<any>(sitesQuery);
  
  // --- Default Data (retrieved synchronously) ---
  const defaultCategoryData = useMemo(() => {
    if (isCustomCategory) return null;
    return defaultSiteCategories.find(c => c.id === categoryId);
  }, [categoryId, isCustomCategory]);

  // --- Loading State ---
  const isLoading = isCustomCategory && (isLoadingFirestoreCategory || isLoadingFirestoreSites);

  if (isLoading) {
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

  // --- Determine final data to render ---
  const category = isCustomCategory ? firestoreCategory : defaultCategoryData;
  const sites = isCustomCategory ? firestoreSites : defaultCategoryData?.sites;
  
  if (!category) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Category Not Found</AlertTitle>
        <AlertDescription>
          The requested category does not exist or you do not have permission to view it.
        </AlertDescription>
      </Alert>
    );
  }
  
  const IconComponent = iconComponents[category.icon] || iconComponents.Default;
  const title = isCustomCategory ? category.title : t[category.titleKey as TranslationKeys];
  const description = isCustomCategory ? category.description : t[category.descriptionKey as TranslationKeys];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className='flex-1'>
              <CardTitle className="font-headline text-3xl flex items-center gap-3">
                {IconComponent}
                {title}
              </CardTitle>
              <CardDescription className="text-base pt-2">{description}</CardDescription>
            </div>
            {isCustomCategory && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setIsAddSiteOpen(true)}>
                  <PlusCircle className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsDeleteCategoryOpen(true)}>
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {sites && sites.map((site, siteIndex) => {
                const siteTitle = isCustomCategory ? site.title : t[site.titleKey as TranslationKeys];
                const siteDescription = isCustomCategory ? site.description : t[site.descriptionKey as TranslationKeys];
                return (
                    <AccordionItem value={`site-${siteIndex}`} key={site.id || site.url} className="border-b-0 rounded-md border bg-muted/30">
                        <AccordionTrigger className="px-4 py-3 text-base font-medium hover:no-underline text-start">
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
                )
            })}
            {(!sites || sites.length === 0) && (
                 <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
                    <p className="text-muted-foreground">{!isCustomCategory ? "This default category has no sites." : "Add your first site to this category by clicking the '+' icon above."}</p>
                </div>
            )}
          </Accordion>
        </CardContent>
      </Card>
      {isCustomCategory && (
        <>
            <AddSiteDialog
                isOpen={isAddSiteOpen}
                onOpenChange={setIsAddSiteOpen}
                categoryId={categoryId}
            />
            <DeleteCategoryAlert
                isOpen={isDeleteCategoryOpen}
                onOpenChange={setIsDeleteCategoryOpen}
                categoryId={categoryId}
                onDeleted={() => router.push('/important-sites')}
            />
        </>
      )}
    </>
  );
}
