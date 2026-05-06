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
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Loader2, Globe, Shield, Search, Database, Code, Briefcase, Building2, Landmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from "@/context/language-provider";

const iconComponents = {
  Globe: <Globe className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  Search: <Search className="h-5 w-5" />,
  Database: <Database className="h-5 w-5" />,
  Code: <Code className="h-5 w-5" />,
  Briefcase: <Briefcase className="h-5 w-5" />,
  Building2: <Building2 className="h-5 w-5" />,
  Landmark: <Landmark className="h-5 w-5" />,
};

type IconName = keyof typeof iconComponents;

const ICONS: { name: IconName; component: React.ReactNode }[] = Object.entries(iconComponents).map(([name, component]) => ({ name: name as IconName, component }));


function AddCategoryForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categorySchema = z.object({
    title: z.string().min(1, t.formCategoryTitleRequired),
    description: z.string().optional(),
    icon: z.string().min(1, t.formCategoryIconRequired),
  });

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      title: '',
      description: '',
      icon: 'Globe',
    },
  });

  const handleAddCategory = async (values: z.infer<typeof categorySchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: t.authErrorTitle, description: t.authErrorDescription });
      return;
    }
    setIsSubmitting(true);
    try {
      const collectionRef = collection(firestore, 'users', user.uid, 'siteCategories');
      const docRef = await addDocumentNonBlocking(collectionRef, {
        ...values,
        createdAt: serverTimestamp(),
      });
      toast({ title: t.addCategorySuccessTitle, description: t.addCategorySuccessDesc });
      form.reset();
      if(docRef) {
        router.push(`/important-sites/${docRef.id}`);
      } else {
        // Fallback redirection if docRef is somehow not available
        router.push('/important-sites');
      }
    } catch (error) {
      console.error('Failed to add category:', error);
      toast({ variant: 'destructive', title: t.addCategoryFailTitle, description: t.addCategoryFailDesc });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <PlusCircle className="h-6 w-6" /> {t.addCategoryPageTitle}
        </CardTitle>
        <CardDescription>{t.addCategoryPageDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAddCategory)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.formCategoryTitle}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.formCategoryTitlePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.formCategoryDescription}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t.formCategoryDescriptionPlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.formCategoryIcon}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t.formCategoryIconPlaceholder} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ICONS.map(icon => (
                        <SelectItem key={icon.name} value={icon.name}>
                          <div className="flex items-center gap-2">
                            {icon.component}
                            <span>{icon.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mx-2 h-4 w-4 animate-spin" />}
              {t.addCategoryButton}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


export default function AddCategoryPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <AddCategoryForm />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
