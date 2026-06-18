'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, User } from 'lucide-react';
import { supabase } from '@/supabase/client';
import { useSupabase } from '@/supabase/provider';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useSupabase();
  const { toast } = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        const result = await response.json();
        if (response.ok && result.data) {
          setDisplayName(result.data.display_name || '');
          setPhone(result.data.phone || '');
          setCountry(result.data.country || '');
        }
      } catch (error: any) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ displayName, phone, country }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'فشل حفظ الإعدادات');

      toast({ title: 'تم الحفظ', description: 'تم حفظ الإعدادات بنجاح' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إعدادات الحساب</CardTitle>
          <CardDescription>تعديل معلومات حسابك الشخصية</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" value={user?.email || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">الاسم المعروض</Label>
            <Input id="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">الهاتف</Label>
            <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+20xxxxxxxxx" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">البلد</Label>
            <Input id="country" value={country} onChange={e => setCountry(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">اللغة</Label>
            <select
              id="language"
              value={language}
              onChange={e => setLanguage(e.target.value as 'ar' | 'en')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> جاري الحفظ</> : <><Save className="h-4 w-4 mr-2" /> حفظ الإعدادات</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}