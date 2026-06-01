'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, LogIn, ShieldCheck } from 'lucide-react';
import { supabase } from '@/supabase/client';
import { useSupabase } from '@/supabase/provider';
import { useLanguage } from '@/context/language-provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { COMPANY_NAME } from '@/lib/access-control';

const loginSchema = z.object({
  email: z.string().email('أدخل بريدًا إلكترونيًا صحيحًا'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const copy = {
  ar: {
    eyebrow: 'تسجيل الدخول الآمن',
    title: 'منصة مفتاح النيل',
    description: 'الدخول يتم عبر البريد الإلكتروني وكلمة المرور فقط. نظام آمن وموثوق للتجارة التصديرية.',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    button: 'دخول',
    loading: 'جارٍ التحقق...',
    errorTitle: 'تعذر تسجيل الدخول',
    errorDescription: 'تحقق من البريد الإلكتروني وكلمة المرور.',
    footer: 'الوصول مخصص لأعضاء شركة مفتاح النيل فقط.',
  },
  en: {
    eyebrow: 'Secure sign in',
    title: 'Nile Key Platform',
    description: 'Authentication via email and password only. Secure system for export trading.',
    email: 'Email',
    password: 'Password',
    button: 'Sign in',
    loading: 'Signing in...',
    errorTitle: 'Sign in failed',
    errorDescription: 'Check your email and password.',
    footer: 'Access is limited to Nile Key team members.',
  },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading } = useSupabase();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const t = copy[language as 'ar' | 'en'];

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/');
    }
  }, [isLoading, router, user]);

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email.trim(),
        password: values.password,
      });

      if (error) throw error;
      router.replace('/');
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
                {(submitting || isLoading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                {(submitting || isLoading) ? t.loading : t.button}
              </Button>
            </form>
          </Form>
          <div className="mt-6 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">{COMPANY_NAME}</div>
            <div className="mt-1">{t.footer}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
