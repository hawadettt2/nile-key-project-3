'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { defaultSiteCategories } from '@/lib/default-sites';

type SiteCategory = {
  id: string;
}

export default function ImportantSitesRedirectPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const categoriesQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'siteCategories'), orderBy('createdAt', 'asc'));
  }, [user, firestore]);
  
  const { data: categories, isLoading: isLoadingCategories } = useCollection<SiteCategory>(categoriesQuery);

  useEffect(() => {
    if (isUserLoading || isLoadingCategories) {
      return; // Wait until all loading is done
    }

    if (!user) {
        router.replace('/login');
        return;
    }

    if (categories && categories.length > 0) {
      router.replace(`/important-sites/${categories[0].id}`);
    } else {
      // If user has no custom categories, redirect to the first default category
      if (defaultSiteCategories.length > 0) {
        router.replace(`/important-sites/${defaultSiteCategories[0].id}`);
      } else {
        // Fallback if even default categories are empty
        router.replace('/important-sites/new');
      }
    }
  }, [categories, isLoadingCategories, isUserLoading, router, user]);

  return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
  );
}
