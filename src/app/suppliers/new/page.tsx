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
import { useLanguage } from '@/context/language-provider';
import { Textarea } from '@/components/ui/textarea';

function AddSupplierForm() {
    const { language, t } = useLanguage();
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const supplierSchema = z.object({
        farmName: z.string().min(1, t.formFarmNameRequired),
        codificationCode: z.string().optional(),
        cropVarieties: z.string().min(1, t.formCropTypeRequired).transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
        certificationStatus: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
        location: z.string().min(1, t.formLocationRequired),
        gpsLocation: z.string().optional(),
        capacity: z.preprocess((a) => a ? parseFloat(z.string().parse(a)) : undefined, z.number().positive().optional()),
        contactNumber: z.string().min(1, t.formContactNumberRequired),
    });

    const form = useForm<z.infer<typeof supplierSchema>>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
          farmName: '',
          codificationCode: '',
          cropVarieties: [],
          certificationStatus: [],
          location: '',
          gpsLocation: '',
          capacity: undefined,
          contactNumber: '',
        },
    });

    const handleAddSupplier = async (values: z.infer<typeof supplierSchema>) => {
        if (!user) {
          toast({ variant: 'destructive', title: t.authErrorTitle, description: t.authErrorDescription });
          return;
        }
        setIsSubmitting(true);
        try {
          const collectionRef = collection(firestore, 'users', user.uid, 'suppliers');
          await addDocumentNonBlocking(collectionRef, { ...values, createdAt: serverTimestamp() });
          toast({ title: t.addSupplierSuccessTitle, description: t.addSupplierSuccessDescription });
          form.reset();
          router.push('/suppliers');
        } catch (error) {
          console.error('Failed to add supplier:', error);
          toast({ variant: 'destructive', title: t.addSupplierFailTitle, description: t.addSupplierFailDescription });
        } finally {
          setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <PlusCircle className="h-6 w-6" /> {t.addPageTitleSuppliers}
            </CardTitle>
            <CardDescription>{t.addPageDescriptionSuppliers}</CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddSupplier)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <FormField control={form.control} name="farmName" render={({ field }) => (
                        <FormItem><FormLabel>{t.formFarmName}</FormLabel><FormControl><Input placeholder={t.formFarmNamePlaceholder} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="codificationCode" render={({ field }) => (
                        <FormItem><FormLabel>{t.formCodificationCode}</FormLabel><FormControl><Input placeholder="e.g. 12345" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="location" render={({ field }) => (
                        <FormItem><FormLabel>{t.formLocation}</FormLabel><FormControl><Input placeholder={t.formLocationPlaceholder} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="gpsLocation" render={({ field }) => (
                        <FormItem><FormLabel>{t.formGpsLocation}</FormLabel><FormControl><Input placeholder="e.g. 30.0444, 31.2357" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="capacity" render={({ field }) => (
                        <FormItem><FormLabel>{t.formCapacity}</FormLabel><FormControl><Input type="number" placeholder="e.g. 5000" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="contactNumber" render={({ field }) => (
                        <FormItem><FormLabel>{t.formContactNumber}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="cropVarieties" render={({ field }) => (
                        <FormItem><FormLabel>{t.formCropVarieties}</FormLabel><FormControl><Textarea placeholder={t.formCropTypePlaceholder} {...field} /></FormControl><CardDescription>{t.formCommaSeparated}</CardDescription><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="certificationStatus" render={({ field }) => (
                        <FormItem><FormLabel>{t.formCertificationStatus}</FormLabel><FormControl><Textarea placeholder="e.g. GLOBALG.A.P, ISO 22000" {...field} /></FormControl><CardDescription>{t.formCommaSeparated}</CardDescription><FormMessage /></FormItem>
                    )} />
                </div>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mx-2 h-4 w-4 animate-spin" />}
                    {t.addSupplierButton}
                </Button>
                </form>
            </Form>
            </CardContent>
        </Card>
    );
}

export default function AddSupplierPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <AddSupplierForm />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
