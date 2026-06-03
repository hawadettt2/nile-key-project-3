
'use client';

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, AlertTriangle, Truck } from "lucide-react";
import { useSupabase } from "@/supabase/provider";
import { supabase } from "@/supabase/client";
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useLanguage } from "@/context/language-provider";

export function ShipmentsDashboard() {
  const { language, t } = useLanguage();
  
  type Shipment = {
    id: string;
    created_at: string;
    shipment_type: string;
    customer: string;
    status: string;
    acid_number: string;
    tracking_number: string;
    price: number;
  };

  const { user, isLoading: isUserLoading } = useSupabase();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoadingShipments, setIsLoadingShipments] = useState(true);

  useEffect(() => {
    const fetchShipments = async () => {
      if (!user) {
        setShipments([]);
        setIsLoadingShipments(false);
        return;
      }
      setIsLoadingShipments(true);
      try {
        const { data, error } = await supabase
          .from('shipments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setShipments(data || []);
      } catch (error) {
        console.error('Error fetching shipments:', error);
      } finally {
        setIsLoadingShipments(false);
      }
    };
    fetchShipments();
  }, [user]);

  if (isUserLoading) {
      return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!user) {
      return (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold">{t.loginRequiredTitle}</h2>
              <p className="mt-2 text-muted-foreground">{t.loginRequiredDescription}</p>
              <Button asChild className="mt-4">
                <a href="/login">{t.sidebarLoginButton}</a>
              </Button>
            </div>
          </div>
      )
  }

  return (
      <div className="flex flex-col gap-6">
        <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Truck className="h-6 w-6"/> {t.shipmentsTitle}</CardTitle>
              <CardDescription>{t.shipmentsDescription}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {isLoadingShipments ? (
                <div className="flex h-full items-center justify-center text-muted-foreground"><Loader2 className="mx-2 h-4 w-4 animate-spin" /> {t.loadingShipments}</div>
              ) : shipments && shipments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.tableHeaderType}</TableHead>
                      <TableHead>{t.tableHeaderCustomer}</TableHead>
                      <TableHead>{t.tableHeaderDate}</TableHead>
                      <TableHead>{t.tableHeaderStatus}</TableHead>
                      <TableHead>{t.tableHeaderAcidNumber}</TableHead>
                      <TableHead>{t.tableHeaderTracking}</TableHead>
                      <TableHead className="text-left">{t.tableHeaderPrice}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-medium">{shipment.shipment_type}</TableCell>
                        <TableCell>{shipment.customer}</TableCell>
                        <TableCell>{shipment.created_at ? format(new Date(shipment.created_at), "PPP", { locale: language === 'ar' ? ar : enUS }) : 'N/A'}</TableCell>
                        <TableCell><Badge variant={shipment.status === t.shipmentStatusOption5 ? 'default' : 'secondary'}>{shipment.status}</Badge></TableCell>
                        <TableCell>{shipment.acid_number}</TableCell>
                        <TableCell>{shipment.tracking_number}</TableCell>
                        <TableCell className="text-left">${shipment.price.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex h-full items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                      <Package className="h-12 w-12" />
                      <h3 className="font-semibold">{t.noShipmentsTitle}</h3>
                      <p className="max-w-xs text-sm">{t.noShipmentsDescription}</p>
                    </div>
                  </div>
              )}
            </CardContent>
          </Card>
      </div>
  );
}

    