'use client';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PlusCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { useLanguage } from "@/context/language-provider";
import { Switch } from "@/components/ui/switch";

function AddShipmentForm() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const shipmentStatusEnum = z.enum([t.shipmentStatusOption1, t.shipmentStatusOption2, t.shipmentStatusOption4, t.shipmentStatusOption5]);
  const transportTypeEnum = z.enum(['Air', 'Land', 'Sea']);

  const shipmentSchema = z.object({
    shipmentType: z.string().min(1, t.formShipmentTypeRequired),
    weight: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number().positive(t.formWeightPositive)),
    containerNumber: z.string().min(1, t.formContainerNumberRequired),
    trackingNumber: z.string().min(1, t.formTrackingNumberRequired),
    acidNumber: z.string().optional(),
    carrierDetails: z.string().optional(),
    isTemperatureControlled: z.boolean().default(false),
    transportType: transportTypeEnum,
    quantity: z.preprocess((a) => parseInt(z.string().parse(a), 10), z.number().int().positive(t.formQuantityPositive)),
    price: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number().positive(t.formPricePositive)),
    customer: z.string().min(1, t.formCustomerRequired),
    status: shipmentStatusEnum,
  });

  const form = useForm<z.infer<typeof shipmentSchema>>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      shipmentType: "",
      weight: 0,
      containerNumber: "",
      trackingNumber: "",
      acidNumber: "",
      carrierDetails: "",
      isTemperatureControlled: false,
      transportType: "Sea",
      quantity: 0,
      price: 0,
      customer: "",
      status: t.shipmentStatusOption1,
    },
  });

  const handleAddShipment = async (values: z.infer<typeof shipmentSchema>) => {
    if (!user) {
      toast({ variant: "destructive", title: t.authErrorTitle, description: t.authErrorDescription });
      return;
    }
    setIsSubmitting(true);
    try {
      const collectionRef = collection(firestore, 'users', user.uid, 'shipments');
      await addDocumentNonBlocking(collectionRef, { ...values, createdAt: serverTimestamp() });
      toast({ title: t.addShipmentSuccessTitle, description: t.addShipmentSuccessDescription });
      form.reset();
      router.push('/shipments');
    } catch (error) {
      console.error("Failed to add shipment:", error);
      toast({ variant: "destructive", title: t.addShipmentFailTitle, description: t.addShipmentFailDescription });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><PlusCircle className="h-6 w-6"/> {t.addPageTitleShipments}</CardTitle>
        <CardDescription>{t.addPageDescriptionShipments}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAddShipment)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField control={form.control} name="shipmentType" render={({ field }) => (
                <FormItem><FormLabel>{t.formShipmentType}</FormLabel><FormControl><Input placeholder={t.formShipmentTypePlaceholder} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="customer" render={({ field }) => (
                <FormItem><FormLabel>{t.formCustomer}</FormLabel><FormControl><Input placeholder={t.formCustomerPlaceholder} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="trackingNumber" render={({ field }) => (
                <FormItem><FormLabel>{t.formTrackingNumber}</FormLabel><FormControl><Input placeholder={t.formTrackingNumberPlaceholder} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="containerNumber" render={({ field }) => (
                <FormItem><FormLabel>{t.formContainerNumber}</FormLabel><FormControl><Input placeholder={t.formContainerNumberPlaceholder} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="acidNumber" render={({ field }) => (
                <FormItem><FormLabel>{t.formAcidNumber}</FormLabel><FormControl><Input placeholder="e.g., 123456789" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="carrierDetails" render={({ field }) => (
                <FormItem><FormLabel>{t.formCarrierDetails}</FormLabel><FormControl><Input placeholder="e.g., Maersk, CMA CGM" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="weight" render={({ field }) => (
                <FormItem><FormLabel>{t.formWeight}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem><FormLabel>{t.formQuantity}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem><FormLabel>{t.formPrice}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
                <FormField control={form.control} name="transportType" render={({ field }) => (
                <FormItem><FormLabel>{t.formTransportType}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder={t.formTransportTypePlaceholder} /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Land">{t.transportTypeLand}</SelectItem>
                      <SelectItem value="Air">{t.transportTypeAir}</SelectItem>
                      <SelectItem value="Sea">{t.transportTypeSea}</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>{t.formStatus}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder={t.formStatusPlaceholder} /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={t.shipmentStatusOption1}>{t.shipmentStatusOption1}</SelectItem>
                      <SelectItem value={t.shipmentStatusOption2}>{t.shipmentStatusOption2}</SelectItem>
                      <SelectItem value={t.shipmentStatusOption4}>{t.shipmentStatusOption4}</SelectItem>
                      <SelectItem value={t.shipmentStatusOption5}>{t.shipmentStatusOption5}</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="isTemperatureControlled" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-8">
                  <div className="space-y-0.5">
                      <FormLabel>{t.formIsTemperatureControlled}</FormLabel>
                  </div>
                  <FormControl>
                      <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      />
                  </FormControl>
                  </FormItem>
              )} />
            </div>
            <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mx-2 h-4 w-4 animate-spin" />}
              {t.addShipmentButton}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


export default function AddShipmentPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <AddShipmentForm />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
