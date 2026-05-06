'use client';
import { useLanguage } from '@/context/language-provider';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase';

export default function BodyWrapper({ children }: { children: React.ReactNode }) {
    const { language } = useLanguage();
    const dir = language === 'ar' ? 'rtl' : 'ltr';

    return (
        <html lang={language} dir={dir}>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400..700&display=swap" rel="stylesheet" />
            </head>
            <body className="font-body antialiased">
                <FirebaseClientProvider>
                    {children}
                </FirebaseClientProvider>
                <Toaster />
            </body>
        </html>
    )
}
