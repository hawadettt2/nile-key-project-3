'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PlaceHolderImages, ImagePlaceholder } from '@/lib/placeholder-images';
import Image from 'next/image';
import { useLanguage } from '@/context/language-provider';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';

interface EditAvatarDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAvatarSelect: (url: string) => void;
}

export function EditAvatarDialog({
  isOpen,
  onOpenChange,
  onAvatarSelect,
}: EditAvatarDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const avatarImages = PlaceHolderImages.filter(img => img.id.startsWith('avatar-'));

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: 'Please select an image smaller than 2MB.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onAvatarSelect(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.editAvatarTitle}</DialogTitle>
          <DialogDescription>
            {t.editAvatarDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="avatar-upload">{t.uploadAvatarTitle}</Label>
            <Input id="avatar-upload" type="file" accept="image/png, image/jpeg, image/gif" onChange={handleFileChange} />
          </div>
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-background px-2 text-xs text-muted-foreground">{t.orSelectAvatar}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {avatarImages.map((avatar: ImagePlaceholder) => (
              <button
                key={avatar.id}
                onClick={() => onAvatarSelect(avatar.imageUrl)}
                className="rounded-full overflow-hidden aspect-square border-2 border-transparent hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <Image
                  src={avatar.imageUrl}
                  alt={avatar.description}
                  width={100}
                  height={100}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
