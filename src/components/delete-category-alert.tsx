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
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import { useLanguage } from "@/context/language-provider";
import { deleteDocumentNonBlocking, useFirestore, useUser } from "@/firebase";
import { doc } from "firebase/firestore";

interface DeleteCategoryAlertProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  categoryId: string;
  onDeleted: () => void;
}

export function DeleteCategoryAlert({ isOpen, onOpenChange, categoryId, onDeleted }: DeleteCategoryAlertProps) {
  const { t } = useLanguage();
  const { user } = useUser();
  const firestore = useFirestore();

  const handleDelete = () => {
    if (!user) return;
    const categoryRef = doc(firestore, 'users', user.uid, 'siteCategories', categoryId);
    deleteDocumentNonBlocking(categoryRef);
    onDeleted();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.deleteCategoryTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.deleteCategoryDesc}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleDelete} variant="destructive">
              {t.deleteButton}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
