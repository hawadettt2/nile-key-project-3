'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-provider';
import { addDocumentNonBlocking, useFirestore, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Textarea } from './ui/textarea';

interface AddSiteDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  categoryId: string;
}

export function AddSiteDialog({ isOpen, onOpenChange, categoryId }: AddSiteDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();

  const siteSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    url: z.string().url('Please enter a valid URL'),
    description: z.string().optional(),
  });

  const form = useForm<z.infer<typeof siteSchema>>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      title: '',
      url: '',
      description: '',
    },
  });

  const handleAddSite = async (values: z.infer<typeof siteSchema>) => {
    if (!user || !categoryId) {
      toast({ variant: 'destructive', title: t.authErrorTitle, description: 'Cannot add site.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const sitesCollectionRef = collection(firestore, 'users', user.uid, 'siteCategories', categoryId, 'sites');
      await addDocumentNonBlocking(sitesCollectionRef, values);
      toast({ title: t.addSiteSuccess });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add site:', error);
      toast({ variant: 'destructive', title: t.addSiteFail });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.addSiteTitle}</DialogTitle>
          <DialogDescription>{t.addSiteSuccess}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAddSite)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.formSiteTitle}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.formSiteUrl}</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
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
                  <FormLabel>{t.formSiteDescription}</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isSubmitting}>{t.cancel}</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mx-2 h-4 w-4 animate-spin" />}
                    {t.addButton}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
