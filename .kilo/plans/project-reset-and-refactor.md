# خطة إعادة هيكلة مشروع Nile-Key (Plan v1.0)

## الهدف
استعادة المشروع إلى حالته الجيدة قبل إضافة سكريبت الذكاء الاصطناعي (trade-intelligence)، وحذف الملفات غير المستخدمة، وتصحيح نقاط الضعف.

---

## المرحلان التنفيذيتين

### المرحلة 1: حذف سكريبت الذكاء الاصطناعي والملفات المرتبطة به
- `src/ai/route.ts` - Endpoint مركب بالذكاء الاصطناعي
- `src/ai/huggingface-client.ts` - عميل HuggingFace
- `src/ai/hooks/use-ai-chat.ts`
- `src/ai/hooks/use-ai-completion.ts`
- `src/app/important-sites/[categoryId]/page.tsx` (إذا كان متصل بالذكاء الاصطناعي)
- أي استيراد أو واجهة مرتبطة بـ `trade-intelligence`

### المرحلة 2: حذف الملفات الفارغة أو غير المستخدمة
- `src/lib/placeholder-images.ts` - بيانات ثابتة غير مستخدمة
- `src/lib/nfsa-data.ts` - غير مستورد
- `src/lib/governorates.ts` - غير مستورد
- `src/lib/countries.ts` - غير مستورد
- `src/app/exporters-guide/page.tsx` - دليل ثابت غير متصل
- `src/app/services/page.tsx` - لا رابط له في التنقل

---

## الخطوات التنفيذية

### 1. حذف ملفات الذكاء الاصطناعي
```bash
rm -f src/ai/route.ts
rm -f src/ai/huggingface-client.ts
rm -rf src/ai/hooks
rm -f src/app/important-sites/[categoryId]/page.tsx  # إذا كان خاص بالذكاء الاصطناعي
```

### 2. حذف الملفات الفارغة
```bash
rm -f src/lib/placeholder-images.ts
rm -f src/lib/nfsa-data.ts
rm -f src/lib/governorates.ts
rm -f src/lib/countries.ts
rm -f src/app/exporters-guide/page.tsx
rm -f src/app/services/page.tsx
```

### 3. تعديل schema.sql - تحسين الأمان والبناء
- إزالة الـ trigger `on_auth_user_created` غير المدعوم (يُفسّر مشاكل الـ role)
- إبقاء الـ enum `user_role` بدون 'user' (حيث تم حذف الاستخدام)

### 4. تصحيح نقطة الضعف: مزامنة الـ role
- الـ `/api/fix-role` endpoint يحتاج إلى تشغيل مرة واحدة لتحويل الـ role إلى `owner`
- SQL بديل:
  ```sql
  -- تحديث الـ profile
  UPDATE public.profiles 
  SET role = 'owner'::public.user_role, status = 'active', email_verified = true 
  WHERE email IN ('hawadettt@gmail.com', 'hawadettt2@gmail.com');
  
  -- تحديث الـ user_metadata
  UPDATE auth.users 
  SET metadata = jsonb_set(coalesce(metadata, '{}'), '{role}', '"owner"')
  WHERE email IN ('hawadettt@gmail.com', 'hawadettt2@gmail.com');
  ```

### 5. اختبار النظام بعد التنظيف
- `npm run build` - التأكد من عدم وجود أخطاء بناء
- `npm run lint` - فحص جودة الكود
- تسجيل الدخول بالبريدين `hawkdettt@gmail.com` و `hawkdettt2@gmail.com`
- الوصول إلى `/dashboard/admin` يجب أن ينجح الآن

---

## الملفات ذات الصلة (مقترح الحفاظ عليها)

### صفحات مهمة (لا تحذف)
- `src/app/login/page.tsx` - الدخول
- `src/app/register/page.tsx` - التسجيل  
- `src/app/dashboard/page.tsx` - لوحة التحكم
- `src/app/customers/page.tsx` - الزبائن
- `src/app/suppliers/page.tsx` - الموردين
- `src/app/shipments/page.tsx` - الشحنات
- `src/app/important-sites/page.tsx` - المواقع الهامة (سيُعاد برمجتها يدويًا)
- `src/app/settings/page.tsx` - الإعدادات

### مكوّنات أساسية
- `src/components/ui/*` - مكوّنات الواجهة (تُستخدم على مدار المشروع)
- `src/context/*` - إعدادات اللغة والثيم
- `src/hooks/*` - hooks عامة
- `src/lib/access-control.ts` - منطق RBAC
- `src/lib/rbac-validation.ts` - تحقق الأدوار
- `src/supabase/*` - إعدادات Supabase

---

## الجدول الزمني المحتمل

| المهمة | الوقت المتوقع |
|--------|---------------|
| حذف ملفات الذكاء الاصطناعي | 5 دقائق |
| حذف الملفات الفارغة | 5 دقائق |
| تعديل schema.sql | 10 دقائق |
| تنفيذ SQL التحديث | 2 دقيقة |
| اختبار البناء والتطبيق | 10 دقائق |

**المجموع: ~30 دقيقة**

---

## ملاحظات قبل التنفيذ
1. تأكد من أخذ نسخة احتياطية من الـ schema الحالي
2. توثيق أي تغييرات في README
3. الاحتفاظ بملف `/api/fix-role` حتى تتم مراجعة المشكلة الأساسية