'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { defaultSiteCategories } from '@/lib/default-sites';
import { useSupabase } from '@/supabase/provider';
import { supabase } from '@/supabase/client';

type SiteCategory = {
  id: string;
}

export default function ImportantSitesRedirectPage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useSupabase();

  const fetchCategories = async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('site_categories')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1);
    if (error) {
      console.error('Error fetching site categories:', error);
      return null;
    }
    return data;
  };

  useEffect(() => {
    if (isUserLoading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    fetchCategories().then(categories => {
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
    });
  }, [user, isUserLoading, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
