'use client';

import { useLanguage } from '@/context/language-provider';
import { Toaster } from "@/components/ui/toaster";
import { SupabaseProvider } from '@/supabase/provider';

export default function BodyWrapper({ children }: { children: React.ReactNode }) {
    const { language } = useLanguage();
    const dir = language === 'ar' ? 'rtl' : 'ltr';

    return (
        <html lang={language} dir={dir}>
            <head>
            </head>
            <body className="font-body antialiased">
                <SupabaseProvider>
                    {children}
                </SupabaseProvider>
                <Toaster />
            </body>
        </html>
    );
}
