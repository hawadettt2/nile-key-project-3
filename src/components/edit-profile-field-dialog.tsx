'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/language-provider';
import { Loader2 } from 'lucide-react';

interface EditProfileFieldDialogProps {
  fieldName: 'userName' | 'companyName' | 'whatsapp' | 'mobile' | null;
  currentValue: string | undefined | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { [key: string]: string }) => Promise<void>;
}

export function EditProfileFieldDialog({
  fieldName,
  currentValue,
  isOpen,
  onClose,
  onSave,
}: EditProfileFieldDialogProps) {
  const { t } = useLanguage();
  const [value, setValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValue(currentValue || '');
    }
  }, [isOpen, currentValue]);

  const handleSave = async () => {
    if (!fieldName) return;
    setIsSaving(true);
    try {
      await onSave({ [fieldName]: value });
      onClose(); // Close only on success
    } catch (e) {
      // Error is handled and toasted by the parent component.
      // We keep the dialog open for the user to try again.
      console.error("Save from dialog failed", e);
    } finally {
      setIsSaving(false);
    }
  };
  
  const getLabel = () => {
    if (fieldName === 'userName') return t.formUserNameLabel;
    if (fieldName === 'companyName') return t.formCompanyNameLabel;
    if (fieldName === 'whatsapp') return t.formWhatsapp;
    if (fieldName === 'mobile') return t.formMobileLabel;
    return '';
  }
  
  // Create a dynamic title like "Edit Username"
  const title = t.editFieldTitle.replace('{field}', getLabel());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="field-value" className="text-right">
              {getLabel()}
            </Label>
            <Input
              id="field-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="col-span-3"
              disabled={isSaving}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSaving}>{t.cancel}</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mx-2 h-4 w-4 animate-spin" />}
            {t.saveButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
