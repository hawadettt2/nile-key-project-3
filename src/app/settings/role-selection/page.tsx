'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import type { UserRole } from '@/lib/supabase-types';

const AVAILABLE_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'مالك', label: 'مالك', description: 'حساب يتحقق من ملكية المشروع والشركة.' },
  { value: 'إشراف إداري', label: 'إشراف إداري', description: 'مسؤول عن إدارة التطبيق وقاعدة بيانات الشركة.' },
  { value: 'موظف', label: 'موظف', description: 'موظف رسمي بالشركة يتقاضى راتباً أو عمولة.' },
  { value: 'مستورد', label: 'مستورد', description: 'كيان معتمد بعد فحص المستندات.' },
  { value: 'مورد', label: 'مورد', description: 'كيان معتمد بعد فحص المستندات.' },
  { value: 'مصدر', label: 'مصدر', description: 'كيان معتمد بعد فحص المستندات.' },
  { value: 'مستخدم مسجل', label: 'مستخدم مسجل', description: 'مستخدم فعّل حسابه وسجل الدخول ولم يُعيّن له دور محدد بعد.' },
  { value: 'زائر', label: 'زائر', description: 'مستخدم غير مسجل أو ضيف.' },
];

export default function RoleSelection() {
  const [selected, setSelected] = useState<UserRole | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading } = useSupabase();

  async function submit() {
    if (!selected) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/role-change-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ role: selected }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'تعذر إرسال الطلب.');
      toast({ title: 'تم إرسال الطلب', description: 'طلب تغيير الدور قيد المراجعة.' });
      router.push('/settings');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'تعذر إرسال الطلب', description: error.message || 'حاول مرة أخرى.' });
    }
  }

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">جاري التحميل...</div>;
  }

  if (!user) {
    return <div className="flex h-screen items-center justify-center">يجب تسجيل الدخول أولاً.</div>;
  }

  return (
    <Card className="mx-auto mt-12 max-w-xl">
      <CardHeader>
        <CardTitle>اختيار الدور الوظيفي</CardTitle>
        <CardDescription>
          اختر الدور الذي ترغب في مراجعته. سيتم إرسال الطلب إلى مالك أو مشرف إداري للموافقة عليه.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={selected ?? undefined} onValueChange={(value) => setSelected(value as UserRole)}>
          <div className="grid gap-3">
            {AVAILABLE_ROLES.map((role) => (
              <div
                key={role.value}
                className="flex items-start gap-3 rounded-md border p-4 has-[[data-state=checked]]:border-primary"
              >
                <RadioGroupItem value={role.value} id={role.value} className="mt-1" />
                <Label htmlFor={role.value} className="cursor-pointer">
                  <div className="font-semibold">{role.label}</div>
                  <div className="text-sm text-muted-foreground">{role.description}</div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
        <Button className="w-full" disabled={!selected} onClick={submit}>
          إرسال طلب
        </Button>
      </CardContent>
    </Card>
  );
}
