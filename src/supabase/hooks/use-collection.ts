'use client';

import { useState, useEffect, useCallback } from 'react';
import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Customer, Supplier, Shipment, ImportantSite, NfsaWhitelist } from '@/lib/supabase-types';

export type WithId<T> = T & { id: string };

interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: Error | null;
}

export function useCollection<T extends { id: string }>(
  supabase: SupabaseClient,
  tableName: string,
  userId: string | undefined,
  orderByColumn: string = 'created_at',
  orderDirection: 'asc' | 'desc' = 'desc'
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: result, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .order(orderByColumn, { ascending: orderDirection === 'asc' });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setData((result || []) as WithId<T>[]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, tableName, userId, orderByColumn, orderDirection]);

  useEffect(() => {
    if (!userId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    // Initial fetch
    fetchData();

    // Set up realtime subscription
    const channel: RealtimeChannel = supabase
      .channel(`${tableName}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, tableName, fetchData]);

  return { data, isLoading, error };
}
