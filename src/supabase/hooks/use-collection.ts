'use client';

import { useState, useEffect, useCallback } from 'react';
import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Customer, Supplier, Shipment, ImportantSite, EmployeeTask, ExportAlert } from '@/lib/supabase-types';

export type WithId<T> = T & { id: string };

interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: Error | null;
}

// Roles that can view all records (not filtered by user_id)
const ADMIN_ROLES = ['owner', 'admin', 'employee'];

export function useCollection<T extends { id: string }>(
  supabase: SupabaseClient,
  tableName: string,
  userId: string | undefined,
  userRole: string | undefined,
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

      let query = supabase.from(tableName).select('*');

      // Apply user_id filter for non-admin roles
      if (!ADMIN_ROLES.includes(userRole || '')) {
        query = query.eq('user_id', userId);
      }

      const { data: result, error: fetchError } = await query
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
  }, [supabase, tableName, userId, userRole, orderByColumn, orderDirection]);

  useEffect(() => {
    if (!userId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    fetchData();

    const channel: RealtimeChannel = supabase
      .channel(`${tableName}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: ADMIN_ROLES.includes(userRole || '') ? undefined : `user_id=eq.${userId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, tableName, fetchData, userRole]);

  return { data, isLoading, error };
}