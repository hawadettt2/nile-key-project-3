'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/language-provider";
import { Ship, Plane, Truck, FileBadge2, Warehouse, ShieldCheck } from "lucide-react";

export function ServicesPage() {
  const { t } = useLanguage();

  const services = [
    {
      title: t.serviceSeaFreightTitle,
      description: t.serviceSeaFreightDesc,
      icon: <Ship className="h-5 w-5 text-primary" />
    },
    {
      title: t.serviceAirFreightTitle,
      description: t.serviceAirFreightDesc,
      icon: <Plane className="h-5 w-5 text-primary" />
    },
    {
      title: t.serviceLandFreightTitle,
      description: t.serviceLandFreightDesc,
      icon: <Truck className="h-5 w-5 text-primary" />
    },
    {
      title: t.serviceCustomsTitle,
      description: t.serviceCustomsDesc,
      icon: <FileBadge2 className="h-5 w-5 text-primary" />
    },
    {
      title: t.serviceStorageTitle,
      description: t.serviceStorageDesc,
      icon: <Warehouse className="h-5 w-5 text-primary" />
    },
    {
      title: t.serviceDocsTitle,
      description: t.serviceDocsDesc,
      icon: <ShieldCheck className="h-5 w-5 text-primary" />
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">{t.servicesTitle}</CardTitle>
          <CardDescription className="text-base">{t.servicesDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {services.map((service, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-lg">
                  <div className="flex items-center gap-3">
                    {service.icon}
                    <span>{service.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 text-base text-muted-foreground">
                  {service.description}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
