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
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Leaf, Loader2, Phone, KeyRound } from 'lucide-react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-provider';
import { useSupabase } from '@/supabase/provider';

// Common country codes
const countryCodes = [
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+962', country: 'Jordan', flag: '🇯🇴' },
  { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
  { code: '+963', country: 'Syria', flag: '🇸🇾' },
  { code: '+218', country: 'Libya', flag: '🇱🇾' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
];

// Steps in the hybrid auth flow
type AuthStep = 'email_password' | 'whatsapp_verify' | 'complete_profile';

export default function LoginPage() {
  const { t } = useLanguage();
  const { user, isLoading: isUserLoading } = useSupabase();
  const router = useRouter();
  const { toast } = useToast();
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<AuthStep>('email_password');
  const [isSigningIn, setIsSigningIn] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('+20');
  
  const normalizePhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (value.trim().startsWith('+')) {
      return `+${cleaned}`;
    }

    let local = cleaned;
    if (selectedCountryCode === '+20') {
      if (local.startsWith('0')) {
        local = local.substring(1);
      }
      if (local.startsWith('20') && local.length > 10) {
        local = local.substring(2);
      }
    }

    return `${selectedCountryCode}${local}`;
  };

  // Schema for email/password step
  const emailPasswordSchema = z.object({
    email: z.string().email({
      message: t.loginEmailValidation,
    }),
    password: z.string().min(6, {
      message: t.loginPasswordValidation,
    }),
  });

  // Schema for WhatsApp verification
  const whatsappSchema = z.object({
    whatsapp: z.string().transform((val) => val.trim()).superRefine((val, ctx) => {
      const normalized = normalizePhoneNumber(val);
      if (!/^\+[1-9]\d{6,14}$/.test(normalized)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `تنسيق رقم الهاتف غير صالح. تأكد من اختيار رمز البلد الصحيح ثم أدخل الرقم المحلي بدون صفر بداية، مثلاً 1026135075 مع +20.`, 
        });
      }
    }),
  });

  // Schema for verification code
  const verificationSchema = z.object({
    code: z.string().length(6, {
      message: 'Verification code must be 6 digits',
    }),
  });

  const emailPasswordForm = useForm<z.infer<typeof emailPasswordSchema>>({
    resolver: zodResolver(emailPasswordSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const whatsappForm = useForm<z.infer<typeof whatsappSchema>>({
    resolver: zodResolver(whatsappSchema),
    defaultValues: {
      whatsapp: '',
    },
  });

  const verificationForm = useForm<z.infer<typeof verificationSchema>>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && user && currentStep === 'email_password') {
      router.push('/');
    }
  }, [user, isUserLoading, router, currentStep]);

  // Step 1: Handle Email/Password submission (Sign In or Sign Up)
  const onEmailPasswordSubmit = async (values: z.infer<typeof emailPasswordSchema>) => {
    setIsLoading(true);
    try {
      if (isSigningIn) {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) throw error;
        // After sign in, check if WhatsApp is verified
        const { data: profile } = await supabase
          .from('profiles')
          .select('whatsapp_verified, status')
          .eq('id', (await supabase.auth.getUser()).data.user?.id || '')
          .single();
        
        if (profile && !profile.whatsapp_verified) {
          setCurrentStep('whatsapp_verify');
          toast({
            title: 'WhatsApp verification required',
            description: 'Please verify your WhatsApp number to continue',
          });
        }
      } else {
        // Sign Up - Step 1: Create account using server-side admin registration
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: values.email,
            password: values.password,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to create account');
        }

        setAuthEmail(values.email);
        setCurrentStep('whatsapp_verify');

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

        if (signInError) {
          throw signInError;
        }

        if (result.user?.id) {
          setUserId(result.user.id);
        }

        toast({
          title: t.loginProcessingTitle,
          description: 'Account created! Now verify your WhatsApp number.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t.loginAuthFailedTitle,
        description: error.message || t.loginUnexpectedError,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Send WhatsApp OTP
  const onWhatsAppSubmit = async (values: z.infer<typeof whatsappSchema>) => {
    setIsLoading(true);
    setWhatsappNumber(values.whatsapp);
    
    try {
      const normalizedPhone = normalizePhoneNumber(values.whatsapp);
      setWhatsappNumber(normalizedPhone);

      const response = await fetch('/api/auth/whatsapp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: normalizedPhone,
          userId: userId,
          email: authEmail || emailPasswordForm.getValues('email'),
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send OTP');
      }

      setCurrentStep('complete_profile');
      toast({
        title: 'Verification code sent',
        description: `OTP sent to ${values.whatsapp} via WhatsApp`,
      });

      // In development, show the code (remove in production!)
      if (result.code) {
        console.log(`[DEV] Your OTP code is: ${result.code}`);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to send OTP',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Verify OTP and complete profile
  const onVerificationSubmit = async (values: z.infer<typeof verificationSchema>) => {
    setIsLoading(true);
    
    try {
      // Call our API to verify OTP
      const response = await fetch('/api/auth/whatsapp-verify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: whatsappNumber,
          code: values.code,
          userId: userId,
          email: authEmail || emailPasswordForm.getValues('email'),
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Invalid verification code');
      }

      toast({
        title: 'Success!',
        description: 'WhatsApp number verified successfully',
      });

      // Redirect to complete profile or home
      router.push('/settings');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Verification failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
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
            {currentStep === 'email_password' && (isSigningIn ? t.loginSignInTitle : t.loginSignUpTitle)}
            {currentStep === 'whatsapp_verify' && 'Verify WhatsApp Number'}
            {currentStep === 'complete_profile' && 'Enter Verification Code'}
          </CardTitle>
          <CardDescription>
            {currentStep === 'email_password' && (
              isSigningIn ? t.loginSignInDescription : t.loginSignUpDescription
            )}
            {currentStep === 'whatsapp_verify' && 'We will send a verification code to your WhatsApp'}
            {currentStep === 'complete_profile' && `Enter the 6-digit code sent to ${whatsappNumber}`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Step 1: Email/Password */}
          {currentStep === 'email_password' && (
            <Form {...emailPasswordForm}>
              <form onSubmit={emailPasswordForm.handleSubmit(onEmailPasswordSubmit)} className="space-y-4">
                <FormField
                  control={emailPasswordForm.control}
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
                  control={emailPasswordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.formPasswordLabel}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••"
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSigningIn ? t.loginSignInButton : t.loginSignUpButton}
                </Button>
              </form>
            </Form>
          )}

          {/* Step 2: WhatsApp Verification */}
          {currentStep === 'whatsapp_verify' && (
            <Form {...whatsappForm}>
              <form onSubmit={whatsappForm.handleSubmit(onWhatsAppSubmit)} className="space-y-4">
                <FormField
                  control={whatsappForm.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp Number</FormLabel>
                      <FormDescription>
                        اختر رمز البلد ثم أدخل رقمك المحلي بدون صفر في البداية. مثال لمصر: 1026135075.
                      </FormDescription>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <Select
                            value={selectedCountryCode}
                            onValueChange={(countryCode) => {
                              const currentDigits = (field.value || '').replace(/\D/g, '');
                              const currentPrefix = selectedCountryCode.replace('+', '');
                              const cleanedLocal = currentDigits.startsWith(currentPrefix)
                                ? currentDigits.substring(currentPrefix.length)
                                : currentDigits;

                              setSelectedCountryCode(countryCode);
                              field.onChange(`${countryCode}${cleanedLocal}`.trim());
                            }}
                          >
                            <SelectTrigger className="w-[140px] shrink-0">
                              <SelectValue placeholder="Code" />
                            </SelectTrigger>
                            <SelectContent>
                              {countryCodes.map((item) => (
                                <SelectItem key={item.code} value={item.code}>
                                  {item.flag} {item.code} {item.country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="1026135075"
                            value={(field.value || '')
                              .replace(/\D/g, '')
                              .replace(new RegExp(`^${selectedCountryCode.replace('+', '')}`), '')
                            }
                            onChange={(e) => {
                              let inputValue = e.target.value.replace(/\D/g, '');
                              if (selectedCountryCode === '+20' && inputValue.startsWith('0')) {
                                inputValue = inputValue.substring(1);
                              }
                              field.onChange(`${selectedCountryCode}${inputValue}`.trim());
                            }}
                            disabled={isLoading}
                            className="flex-1"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send Verification Code
                </Button>
              </form>
            </Form>
          )}

          {/* Step 3: Enter Verification Code */}
          {currentStep === 'complete_profile' && (
            <Form {...verificationForm}>
              <form onSubmit={verificationForm.handleSubmit(onVerificationSubmit)} className="space-y-4">
                <FormField
                  control={verificationForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <KeyRound className="h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="123456"
                            {...field}
                            disabled={isLoading}
                            maxLength={6}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Verify Code
                </Button>
              </form>
            </Form>
          )}

          {/* Toggle between Sign In and Sign Up */}
          {currentStep === 'email_password' && (
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
          )}

          {/* Back button for WhatsApp steps */}
          {(currentStep === 'whatsapp_verify' || currentStep === 'complete_profile') && (
            <div className="mt-4 text-center text-sm">
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => {
                  setCurrentStep('email_password');
                  setWhatsappNumber('');
                  setVerificationCode('');
                }}
              >
                ← Back to Email/Password
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
