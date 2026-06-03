'use client';

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useLanguage } from "@/context/language-provider";

export function Header() {
  const { t } = useLanguage();
  
  return (
    <header 
        className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6"
        style={{
            '--neon-glow-color-primary': 'hsl(var(--primary))',
        } as React.CSSProperties}
    >
        <div className="flex items-center gap-4">
            <SidebarTrigger />
        </div>

        <div className="flex-1 text-center">
            <h1 
                className="font-body font-bold text-foreground whitespace-nowrap text-xl"
            >
                شركة مفتاح النيل للاستثمار والتجارة الدولية (ذ.م.م)
            </h1>
            <p 
                className="font-headline font-semibold tracking-wider text-primary drop-shadow-[0_0_8px_var(--neon-glow-color-primary)] text-sm"
            >
                Nile Key for Investment and International Trade LLC
            </p>
        </div>

        <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Upload className="h-5 w-5" />
              <span className="sr-only">Upload</span>
            </Button>
        </div>
    </header>
  );
}
