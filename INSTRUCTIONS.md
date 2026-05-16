# وثيقة الذاكرة السياقية لـ Nile-Key3

## سياق المشروع
- نحن نبني منصة تصدير حاصلات زراعية مصرية بنظام FOB.
- تم التخلي تماماً عن Firebase ومنتجات جوجل.

## التكديس البرمجي الصارم (Tech Stack)
- Next.js 15 (App Router)
- Supabase (PostgreSQL / Auth / RLS)
- Tailwind CSS

## قواعد برمجية لا يمكن تجاوزها
1. ممنوع استخدام Firebase نهائياً.
2. الاعتماد على المكونات السحابية (Server Components) كخيار افتراضي.
3. التحقق من صحة جداول Supabase عبر ملف `schema.sql` قبل تعديل أي كود.
