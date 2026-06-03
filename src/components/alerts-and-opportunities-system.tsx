'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Trash2, CheckCircle2, AlertCircle, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { useLanguage } from '@/context/language-provider';
import { useSupabase } from '@/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import { getUserAlerts, markAlertAsRead, dismissAlert } from '@/lib/export-services';
import type { ExportAlert } from '@/lib/supabase-types';

const copy = {
  ar: {
    title: 'نظام التنبيهات والفرص',
    description: 'متابعة فرص التصدير والتنبيهات المهمة',
    unread: 'غير مقروءة',
    allAlerts: 'جميع التنبيهات',
    opportunities: 'فرص تصديرية',
    marketChanges: 'تغييرات سوقية',
    regulatory: 'تغييرات قانونية',
    shipments: 'شحنات',
    suppliers: 'موردون',
    custom: 'مخصصة',
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية',
    critical: 'حرجة',
    markAsRead: 'وضع علامة كمقروء',
    dismiss: 'تجاهل',
    noAlerts: 'لا توجد تنبيهات',
    priority: 'الأولوية',
    filterBy: 'تصفية حسب',
    type: 'النوع',
    success: 'تم التحديث',
  },
  en: {
    title: 'Alerts & Opportunities System',
    description: 'Track export opportunities and important notifications',
    unread: 'Unread',
    allAlerts: 'All Alerts',
    opportunities: 'Export Opportunities',
    marketChanges: 'Market Changes',
    regulatory: 'Regulatory Changes',
    shipments: 'Shipments',
    suppliers: 'Suppliers',
    custom: 'Custom',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
    markAsRead: 'Mark as Read',
    dismiss: 'Dismiss',
    noAlerts: 'No alerts',
    priority: 'Priority',
    filterBy: 'Filter By',
    type: 'Type',
    success: 'Updated',
  },
};

function AlertCard({ alert, onAction }: { alert: ExportAlert; onAction: () => void }) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const t = copy[language as 'ar' | 'en'];

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500',
    };
    return colors[priority] || 'bg-gray-500';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      opportunity: <TrendingUp className="h-5 w-5" />,
      market_change: <TrendingUp className="h-5 w-5" />,
      regulatory: <AlertCircle className="h-5 w-5" />,
      shipment: <DollarSign className="h-5 w-5" />,
      supplier: <CheckCircle2 className="h-5 w-5" />,
    };
    return icons[type] || <Bell className="h-5 w-5" />;
  };

  const handleMarkAsRead = async () => {
    setLoading(true);
    try {
      await markAlertAsRead(alert.id);
      toast({ title: t.success });
      onAction();
    } catch (error) {
      console.error('Error marking alert as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    setLoading(true);
    try {
      await dismissAlert(alert.id);
      toast({ title: t.success });
      onAction();
    } catch (error) {
      console.error('Error dismissing alert:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`${!alert.is_read ? 'border-primary bg-primary/5' : ''}`}>
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <div className="text-primary mt-1">{getTypeIcon(alert.alert_type)}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold">{language === 'ar' ? alert.title_ar : alert.title_en}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'ar' ? alert.description_ar : alert.description_en}
                </p>
              </div>
              <Badge className={getPriorityColor(alert.priority || 'medium')}>
                {t[alert.priority as keyof typeof t] || alert.priority}
              </Badge>
            </div>

            <div className="flex gap-2 mt-4">
              {!alert.is_read && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkAsRead}
                  disabled={loading}
                  className="text-xs"
                >
                  {t.markAsRead}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                disabled={loading}
                className="text-xs text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {t.dismiss}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AlertsAndOpportunitiesSystem() {
  const { language } = useLanguage();
  const { user } = useSupabase();
  const [alerts, setAlerts] = useState<ExportAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const t = copy[language as 'ar' | 'en'];

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const response = await getUserAlerts({
        alertType: filterType || undefined,
        isRead: showUnreadOnly ? false : undefined,
      });
      setAlerts(response.data || []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAlerts();
    }
  }, [user, filterType, showUnreadOnly]);

  const unreadCount = alerts.filter((a) => !a.is_read).length;
  const opportunitiesCount = alerts.filter((a) => a.alert_type === 'opportunity').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t.unread}</p>
              <p className="text-3xl font-bold text-primary">{unreadCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t.opportunities}</p>
              <p className="text-3xl font-bold text-emerald-600">{opportunitiesCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">إجمالي</p>
              <p className="text-3xl font-bold">{alerts.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="w-48">
          <Label htmlFor="type">{t.type}</Label>
          <Select value={filterType || ''} onValueChange={(v) => setFilterType(v || null)}>
            <SelectTrigger id="type">
              <SelectValue placeholder={t.allAlerts} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t.allAlerts}</SelectItem>
              <SelectItem value="opportunity">{t.opportunities}</SelectItem>
              <SelectItem value="market_change">{t.marketChanges}</SelectItem>
              <SelectItem value="regulatory">{t.regulatory}</SelectItem>
              <SelectItem value="shipment">{t.shipments}</SelectItem>
              <SelectItem value="supplier">{t.suppliers}</SelectItem>
              <SelectItem value="custom">{t.custom}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button
            variant={showUnreadOnly ? 'default' : 'outline'}
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          >
            {t.unread}
          </Button>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : alerts.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="pt-6 flex items-center justify-center h-32 flex-col gap-2">
            <Bell className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">{t.noAlerts}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onAction={loadAlerts} />
          ))}
        </div>
      )}
    </div>
  );
}
