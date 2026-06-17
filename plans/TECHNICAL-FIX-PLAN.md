# خطة عمل فنية شاملة - إصلاح النقاط الضعيفة

## مشكلات الضعف الحرجة وحلولها

### 1. مشكلة: API نظام الطلبات غير مكتمل
**الموقع:** `src/app/api/role-requests/route.ts:34-47`
**المشكلة:** الـ POST موجود للمراجعة فقط، لا يوجد endpoint لإنشاء الطلب
**الحل:** إنشاء route منفصل `/api/role-requests/create` أو دمج الوظيفتين

### 2. مشكلة: فقدان الـ trigger التلقائي للـ Auth
**الموقع:** `schema.sql:760-785`
**المشكلة:** `handle_new_user()` مُنعش لكن لم يتم ربطه بـ `auth.users` trigger
**الحل:** إضافة:
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. مشكلة: حلقة التحويل اللانهائية
**الموقع:** `src/supabase/middleware.ts:65-68`
**المشكلة:** إذا كان `email_verified=false` يحول للـ `/login?verify=true` لكن `/login` مسموح به
**الحل:** استثناء `/login?verify=true` من التوجيه للـ login

### 4. مشكلة: عدم إرسال البريد الإلكتروني الحقيقي
**الموقع:** `src/app/api/auth/email-verify/route.ts:80-83`
**المشكلة:** لا يوجد إرسال بريد إلكتروني، الكود مُظهر فقط للـ dev
**الحل:** ربط خدمة SMTP أو Resend API

### 5. مشكلة: عدم التحقق من صلاحية المراجع
**الموقع:** `src/app/api/role-requests/route.ts:34-47`
**المشكلة:** أي شخص يستطيع الموافقة لطلب
**الحل:** التحقق من دور المُرسل قبل الموافقة

### 6. مشكلة: نقص حقول التحقق في schema
**الموقع:** `schema.sql:85-116`
**المشكلة:** `verification_code_expires_at` موجود لكن `record_id` في audit_logs نوعه TEXT وليس UUID
**الحل:** توحيد الأنواع

## خطوات التنفيذ الفورية

1. إصلاح middleware (حلقة التحويل)
2. إنشاء endpoint لإنشاء طلبات الأدوار
3. إضافة التحقق من الأدوار في API
4. تنفيذ trigger auth.users
5. تنفيذ audit-triggers migration

## حالة الاستخدام الإنتاجي

**النظام غير جاهز للإنتاج حتى بعد التصحيح.** النقاط المطلوبة:
- [ ] مراجعة شاملة للـ RLS policies
- [ ] اختبار الأمان (IDOR, Privilege Escalation)
- [ ] توثيق API endpoints
- [ ] اختبار واقعي للبريد الإلكتروني