'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/lib/supabase-types';

type RoleRequest = {
  id: string;
  profile_id: string;
  requested_role: UserRole;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string | null;
  reviewer_id?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  profiles?: {
    email: string;
    role: UserRole;
  };
};

const roleDefinition: Record<UserRole, string> = {
  'مالك': 'يتحقق من ملكية المشروع والشركة.',
  'إشراف إداري': 'مسؤول عن إدارة التطبيق وقاعدة بيانات الشركة.',
  'موظف': 'موظف رسمي بالشركة يتقاضى راتباً أو عمولة.',
  'مستورد': 'كيان معتمد بعد فحص المستندات.',
  'مورد': 'كيان معتمد بعد فحص المستندات.',
  'مصدر': 'كيان معتمد بعد فحص المستندات.',
  'مستخدم مسجل': 'مستخدم فعّل حسابه وسجل الدخول ولم يُعيّن له دور محدد بعد.',
  'زائر': 'مستخدم غير مسجل أو ضيف.',
};

export default function RoleRequestsPage() {
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/role-requests');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'تعذر تحميل طلبات الأدوار.');
      setRequests(payload.data || []);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'تعذر التحميل', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const reviewRequest = async (requestId: string, approve: boolean) => {
    setUpdating(requestId);
    try {
      const response = await fetch('/api/role-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, approve }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'تعذر مراجعة الطلب.');
      toast({
        title: approve ? 'تمت الموافقة' : 'تم الرفض',
        description: approve ? 'تم تحديث دور المستخدم بنجاح.' : 'تم رفض طلب تغيير الدور.',
      });
      await loadRequests();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'تعذر تنفيذ العملية', description: error.message });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>طلبات تغيير الأدوار</CardTitle>
          <CardDescription>
            راجع طلبات المستخدمين للحصول على أدوار محددة ووافق أو ارفض كل طلب بعد التحقق.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">جاري تحميل الطلبات...</div>
          ) : requests.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
              لا توجد طلبات معلقة حالياً.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>الدور المطلوب</TableHead>
                    <TableHead>تعريف الدور</TableHead>
                    <TableHead>السبب</TableHead>
                    <TableHead>تاريخ الطلب</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.profiles?.email || '---'}</TableCell>
                      <TableCell className="font-semibold">{request.requested_role}</TableCell>
                      <TableCell className="max-w-md">{roleDefinition[request.requested_role]}</TableCell>
                      <TableCell>{request.reason || '-'}</TableCell>
                      <TableCell>{new Date(request.created_at).toLocaleString('ar-EG')}</TableCell>
                      <TableCell>
                        <Badge variant={request.status === 'approved' ? 'secondary' : request.status === 'rejected' ? 'destructive' : 'outline'}>
                          {request.status === 'approved' ? 'موافق' : request.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            disabled={updating === request.id}
                            onClick={() => reviewRequest(request.id, true)}
                          >
                            موافقة
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={updating === request.id}
                            onClick={() => reviewRequest(request.id, false)}
                          >
                            رفض
                          </Button>
                        </div>
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
