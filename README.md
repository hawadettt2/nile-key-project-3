# شركة مفتاح النيل للاستثمار والتجارة الدولية (ذ.م.م)
## Nile Key for Investment and International Trade LLC

نظام إدارة متكامل ومؤمن مصمم خصيصاً لتمويل الصادرات الزراعية المصرية في الأسواق العالمية. يركز التطبيق على الإدارة التشغيلية اليومية للشحنات، الموردين، والعملاء مع نظام صلاحيات متطور.

### 👤 الإدارة والملكية (Ownership)
*   **المالك والمدير العام:** أسامة حسني (Osama Hosny)
*   **البريد الإلكتروني التقني:** hawadettt@gmail.com

---

### 📦 **الإصدارات الأخيرة (Latest Updates)**

#### ✅ **الخطوات المنجزة في إعادة الهيكلة:**
1. **حذف ملفات الذكاء الاصطناعي غير المستخدمة**  
   - تم التأكد من عدم وجود أي إشارات残留 في الكودbase.

2. **تحسين قاعدة البيانات (schema.sql):**  
   - تم تحديث وظيفة `handle_new_user` لتعيين دور `owner` تلقائياً للبريدين:  
     `hawadettt@gmail.com` و `hawadettt2@gmail.com`.  
   - تم التأكد من عدم وجود Trigger غير مسموح.

3. **تحديث نظام الترجمات (i18n) وتحسينه:**  
   - إضافة المفاتيح الناقصة مثل `formCustomerRequired`.  
   - استبدال الرموز غير الصالحة (مثل •) بمفاتيح نصية صالحة.  
   - دعم كامل للغتين: العربية (`ar`) والإنجليزية (`en`).

4. **إصلاح أخطاء الـ API:**  
   - تم تعديل ملف `src/app/api/fix-role/route.ts` لاستخدام  
     `supabase.auth.admin.updateUserById()` بدلاً من  
     `updateUserByEmail` (للتوافق مع مكتبة Supabase).

5. **إصلاح أخطاء البناء (Build Process):**  
   - تم تأمين جميع المفاتيح في ملفات الترجمة لتجنب الأخطاء من النوع `Property '...' does not exist`.  
   - نجح بناء المشروع أخيراً:  
     ```bash
     npm run build
     ```

---

### 🚀 المميزات الرئيسية (Key Features)

*   **📦 إدارة الشحنات واللوجستيات:** تتبع شامل للشحنات (بحري، جوي، بري) مع إدارة أرقام الـ ACID ومستندات الشحن بشكل مؤمن.
*   **🚜 قاعدة بيانات الموردين:** إدارة بيانات محطات التعبئة العاملة في مصر مع إمكانية التصفية والبحث.
*   **🤝 إدارة العملاء الدوليين:** تنظيم بيانات المستوردين، الأكواد الجمركية المفضلة، ونظام طلبات عروض الأسعار (RFQ).
*   **🌐 مركز المواقع الهامة:** نظام ديناميكي لإدارة روابط الهيئات السيادية واللوجستية مع إمكانية التخصيص.
*   **🔒 نظام صلاحيات متطور (RBAC):** هيكلة احترافية تبدأ من "صاحب الشركة" وصولاً إلى المدير، الموظف، والعميل.

---

### 🛠 التقنيات المستخدمة (Tech Stack)

*   **Framework:** Next.js 15 (App Router)
*   **Backend:** Supabase (PostgreSQL, Authentication, Realtime, RLS Policies)
*   **Authentication:** Supabase Auth + email OTP Verification
*   **UI/UX:** Tailwind CSS + ShadCN UI (Nile Blue Theme)
*   **Language:** دعم كامل للغة العربية والإنجليزية (RTL/LTR)
*   **Validation:** Zod for Schema Validation (IDOR Prevention)
*   **Deployment:** Vercel

---

### 🔒 نظام الصلاحيات (RBAC System)

النظام يدعم 6 أدوار مختلفة:
1. **Owner (المالك):** صلاحيات كاملة لإدارة النظام
2. **Admin (المدير):** إدارة المستخدمين واللوحات
3. **Employee (الموظف):** إدارة العمليات اليومية
4. **Importer (المستورد):** عرض التقارير والبيانات
5. **Supplier (المورد):** إدارة البيانات الخاصة
6. **Agent (الوكيل):** صلاحيات محدودة

### 📄 الترخيص (License)
هذا المشروع خاص بشركة مفتاح النيل - أسامة حسني. مرخص تحت رخصة MIT.
جميع الحقوق محفوظة © 2025.

---

### 🚀 Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hawadettt2/nile-key-project-3.git
   cd nile-key-project-3
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create or edit `.env.local` in the project root, then paste the values:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Database Setup:**
   Run migrations in this exact order in Supabase SQL Editor:
   ```sql
   schema.sql
   src/migrations/rbac-hardening.sql
   migrations/01-audit-triggers.sql
   ```

   Or generate a combined reviewed bundle:
   ```powershell
   npm run supabase:migrations:bundle
   ```

   Review the generated `dist/supabase-combined-migrations.sql`, then run it in Supabase SQL Editor.

5. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:9002](http://localhost:9002)

---

### 🔒 Security Features
- ✅ Row Level Security (RLS) Policies
- ✅ Zod Schema Validation (IDOR Prevention)
- ✅ email OTP Verification
- ✅ Route Guards (Middleware)
- ✅ Audit Logs (Read-Only)
- ✅ Supabase Auth Integration

---

### 📦 Deployment to Vercel
1. Validate environment and security hygiene:
   ```powershell
   npm run validate:env
   npm run security:check
   ```

2. Commit and push:
   ```powershell
   git add .
   git commit -m "chore: harden RBAC, audit logging, and deployment docs"
   git push origin main
   ```

3. Apply Supabase migrations in order, or use the combined reviewed bundle:
   ```powershell
   npm run supabase:migrations:bundle
   ```

   Review `dist/supabase-combined-migrations.sql`, then run it in Supabase SQL Editor.

4. Configure Vercel environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` = Supabase service role key
   - `RESEND_API_KEY`, `RESEND_AUDIENCE`, `EMAIL_FROM` for email verification
   - `NEXT_PUBLIC_SITE_URL` = production domain

5. Deploy:
   ```powershell
   npx.cmd vercel pull
   npx.cmd vercel build
   npx.cmd vercel deploy --prod
   ```

6. Post-deploy integrity checks:
   - Login/register works
   - New profile is created
   - Email verification request and confirmation work
   - Role request creation/review works
   - Non-admin cannot access admin routes
   - Suspended/rejected users are blocked
   - Audit logs are created and immutable
   - No service role key appears in browser bundles or network requests
