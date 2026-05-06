'use client';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/context/language-provider';

function AddCustomerForm() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const customerSchema = z.object({
    customerCode: z.string().optional(),
    clientName: z.string().min(1, t.formCustomerRequired),
    country: z.string().min(1, t.formCountryRequired),
    creditLimit: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number().positive(t.formCreditLimitPositive)),
    hsCodesPreferred: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
    incoTerms: z.string().min(1, t.formIncoTermsRequired),
    paymentTerms: z.string().min(1, t.formPaymentTermsRequired),
  });

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerCode: '',
      clientName: '',
      country: '',
      creditLimit: 0,
      hsCodesPreferred: [],
      incoTerms: 'FOB',
      paymentTerms: '',
    },
  });

  const handleAddCustomer = async (values: z.infer<typeof customerSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: t.authErrorTitle, description: t.authErrorDescription });
      return;
    }
    setIsSubmitting(true);
    try {
      const collectionRef = collection(firestore, 'users', user.uid, 'customers');
      await addDocumentNonBlocking(collectionRef, { ...values, createdAt: serverTimestamp() });
      toast({ title: t.addCustomerSuccessTitle, description: t.addCustomerSuccessDescription });
      form.reset();
      router.push('/customers');
    } catch (error) {
      console.error('Failed to add customer:', error);
      toast({ variant: 'destructive', title: t.addCustomerFailTitle, description: t.addCustomerFailDescription });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <PlusCircle className="h-6 w-6" /> {t.addPageTitleCustomers}
        </CardTitle>
        <CardDescription>{t.addPageDescriptionCustomers}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAddCustomer)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="customerCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.formCustomerCode}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.formCustomerCodePlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.formClientName}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.formClientNamePlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.formCountry}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.formCountryPlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="creditLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.formCreditLimit}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="incoTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.formIncoTerms}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., FOB, CIF" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.formPaymentTerms}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., L/C, CAD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="hsCodesPreferred"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.formHsCodesPreferred}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t.formHsCodesPreferredPlaceholder} {...field} />
                    </FormControl>
                     <CardDescription>{t.formCommaSeparated}</CardDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mx-2 h-4 w-4 animate-spin" />}
              {t.addCustomerButton}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


export default function AddCustomerPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <AddCustomerForm />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
