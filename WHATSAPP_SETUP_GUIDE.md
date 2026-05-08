# دليل إعداد WhatsApp Business API للمشروع

## نظرة عامة
لجعل نظام إرسال رمز التحقق (OTP) عبر WhatsApp يعمل فعلياً، تحتاج إلى إعداد WhatsApp Business API من خلال Meta (Facebook).

## المتطلبات الأساسية
1. حساب Meta Business (Facebook Business Manager)
2. رقم هاتف تجاري نشط (لاستقبال رسائل WhatsApp)
3. تطبيق Meta للتطوير (Meta Developers Account)

## خطوات الحصول على بيانات الاعتماد

### الخطوة 1: إنشاء تطبيق على Meta Developers
1. اذهب إلى https://developers.facebook.com/
2. سجل الدخول بحسابك
3. اضغط على "My Apps" ثم "Create App"
4. اختر نوع التطبيق: "Business" 
5. أدخل اسم التطبيق: "Nile Key WhatsApp Service"
6. أضف البريد الإلكتروني للتواصل

### الخطوة 2: إضافة منتج WhatsApp
1. من لوحة التحكم، اضغط على "Add Product"
2. اختر "WhatsApp" واضغط "Set Up"
3. ستنتقل إلى صفحة إعداد WhatsApp

### الخطوة 3: الحصول على رمز الوصول (Access Token)
1. في صفحة WhatsApp > Getting Started
2. ستجد "Temporary access token" - هذا للاختبار
3. للإنتاج، اضغط على "Generate access token" 
4. اختر الصلاحيات المطلوبة:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. انسخ الرمز (Access Token) - ستحتاجه في `.env.local`

### الخطوة 4: الحصول على معرف رقم الهاتف (Phone Number ID)
1. في نفس الصفحة، ستجد "Phone numbers"
2. اضغط على "Add phone number"
3. أدخل رقم الهاتف التجاري الخاص بك
4. بعد التحقق، ستجد "Phone Number ID" في إعدادات الرقم
5. انسخ هذا المعرف - ستحتاجه في `.env.local`

### الخطوة 5: تكوين البيئة المحلية
أنشئ أو حدث ملف `.env.local` في جذر المشروع:

```env
# WhatsApp Business API Credentials
WHATSAPP_ACCESS_TOKEN=EAAG... (الرمز الذي حصلت عليه)
WHATSAPP_PHONE_NUMBER_ID=1234567890 (معرف رقم الهاتف)

# Supabase (موجود مسبقاً)
NEXT_PUBLIC_SUPABASE_URL=https://diabqtldzxtzrznemjzu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ECfJXC_1CCfVaHtWWmvZRA_wXWXLnOh

# Hugging Face (موجود مسبقاً)
HUGGING_FACE_API_KEY=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
```

## اختبار النظام

### وضع التطوير (Development Mode):
- عندما لا تكون بيانات WhatsApp معرفة، سيتم عرض الرمز في سجلات الخادم (Console)
- يمكنك رؤية الرمز في Terminal عند تشغيل `npm run dev`

### وضع الإنتاج (Production Mode):
- سيتم إرسال الرمز فعلياً عبر WhatsApp إلى رقم الهاتف
- تأكد من أن الرقم مفعل ومتصل بـ WhatsApp Business API

## ملاحظات هامة
1. **الرمز المؤقت**: يصح للاختبار فقط ويستمر 24 ساعة
2. **الرمز الدائم**: للإنتاج، تحتاج إلى إنشاء نظام أذونات (System User Token)
3. **حدود الإرسال**: في البداية، قد تكون هناك حدود على عدد الرسائل (Rate Limits)
4. **التحقق من الرقم**: تأكد من أن رقم الهاتف مفعل على WhatsApp Business

## روابط مفيدة
- توثيق WhatsApp Business API: https://developers.facebook.com/docs/whatsapp
- دليل البدء السريع: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
- إدارة الرموز: https://developers.facebook.com/docs/whatsapp/business-management-api/get-started

## استكشاف الأخطاء
إذا لم يتم إرسال الرسائل:
1. تأكد من صحة `WHATSAPP_ACCESS_TOKEN`
2. تأكد من صحة `WHATSAPP_PHONE_NUMBER_ID`
3. تحقق من أن الرقم مفعل في WhatsApp Business
4. راجع سجلات الخادم (Console) للأخطاء
5. تأكد من أن الرمز لم ينتهِ صلاحيته

## الخطوات التالية
بعد إعداد WhatsApp API:
1. قم بتشغيل المشروع: `npm run dev`
2. سجل حساب جديد أو سجل الدخول
3. أدخل رقم الهاتف مع رمز الدولة (مثل: +201234567890)
4. اضغط "Send Verification Code"
5. تحقق من وصول الرمز عبر WhatsApp (أو في Console في وضع التطوير)
