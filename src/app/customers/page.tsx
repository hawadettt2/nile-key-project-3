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

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_name: string;
  country: string;
  created_at: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabase();
  const { toast } = useToast();

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch('/api/customers', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'فشل تحميل العملاء');
      setCustomers(payload.data || []);
    } catch (error: any) {
      console.error('Failed to fetch customers:', error);
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadCustomers();
  }, [user]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>العملاء</CardTitle>
              <CardDescription>إدارة العملاء وعرض معلوماتهم</CardDescription>
            </div>
            <Button asChild>
              <a href="/customers/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                عميل جديد
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
          ) : customers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              لا توجد عملاء مسجلين
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>اسم الشركة</TableHead>
                    <TableHead>البريد</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>البلد</TableHead>
                    <TableHead>تاريخ التسجيل</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.company_name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.country}</TableCell>
                      <TableCell>{new Date(customer.created_at).toLocaleDateString('ar-EG')}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" asChild>
                          <a href={`/customers/${customer.id}`}>
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
  );
}