'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '@/supabase/client';
import { useSupabase } from '@/supabase/provider';
import { useToast } from '@/hooks/use-toast';

export default function NewCustomerPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useSupabase();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          company_name: companyName,
          country,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'فشل إضافة العميل');

      toast({ title: 'تم', description: 'تم إضافة العميل بنجاح' });
      router.push('/customers');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إضافة عميل جديد</CardTitle>
          <CardDescription>أدخل بيانات العميل الجديد</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">الهاتف</Label>
              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">اسم الشركة</Label>
              <Input id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">البلد</Label>
              <Input id="country" value={country} onChange={e => setCountry(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> جاري الحفظ</> : <><Save className="h-4 w-4 mr-2" /> حفظ العميل</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}