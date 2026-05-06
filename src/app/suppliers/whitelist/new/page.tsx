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
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from '@/context/language-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { governorates } from "@/lib/governorates";

function AddNfsaSupplierForm() {
    const { language, t } = useLanguage();
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const supplierSchema = z.object({
        supplierName: z.string().min(1, t.formSupplierNameRequired),
        address: z.string().min(1, t.formAddressRequired),
        governorate: z.string().min(1, t.formGovernorateRequired),
        activityType: z.string().min(1, t.formActivityRequired),
        phoneNumber: z.string().optional(),
        notes: z.string().optional(),
    });

    const form = useForm<z.infer<typeof supplierSchema>>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            supplierName: '',
            address: '',
            governorate: '',
            activityType: '',
            phoneNumber: '',
            notes: '',
        },
    });

    const handleAddSupplier = async (values: z.infer<typeof supplierSchema>) => {
        if (!user) {
          toast({ variant: 'destructive', title: t.authErrorTitle, description: t.authErrorDescription });
          return;
        }
        setIsSubmitting(true);
        try {
          const collectionRef = collection(firestore, 'users', user.uid, 'nfsaSuppliers');
          await addDocumentNonBlocking(collectionRef, { ...values, createdAt: serverTimestamp() });
          toast({ title: t.addNfsaSupplierSuccess });
          form.reset();
          router.push('/suppliers/whitelist');
        } catch (error) {
          console.error('Failed to add supplier:', error);
          toast({ variant: 'destructive', title: t.addNfsaSupplierFailure });
        } finally {
          setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <PlusCircle className="h-6 w-6" /> {t.addNfsaSupplierTitle}
                </CardTitle>
                <CardDescription>{t.addNfsaSupplierDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddSupplier)} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField control={form.control} name="supplierName" render={({ field }) => (
                                <FormItem><FormLabel>{t.formSupplierNameLabel}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="activityType" render={({ field }) => (
                                <FormItem><FormLabel>{t.formActivityLabel}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                         <FormField
                            control={form.control}
                            name="governorate"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t.formGovernorateLabel}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t.filterByGovernoratePlaceholder} />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {governorates.map(gov => (
                                        <SelectItem key={gov.code} value={language === 'ar' ? gov.ar : gov.en}>
                                        {language === 'ar' ? gov.ar : gov.en}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem><FormLabel>{t.formAddressLabel}</FormLabel><FormControl><Textarea placeholder={t.formAddressPlaceholder} {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                            <FormItem><FormLabel>{t.formPhoneNumberLabel}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem><FormLabel>{t.formNotesLabel}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mx-2 h-4 w-4 animate-spin" />}
                            {t.addNfsaSupplierButton}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

export default function AddNfsaSupplierPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <AddNfsaSupplierForm />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
