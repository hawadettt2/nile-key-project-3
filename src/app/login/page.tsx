'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Leaf, Loader2 } from 'lucide-react';
import {
  useAuth,
  useUser,
  initiateEmailSignUp,
  initiateEmailSignIn,
} from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-provider';

export default function LoginPage() {
  const { t } = useLanguage();

  const formSchema = z.object({
    email: z.string().email({
      message: t.loginEmailValidation,
    }),
    password: z.string().min(6, {
      message: t.loginPasswordValidation,
    }),
  });
  
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      if (isSigningIn) {
        initiateEmailSignIn(auth, values.email, values.password);
      } else {
        initiateEmailSignUp(auth, values.email, values.password);
      }
      toast({
        title: t.loginProcessingTitle,
        description: t.loginProcessingDescription,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t.loginAuthFailedTitle,
        description: error.message || t.loginUnexpectedError,
      });
      setIsLoading(false);
    }
    setTimeout(() => setIsLoading(false), 5000); 
  };
  
  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="flex items-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Leaf className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-headline text-2xl font-semibold">
            {t.nileKey}
          </span>
        </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">
            {isSigningIn ? t.loginSignInTitle : t.loginSignUpTitle}
          </CardTitle>
          <CardDescription>
            {isSigningIn
              ? t.loginSignInDescription
              : t.loginSignUpDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.formEmailLabel}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        {...field}
                        disabled={isLoading}
                      />
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
                    <FormLabel>{t.formPasswordLabel}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mx-2 h-4 w-4 animate-spin" />
                )}
                {isSigningIn ? t.loginSignInButton : t.loginSignUpButton}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            {isSigningIn ? t.loginNoAccountPrompt : t.loginHaveAccountPrompt}{' '}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => setIsSigningIn(!isSigningIn)}
            >
              {isSigningIn ? t.loginSignUpLink : t.loginSignInLink}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
