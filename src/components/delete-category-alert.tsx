
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from './ui/button';
import { useLanguage } from '@/context/language-provider';
import { useSupabase } from '@/supabase/provider';
import { supabase } from '@/supabase/client';

interface DeleteCategoryAlertProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  categoryId: string;
  onDeleted: () => void;
}

export function DeleteCategoryAlert({ isOpen, onOpenChange, categoryId, onDeleted }: DeleteCategoryAlertProps) {
  const { t } = useLanguage();
  const { user } = useSupabase();

  const handleDelete = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('site_categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user.id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting category:', error);
    }
    onDeleted();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.deleteCategoryTitle}</AlertDialogTitle>
          <AlertDialogDescription>{t.deleteCategoryDesc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleDelete} variant="destructive">{t.deleteButton}</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
