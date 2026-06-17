'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function ServicesPage() {
  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">الخدمات</h1>
        <p className="text-muted-foreground">خدمات منصة مفتاح النيل</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <Briefcase className="mb-2 h-8 w-8" />
            <CardTitle>الشحنات</CardTitle>
            <CardDescription>إدارة ومتابعة الشحنات الخارجية</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/shipments">
              <Button className="w-full">عرض الشحنات</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Briefcase className="mb-2 h-8 w-8" />
            <CardTitle>العملاء</CardTitle>
            <CardDescription>إدارة قاعدة العملاء</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/customers">
              <Button className="w-full">عرض العملاء</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Briefcase className="mb-2 h-8 w-8" />
            <CardTitle>الموردين</CardTitle>
            <CardDescription>إدارة قاعدة الموردين</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/suppliers">
              <Button className="w-full">عرض الموردين</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}