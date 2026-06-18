'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Globe, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/supabase/client';
import { useSupabase } from '@/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/app/app-layout';

type TradeSource = {
  id: string;
  title: string;
  url: string;
  main_category: string;
  description?: string;
  credibility_score?: number;
  source_type: string;
  is_verified: boolean;
  country?: string;
  created_at: string;
};

export default function TradeSourcesPage() {
  const [sources, setSources] = useState<TradeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabase();
  const { toast } = useToast();

  const loadSources = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/trade-sources', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'فشل تحميل المصادر');
      setSources(payload.data || []);
    } catch (error: any) {
      console.error('Failed to fetch sources:', error);
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadSources();
  }, [user]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>مصادر التجارة</CardTitle>
            <CardDescription>مصادر موثوقة للمعلومات التجارية والأسواق</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </div>
            ) : sources.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                لا توجد مصادر مسجلة
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>العنوان</TableHead>
                      <TableHead>الفئة</TableHead>
                      <TableHead>نوع المصدر</TableHead>
                      <TableHead>درجة المصداقية</TableHead>
                      <TableHead>موثوق</TableHead>
                      <TableHead>البلد</TableHead>
                      <TableHead>الرابط</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sources.map((source) => (
                      <TableRow key={source.id}>
                        <TableCell className="font-medium">{source.title}</TableCell>
                        <TableCell>{source.main_category}</TableCell>
                        <TableCell>{source.source_type}</TableCell>
                        <TableCell>{source.credibility_score || 0}/100</TableCell>
                        <TableCell>
                          {source.is_verified ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
                        </TableCell>
                        <TableCell>{source.country || '-'}</TableCell>
                        <TableCell>
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            زيارة
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}