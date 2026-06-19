'use client';

import Link from 'next/link';
import AppLayout from '@/app/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/language-provider';
import { ShipWheel, Plane, Truck, FileCheck, Warehouse, ShieldCheck, ArrowRight } from 'lucide-react';

const services = [
  {
    key: 'sea',
    icon: ShipWheel,
    titleKey: 'serviceSeaFreightTitle',
    descriptionKey: 'serviceSeaFreightDesc',
    href: '/shipments',
  },
  {
    key: 'air',
    icon: Plane,
    titleKey: 'serviceAirFreightTitle',
    descriptionKey: 'serviceAirFreightDesc',
    href: '/shipments',
  },
  {
    key: 'land',
    icon: Truck,
    titleKey: 'serviceLandFreightTitle',
    descriptionKey: 'serviceLandFreightDesc',
    href: '/shipments',
  },
  {
    key: 'customs',
    icon: FileCheck,
    titleKey: 'serviceCustomsTitle',
    descriptionKey: 'serviceCustomsDesc',
    href: '/sites',
  },
  {
    key: 'storage',
    icon: Warehouse,
    titleKey: 'serviceStorageTitle',
    descriptionKey: 'serviceStorageDesc',
    href: '/suppliers',
  },
  {
    key: 'docs',
    icon: ShieldCheck,
    titleKey: 'serviceDocsTitle',
    descriptionKey: 'serviceDocsDesc',
    href: '/customers',
  },
];

export default function ServicesPage() {
  const { t } = useLanguage();

  return (
    <AppLayout>
      <div className="space-y-6">
        <section className="rounded-lg bg-muted/40 p-6 md:p-8">
          <p className="text-sm font-medium text-primary">{t.sidebarServices}</p>
          <h1 className="mt-3 font-headline text-3xl font-bold md:text-4xl">{t.servicesTitle}</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">{t.servicesDescription}</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Card key={service.key} className="flex flex-col">
                <CardHeader>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{t[service.titleKey]}</CardTitle>
                  <CardDescription className="mt-2">{t[service.descriptionKey]}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={service.href}>
                      {t.sidebarServices}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </AppLayout>
  );
}
