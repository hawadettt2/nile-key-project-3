'use client';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/language-provider";
import { Book, Star, Landmark, FileText, CheckCircle, Ship, ExternalLink, Banknote, AreaChart } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

function ExportersGuidePageContent() {
  const { t } = useLanguage();

  const guideSections = [
    {
      title: t.guideIntroTitle,
      content: t.guideIntroContent,
      icon: <Star className="h-5 w-5 text-primary" />,
      links: [],
    },
    {
      title: t.guideCodificationTitle,
      content: t.guideCodificationContent,
      icon: <Landmark className="h-5 w-5 text-primary" />,
      links: [
        { title: t.siteCapqTitle, url: 'https://www.capq.gov.eg' },
        { title: t.siteAecGovTitle, url: 'https://www.aecegypt.com' },
      ],
    },
    {
      title: t.guideDocumentsTitle,
      content: t.guideDocumentsContent,
      icon: <FileText className="h-5 w-5 text-primary" />,
      links: [
        { title: t.siteCapqTitle, url: 'https://www.capq.gov.eg' },
        { title: t.siteGoeicTitle, url: 'https://www.goeic.gov.eg' },
      ],
    },
    {
      title: t.guideNafezaTitle,
      content: t.guideNafezaContent,
      icon: <CheckCircle className="h-5 w-5 text-primary" />,
      links: [
        { title: t.siteNafezaTitle, url: 'https://www.nafeza.gov.eg' },
        { title: t.siteCargoXTitle, url: 'https://cargox.help' },
      ],
    },
    {
      title: t.guideStandardsTitle,
      content: t.guideStandardsContent,
      icon: <Star className="h-5 w-5 text-primary" />,
       links: [
        { title: t.guideLinkGlobalGap, url: 'https://www.globalgap.org' },
        { title: t.guideLinkIso22000, url: 'https://www.iso.org/iso-22000-food-safety-management.html' },
        { title: t.guideLinkBrcgs, url: 'https://www.brcgs.com/' },
      ],
    },
    {
      title: t.guideLogisticsTitle,
      content: t.guideLogisticsContent,
      icon: <Ship className="h-5 w-5 text-primary" />,
      links: [
        { title: t.siteTradlinxTitle, url: 'https://blogs.tradlinx.com' },
        { title: t.siteSearatesTitle, url: 'https://www.searates.com' },
      ],
    },
    {
      title: t.guideFinanceTitle,
      content: t.guideFinanceContent,
      icon: <Banknote className="h-5 w-5 text-primary" />,
      links: [
        { title: t.guideFinanceLinkEBE, url: 'http://www.ebebank.com' },
      ],
    },
    {
      title: t.guideMarketAnalysisTitle,
      content: t.guideMarketAnalysisContent,
      icon: <AreaChart className="h-5 w-5 text-primary" />,
      links: [
        { title: t.guideMarketAnalysisLinkHS, url: 'https://www.trade-tariff.service.gov.uk/find_commodity' },
        { title: t.guideMarketAnalysisLinkTridge, url: 'https://www.tridge.com' },
      ],
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Book className="h-6 w-6" /> {t.exportersGuideTitle}
        </CardTitle>
        <CardDescription>{t.exportersGuideDescription}</CardDescription>
      </CardHeader>
      <CardContent>
         <Accordion type="single" collapsible className="w-full">
          {guideSections.map((section, index) => (
            <AccordionItem value={`item-${index}`} key={index}>
              <AccordionTrigger className="text-lg">
                <div className="flex items-center gap-3 text-start">
                  {section.icon}
                  <span>{section.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 text-base text-muted-foreground whitespace-pre-line">
                {section.content}
                 {section.links && section.links.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {section.links.map((link, linkIndex) => (
                      <Button asChild variant="outline" size="sm" key={linkIndex}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                          {link.title}
                          <ExternalLink className="ms-2 h-4 w-4" />
                        </a>
                      </Button>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}


export default function ExportersGuidePage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <ExportersGuidePageContent />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
