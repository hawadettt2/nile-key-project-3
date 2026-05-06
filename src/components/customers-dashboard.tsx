'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Users, Bot, Search, AlertTriangle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { searchCustomers, type SearchCustomersInput, type SearchCustomersOutput } from '@/ai/flows/search-customers';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/context/language-provider';

export function CustomersDashboard() {
  const { language, t } = useLanguage();

  const rfqSchema = z.object({
    companyName: z.string().min(1, t.formCompanyNameRequired),
    email: z.string().email(t.formEmailRequired),
    whatsapp: z.string().optional(),
    destinationCountry: z.string().min(1, t.formDestinationCountryRequired),
    destinationPort: z.string().min(1, t.formDestinationPortRequired),
    product: z.string().min(1, t.formProductRequired),
    specifications: z.string().min(1, t.formSpecificationsRequired),
    quantity: z.string().min(1, t.formQuantityRfqRequired),
    additionalNotes: z.string().optional(),
  });

  type Customer = { 
    id: string; 
    createdAt: { seconds: number, nanoseconds: number };
    customerCode?: string;
    clientName: string;
    country: string;
    incoTerms: string;
    creditLimit: number;
   };

  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchCustomersOutput | null>(null);
  const [isRfqSubmitting, setIsRfqSubmitting] = useState(false);
  
  const rfqForm = useForm<z.infer<typeof rfqSchema>>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      companyName: '',
      email: '',
      whatsapp: '',
      destinationCountry: '',
      destinationPort: '',
      product: '',
      specifications: '',
      quantity: '',
      additionalNotes: '',
    },
  });

  const customersQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'customers'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersQuery);
  
  const handleRfqSubmit = async (values: z.infer<typeof rfqSchema>) => {
    setIsRfqSubmitting(true);
    try {
      // Here you would typically send an email or save to a different collection
      // For this example, we'll just simulate a successful submission with a toast.
      console.log('RFQ Submitted:', values);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      toast({ title: t.rfqSuccessTitle, description: t.rfqSuccessDescription });
      rfqForm.reset();
    } catch (error) {
      console.error('Failed to submit RFQ:', error);
      toast({ variant: 'destructive', title: t.rfqFailTitle, description: t.rfqFailDescription });
    } finally {
      setIsRfqSubmitting(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults(null);
    try {
      const input: SearchCustomersInput = { query: searchQuery };
      const result = await searchCustomers(input);
      setSearchResults(result);
    } catch (error) {
      console.error('Failed to search customers:', error);
      toast({ variant: 'destructive', title: t.aiSearchFailTitle, description: t.aiSearchFailDescription });
    } finally {
      setIsSearching(false);
    }
  };

  if (isUserLoading) {
      return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!user) {
      return (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold">{t.loginRequiredTitle}</h2>
              <p className="mt-2 text-muted-foreground">{t.loginRequiredDescription}</p>
              <Button asChild className="mt-4">
                <a href="/login">{t.sidebarLoginButton}</a>
              </Button>
            </div>
          </div>
      )
  }


  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Users className="h-6 w-6" /> {t.customersTitle}
          </CardTitle>
          <CardDescription>{t.customersDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCustomers ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <Loader2 className="mx-2 h-4 w-4 animate-spin" /> {t.loadingCustomers}
            </div>
          ) : customers && customers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.tableHeaderCustomerCode}</TableHead>
                  <TableHead>{t.tableHeaderClientName}</TableHead>
                  <TableHead>{t.tableHeaderCountry}</TableHead>
                  <TableHead>{t.tableHeaderIncoTerms}</TableHead>
                  <TableHead>{t.tableHeaderCreditLimit}</TableHead>
                  <TableHead>{t.tableHeaderDate}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.customerCode || '-'}</TableCell>
                    <TableCell className="font-medium">{customer.clientName}</TableCell>
                    <TableCell>{customer.country}</TableCell>
                    <TableCell>{customer.incoTerms}</TableCell>
                    <TableCell>${customer.creditLimit.toLocaleString()}</TableCell>
                    <TableCell>
                      {customer.createdAt ? format(new Date(customer.createdAt.seconds * 1000), 'PPP', { locale: language === 'ar' ? ar : enUS }) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <Users className="h-12 w-12" />
              <h3 className="font-semibold">{t.noCustomersTitle}</h3>
              <p className="max-w-xs text-sm">{t.noCustomersDescription}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <FileText className="h-6 w-6" /> {t.rfqTitle}
          </CardTitle>
          <CardDescription>{t.rfqDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...rfqForm}>
            <form onSubmit={rfqForm.handleSubmit(handleRfqSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField control={rfqForm.control} name="companyName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.formCompanyName}</FormLabel>
                    <FormControl><Input placeholder={t.formCompanyNamePlaceholder} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={rfqForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.formEmail}</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={rfqForm.control} name="whatsapp" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.formWhatsapp}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={rfqForm.control} name="destinationCountry" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.formDestinationCountry}</FormLabel>
                    <FormControl><Input placeholder={t.formCountryPlaceholder} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={rfqForm.control} name="destinationPort" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.formDestinationPort}</FormLabel>
                    <FormControl><Input placeholder={t.formDestinationPortPlaceholder} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={rfqForm.control} name="quantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.formQuantityRfq}</FormLabel>
                    <FormControl><Input placeholder={t.formQuantityRfqPlaceholder} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={rfqForm.control} name="product" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.formProduct}</FormLabel>
                  <FormControl><Textarea placeholder={t.formProductRfqPlaceholder} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={rfqForm.control} name="specifications" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.formSpecifications}</FormLabel>
                  <FormControl><Textarea placeholder={t.formSpecificationsPlaceholder} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={rfqForm.control} name="additionalNotes" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.formAdditionalNotes}</FormLabel>
                  <FormControl><Textarea placeholder={t.formAdditionalNotesPlaceholder} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={isRfqSubmitting}>
                {isRfqSubmitting && <Loader2 className="mx-2 h-4 w-4 animate-spin" />}
                {t.rfqSubmitButton}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Bot className="h-6 w-6" /> {t.aiCustomerSearchTitle}
          </CardTitle>
          <CardDescription>{t.aiCustomerSearchDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.aiSearchCustomerPlaceholder}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="mx-2 h-4 w-4 animate-spin" /> : <Search className="mx-2 h-4 w-4" />}
                {t.aiSearchButton}
              </Button>
            </div>

            {(isSearching || searchResults) && (
            <div className="rounded-md border bg-background p-4">
              <h4 className="mb-2 font-semibold text-foreground">{t.resultsTitle}</h4>
              {isSearching ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mx-4 text-muted-foreground">{t.geminiAnalyzing}</p>
                </div>
              ) : searchResults && searchResults.customers.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.customers.map((customer, index) => (
                    <div key={index} className="rounded-md border p-4">
                      <h5 className="font-bold">{customer.clientName}</h5>
                      <p className="text-sm text-muted-foreground">{t.tableHeaderCountry}: {customer.country}</p>
                      <p className="text-sm">{customer.details}</p>
                      <a href={customer.source} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">{t.aiSource}</a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t.aiNoResults}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    