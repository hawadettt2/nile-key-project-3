# Supabase Auth Configuration

## تعطيل التسجيل المباشر (Disable Direct Registration)

هذا الملف يوثق الإعدادات المطلوبة في لوحة تحكم Supabase لتعطيل التسجيل المباشر وضمان أن جميع المستخدمين الجدد يمرون بنظام الموافقة.

## الخطوات المطلوبة في Supabase Dashboard:

### 1. تعطيل Sign Up المباشر
1. اذهب إلى **Authentication > Settings** في لوحة تحكم Supabase
2. قم بإلغاء تفعيل **"Enable email signups"** إذا كنت تريد منع التسجيل عبر الإيميل المباشر
3. أو بدلاً من ذلك، قم بتفعيل **"Enable manual confirmation"** لإجبار تأكيد الإيميل يدوياً

### 2. إعدادات إعادة التوجيه (Redirect URLs)
أضف الروابط التالية في **Authentication > URL Configuration**:
```
http://localhost:3000/login
http://localhost:3000/dashboard
https://your-production-domain.com/login
https://your-production-domain.com/dashboard
```

### 3. إعدادات OTP (للتحقق عبر email)
بما أننا نستخدم email للتحقق، تأكد من:
- تعطيل OTP عبر SMS في **Authentication > Settings > Phone Auth**
- نحن نستخدم نظام OTP مخصص عبر email API (انظر `src/app/api/auth/email-verify/route.ts`)

### 4. سياسات RLS (تم تطبيقها بالفعل في schema.sql)
تم تطبيق سياسات RLS التي تمنع المستخدمين غير المفعلين من الوصول:
```sql
-- المستخدمون بحالة pending_verification لا يمكنهم الوصول إلا لصفحة التحقق
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile for verification" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND (
    -- السماح بتحديث حقول التحقق فقط
    (OLD.status = 'pending_verification' AND NEW.status = 'pending_verification') OR
    (OLD.email_verified = NEW.email_verified) OR
    (OLD.verification_code = NEW.verification_code)
  ));
```

## ملاحظات هامة:
1. **نظام الموافقة**: جميع المستخدمين الجدد يتم إنشاؤهم بحالة `pending_verification` (انظر `schema.sql` السطر 445)
2. **التحقق**: يتم التحقق عبر email OTP قبل تفعيل الحساب
3. **المسؤولون**: يمكن للمسؤولين (Owner/Admin) الموافقة على الحسابات يدوياً عبر لوحة التحكم (`/dashboard/admin`)

## التحقق من الإعدادات:
للتحقق من أن التسجيل المباشر معطل، حاول تسجيل مستخدم جديد عبر Supabase Auth API:
```bash
curl -X POST 'https://your-project.supabase.co/auth/v1/signup' \
  -H 'Content-Type: application/json' \
  -d '{"email": "test@example.com", "password": "test123456"}'
```
يجب أن يرجع خطأ 400 أو 403 إذا كان التسجيل المباشر معطلاً.

## ملفات ذات صلة:
- `schema.sql` - إعدادات قاعدة البيانات ودالة `handle_new_user()`
- `src/app/api/auth/email-verify/route.ts` - نظام التحقق عبر email
- `src/app/login/page.tsx` - صفحة التسجيل الهجينة
- `src/app/dashboard/admin/page.tsx` - لوحة تحكم المسؤول للموافقة على المستخدمين
