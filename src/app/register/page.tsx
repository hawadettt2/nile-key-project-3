'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UserPlus, ShieldCheck, ArrowLeft } from 'lucide-react';
import { supabase } from '@/supabase/client';
import { useSupabase } from '@/supabase/provider';
import { useLanguage } from '@/context/language-provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const registerSchema = z.object({
  email: z.string().email('أدخل بريدًا إلكترونيًا صحيحًا'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  displayName: z.string().min(1, 'الاسم مطلوب'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const copy = {
  ar: {
    eyebrow: 'إنشاء حساب',
    title: 'الانضمام إلى مفتاح النيل',
    description: 'أنشئ حسابك وابدأ رحلتك التجارية.',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    displayName: 'الاسم الكامل',
    button: 'إنشاء الحساب',
    loading: 'جارٍ إنشاء الحساب...',
    success: 'تم إنشاء الحساب بنجاح',
    errorTitle: 'فشل إنشاء الحساب',
    errorDescription: 'حاول مرة أخرى.',
    loginLink: 'لديك حساب بالفعل؟',
    loginButton: 'تسجيل الدخول',
  },
  en: {
    eyebrow: 'Create Account',
    title: 'Join Nile Key',
    description: 'Create your account and start your trading journey.',
    email: 'Email',
    password: 'Password',
    displayName: 'Full Name',
    button: 'Create Account',
    loading: 'Creating account...',
    success: 'Account created successfully',
    errorTitle: 'Failed to create account',
    errorDescription: 'Please try again.',
    loginLink: 'Already have an account?',
    loginButton: 'Sign In',
  },
} as const;

export default function RegisterPage() {
  const router = useRouter();
  const { user, isLoading } = useSupabase();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const t = copy[language as 'ar' | 'en'];

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/');
    }
  }, [isLoading, router, user]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', displayName: '' },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Registration failed');

      toast({ title: t.success, variant: 'default' });
      router.push('/login');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t.errorTitle,
        description: error?.message || t.errorDescription,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Card className="w-full max-w-md border-border/60 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t.eyebrow}</p>
            <CardTitle className="text-2xl">{t.title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.displayName}</FormLabel>
                    <FormControl>
                      <Input placeholder="محمد أحمد" {...field} disabled={submitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.email}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="name@company.com" {...field} disabled={submitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.password}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••" {...field} disabled={submitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={submitting || isLoading}>
                {(submitting || isLoading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                {(submitting || isLoading) ? t.loading : t.button}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">{t.loginLink} </span>
            <Link href="/login" className="font-medium text-primary hover:underline">
              {t.loginButton}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}