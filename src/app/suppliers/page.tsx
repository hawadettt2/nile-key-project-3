'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Edit } from 'lucide-react';
import { supabase } from '@/supabase/client';
import { useSupabase } from '@/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/app/app-layout';

type Supplier = {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  governorate: string;
  is_nfsa_whitelisted: boolean;
  created_at: string;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabase();
  const { toast } = useToast();

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch('/api/suppliers', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'فشل تحميل الموردين');
      setSuppliers(payload.data || []);
    } catch (error: any) {
      console.error('Failed to fetch suppliers:', error);
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadSuppliers();
  }, [user]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>الموردون</CardTitle>
                <CardDescription>إدارة الموردين وعرض معلوماتهم</CardDescription>
              </div>
              <Button asChild>
                <a href="/suppliers/new">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  مورد جديد
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </div>
            ) : suppliers.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                لا توجد موردين مسجلين
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الشركة</TableHead>
                      <TableHead>جهة الاتصال</TableHead>
                      <TableHead>البريد</TableHead>
                      <TableHead>الهاتف</TableHead>
                      <TableHead>المحافظة</TableHead>
                      <TableHead>القائمة البيضاء</TableHead>
                      <TableHead>تاريخ التسجيل</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.contact_person}</TableCell>
                        <TableCell>{supplier.email}</TableCell>
                        <TableCell>{supplier.phone}</TableCell>
                        <TableCell>{supplier.governorate}</TableCell>
                        <TableCell>
                          <Badge variant={supplier.is_nfsa_whitelisted ? 'secondary' : 'outline'}>
                            {supplier.is_nfsa_whitelisted ? 'نعم' : 'لا'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(supplier.created_at).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" asChild>
                            <a href={`/suppliers/${supplier.id}`}>
                              <Edit className="h-3 w-3" />
                            </a>
                          </Button>
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