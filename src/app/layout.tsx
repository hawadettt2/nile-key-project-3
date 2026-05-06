import type {Metadata} from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/language-provider';
import BodyWrapper from './body-wrapper';
import { ThemeProvider } from '@/context/theme-provider';


export const metadata: Metadata = {
  title: 'شركة مفتاح النيل للاستثمار والتجارة الدولية (ذ.م.م)',
  description: 'نظام إدارة الشحنات والمالية لشركة مفتاح النيل',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
      <ThemeProvider defaultTheme="dark" storageKey="nile-key-theme">
        <BodyWrapper>{children}</BodyWrapper>
      </ThemeProvider>
    </LanguageProvider>
  );
}
