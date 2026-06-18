'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Globe } from 'lucide-react';
import { supabase } from '@/supabase/client';
import { useSupabase } from '@/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/app/app-layout';

export default function NewSitePage() {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useSupabase();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/important-sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ title, url, description }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'فشل إضافة الموقع');

      toast({ title: 'تم', description: 'تم إضافة الموقع بنجاح' });
      router.push('/sites');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-6">يجب تسجيل الدخول أولاً</div>;

  return (
    <AppLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>إضافة موقع موثق جديد</CardTitle>
            <CardDescription>أدخل بيانات الموقع الجديد</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان الموقع</Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">رابط الموقع</Label>
                <Input id="url" type="url" value={url} onChange={e => setUrl(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Input id="description" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> جاري الحفظ</> : <><Save className="h-4 w-4 mr-2" /> حفظ الموقع</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}