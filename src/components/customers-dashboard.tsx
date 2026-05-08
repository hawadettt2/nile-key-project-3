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
import { useSupabase } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import { useCollection } from '@/supabase/hooks/use-collection';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/context/language-provider';
import { useAIChat } from '@/ai/hooks/use-ai-chat';

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
    created_at: string;
    customer_code?: string;
    client_name: string;
    country: string;
    inco_terms: string;
    credit_limit: number;
  };

  const { toast } = useToast();
  const { user, isLoading: isUserLoading } = useSupabase();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string>('');
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

  const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(
    supabase,
    'customers',
    user?.id,
    'created_at',
    'desc'
  );

  const { messages, input, handleInputChange, handleSubmit: handleChatSubmit, isLoading: isChatLoading } = useAIChat({
    systemPrompt: language === 'ar'
      ? 'أنت مساعد ذكي لشركة مفتاح النيل. ساعد في البحث عن العملاء.'
      : 'You are a helpful AI assistant for Nile Key company. Help with customer search.'
  });

  const handleRfqSubmit = async (values: z.infer<typeof rfqSchema>) => {
    setIsRfqSubmitting(true);
    try {
      console.log('RFQ Submitted:', values);
      await new Promise(resolve => setTimeout(resolve, 1000));
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
    setSearchResults('');
    try {
      const searchPrompt = language === 'ar'
        ? `ابحث عن عملاء للمنتج: ${searchQuery}`
        : `Search for customers for product: ${searchQuery}`;
      setSearchResults("AI search results will be displayed here.");
    } catch (error) {
      console.error('Failed to search customers:', error);
      toast({ variant: 'destructive', title: t.aiSearchFailTitle, description: t.aiSearchFailDescription });
    } finally {
      setIsSearching(false);
    }
  };

  if (isUserLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
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
    );
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer: Customer, index: number) => (
                  <TableRow key={customer.id || index}>
                    <TableCell>{customer.customer_code || '-'}</TableCell>
                    <TableCell>{customer.client_name}</TableCell>
                    <TableCell>{customer.country}</TableCell>
                    <TableCell>{customer.inco_terms}</TableCell>
                    <TableCell>${customer.credit_limit || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t.noCustomersTitle}</p>
              <p className="text-sm text-muted-foreground mt-2">{t.noCustomersDescription}</p>
            </div>
          )}
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
              placeholder={t.aiSearchCustomerPlaceholder}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.aiSearchButton}
            </Button>
          </div>
          {searchResults && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{searchResults}</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={rfqForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t.formCompanyNameLabel}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.formCompanyNamePlaceholder} {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={rfqForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t.formEmail}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.formEmailPlaceholder} {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={rfqForm.control}
                  name="destinationCountry"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t.formDestinationCountry}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.formDestinationCountryPlaceholder} {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={rfqForm.control}
                  name="destinationPort"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t.formDestinationPort}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.formDestinationPortPlaceholder} {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={rfqForm.control}
                name="product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.formProduct}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t.formProductRfqPlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={rfqForm.control}
                name="specifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.formSpecifications}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t.formSpecificationsPlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={rfqForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.formQuantityRfq}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.formQuantityRfqPlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isRfqSubmitting}>
                {isRfqSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.rfqSubmitButton}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Bot className="h-6 w-6" /> AI Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-64 overflow-y-auto border rounded-lg p-4 space-y-2">
            {messages.map((m: any, i: number) => (
              <div key={i} className={`p-2 rounded-lg ${m.role === 'user' ? 'bg-primary/10 ml-auto' : 'bg-muted'} max-w-[80%] ${m.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                <p className="text-sm">{m.content}</p>
              </div>
            ))}
            {isChatLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <Input 
              value={input}
              onChange={handleInputChange}
              placeholder="Ask AI something..."
              className="flex-1"
            />
            <Button type="submit" disabled={isChatLoading}>
              {isChatLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
