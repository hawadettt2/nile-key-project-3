'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, LoaderIcon } from 'lucide-react';
import { useLanguage } from '@/context/language-provider';
import { useToast } from '@/hooks/use-toast';
import { createSupplierRating, getSupplierRatings } from '@/lib/export-services';
import type { Supplier, SupplierRating } from '@/lib/supabase-types';

const copy = {
  ar: {
    title: 'تقييم الموردين',
    description: 'نظام موثوق لتقييم أداء الموردين والشركاء',
    qualityLabel: 'جودة المنتج',
    deliveryLabel: 'الالتزام بالتسليم',
    communicationLabel: 'الاتصالات',
    reliabilityLabel: 'الموثوقية',
    commentsLabel: 'ملاحظات إضافية',
    rateButton: 'إرسال التقييم',
    viewRatings: 'عرض التقييمات',
    loading: 'جاري التحميل...',
    noRatings: 'لا توجد تقييمات حتى الآن',
    success: 'تم حفظ التقييم بنجاح',
    average: 'متوسط التقييم',
    excellent: 'ممتاز',
    good: 'جيد',
    fair: 'مقبول',
  },
  en: {
    title: 'Supplier Ratings',
    description: 'Reliable system to evaluate supplier performance',
    qualityLabel: 'Product Quality',
    deliveryLabel: 'Delivery Commitment',
    communicationLabel: 'Communication',
    reliabilityLabel: 'Reliability',
    commentsLabel: 'Additional Comments',
    rateButton: 'Submit Rating',
    viewRatings: 'View Ratings',
    loading: 'Loading...',
    noRatings: 'No ratings yet',
    success: 'Rating saved successfully',
    average: 'Average Rating',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
  },
};

interface RatingFormProps {
  supplier: Supplier;
  onSuccess: () => void;
}

function RatingForm({ supplier, onSuccess }: RatingFormProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState({
    quality: '3',
    delivery: '3',
    communication: '3',
    reliability: '3',
  });
  const [comments, setComments] = useState('');
  const t = copy[language as 'ar' | 'en'];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await createSupplierRating({
        supplier_id: supplier.id,
        quality_score: parseInt(scores.quality),
        delivery_score: parseInt(scores.delivery),
        communication_score: parseInt(scores.communication),
        reliability_score: parseInt(scores.reliability),
        comments: comments || undefined,
      });

      toast({ title: t.success });
      setScores({ quality: '3', delivery: '3', communication: '3', reliability: '3' });
      setComments('');
      onSuccess();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{supplier.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {(['quality', 'delivery', 'communication', 'reliability'] as const).map((key) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{t[`${key}Label` as keyof typeof t]}</Label>
              <Select value={scores[key]} onValueChange={(value) => setScores({ ...scores, [key]: value })}>
                <SelectTrigger id={key}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={String(num)}>
                      <div className="flex items-center gap-1">
                        {num}
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="comments">{t.commentsLabel}</Label>
          <Input
            id="comments"
            placeholder={t.commentsLabel}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? <LoaderIcon className="h-4 w-4 mr-2 animate-spin" /> : <Star className="h-4 w-4 mr-2" />}
          {t.rateButton}
        </Button>
      </CardContent>
    </Card>
  );
}

function RatingsDisplay({ ratings }: { ratings: any }) {
  const { language } = useLanguage();
  const t = copy[language as 'ar' | 'en'];

  if (!ratings || !ratings.stats) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="pt-6 text-center text-muted-foreground">{t.noRatings}</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">{t.average}</p>
            <p className="text-3xl font-bold">{ratings.stats.averageRating}</p>
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(parseFloat(ratings.stats.averageRating))
                      ? 'fill-yellow-500 text-yellow-500'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Badge className="bg-emerald-500">{t.excellent}</Badge>
          <p className="text-2xl font-bold mt-2">{ratings.stats.excellentCount}</p>
          <p className="text-sm text-muted-foreground">تقييمات</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Badge className="bg-blue-500">{t.good}</Badge>
          <p className="text-2xl font-bold mt-2">{ratings.stats.goodCount}</p>
          <p className="text-sm text-muted-foreground">تقييمات</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Badge className="bg-orange-500">{t.fair}</Badge>
          <p className="text-2xl font-bold mt-2">{ratings.stats.fairCount}</p>
          <p className="text-sm text-muted-foreground">تقييمات</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function SupplierRatingsComponent({ supplier }: { supplier: Supplier }) {
  const [ratings, setRatings] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const loadRatings = async () => {
    try {
      const response = await getSupplierRatings({ supplierId: supplier.id });
      setRatings(response);
    } catch (error) {
      console.error('Failed to load ratings:', error);
    }
  };

  useEffect(() => {
    loadRatings();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{copy.ar.title}</h3>
        <Button onClick={() => setShowForm(!showForm)} variant="outline">
          {showForm ? 'إغلاق' : copy.ar.viewRatings}
        </Button>
      </div>

      {showForm && <RatingForm supplier={supplier} onSuccess={loadRatings} />}

      <RatingsDisplay ratings={ratings} />
    </div>
  );
}
