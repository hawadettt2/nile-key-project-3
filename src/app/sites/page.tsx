'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Globe, CheckCircle, XCircle, PlusCircle } from 'lucide-react';
import { supabase } from '@/supabase/client';
import { useSupabase } from '@/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/app/app-layout';

type ImportantSite = {
  id: string;
  title: string;
  url: string;
  description?: string;
  category_id?: string;
  is_verified: boolean;
  source_type?: string;
  country?: string;
  created_at: string;
};

export default function ImportantSitesPage() {
  const [sites, setSites] = useState<ImportantSite[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabase();
  const { toast } = useToast();

  const loadSites = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/important-sites', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'فشل تحميل المواقع');
      setSites(payload.data || []);
    } catch (error: any) {
      console.error('Failed to fetch sites:', error);
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadSites();
  }, [user]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>المواقع المهمة</CardTitle>
                <CardDescription>المواقع والمنصات التي تُهم لأعمالك</CardDescription>
              </div>
              <Button asChild>
                <a href="/sites/new">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  موقع جديد
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </div>
            ) : sites.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                لا توجد مواقع مسجلة
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>العنوان</TableHead>
                      <TableHead>الرابط</TableHead>
                      <TableHead>موثوق</TableHead>
                      <TableHead>البلد</TableHead>
                      <TableHead>تاريخ الإضافة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sites.map((site) => (
                      <TableRow key={site.id}>
                        <TableCell className="font-medium">{site.title}</TableCell>
                        <TableCell>
                          <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            زيارة
                          </a>
                        </TableCell>
                        <TableCell>
                          {site.is_verified ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
                        </TableCell>
                        <TableCell>{site.country || '-'}</TableCell>
                        <TableCell>{new Date(site.created_at).toLocaleDateString('ar-EG')}</TableCell>
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