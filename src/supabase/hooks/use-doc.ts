'use client';

import { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Customer, Supplier, Shipment, ImportantSite } from '@/lib/supabase-types';

export type WithId<T> = T & { id: string };

interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: Error | null;
}

export function useDoc<T extends { id: string }>(
  supabase: SupabaseClient,
  tableName: string,
  documentId: string | null | undefined
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!documentId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: result, error: fetchError } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', documentId)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // Document not found
            setData(null);
          } else {
            throw new Error(fetchError.message);
          }
        } else {
          setData(result as WithId<T>);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase, tableName, documentId]);

  return { data, isLoading, error };
}
