# شركة مفتاح النيل للاستثمار والتجارة الدولية (ذ.م.م)
## Nile Key for Investment and International Trade LLC

نظام إدارة متكامل ومؤمن مصمم خصيصاً لتمويل الصادرات الزراعية المصرية في الأسواق العالمية. يجمع التطبيق بين الإدارة التشغيلية اليومية والتحليلات الاستراتيجية الذكية المدعومة بالذكاء الاصطناعي.

### 👤 الإدارة والملكية (Ownership)
*   **المالك والمدير العام:** أسامة حسني (Osama Hosny)
*   **البريد الإلكتروني التقني:** hawadettt@gmail.com

---

### 🚀 المميزات الرئيسية (Key Features)

*   **📦 إدارة الشحنات واللوجستيات:** تتبع شامل للشحنات (بحري، جوي، بري) مع إدارة أرقام الـ ACID ومستندات الشحن بشكل مؤمن.
*   **🚜 قاعدة بيانات الموردين الذكية:** 
    *   الوصول إلى قاعدة بيانات محطات التعبئة العاملة في مصر.
    *   التكامل مع **القائمة البيضاء للهيئة القومية لسلامة الغذاء (NFSA)**.
*   **🤝 إدارة العملاء الدوليين:** تنظيم بيانات المستوردين، الأكواد الجمركية المفضلة، ونظام ذكي لطلبات عروض الأسعار (RFQ).
*   **🧠 مختبر التحليلات التنبؤية (AI Lab):**
    *   **مستشار الحصاد:** التنبؤ بمواعيد الحصاد بناءً على المحاصيل والموقع الجغرافي.
    *   **مكتشف الفرص:** تحليل فجوات العرض والطلب العالمية لتحديد أفضل أسواق التصدير.
    *   **المترجم الدبلوماسي:** صياغة المراسلات التجارية بلغة احترافية.
*   **🌐 مركز المواقع الهامة:** نظام ديناميكي لإدارة روابط الهيئات السيادية واللوجستية واللوجستية مع إمكانية التخصيص.
*   **🔒 نظام صلاحيات متطور (RBAC):** هيكلة احترافية تبدأ من "صاحب الشركة" وصولاً إلى المدير، الموظف، والعميل.

---

### 🛠 التقنيات المستخدمة (Tech Stack)

*   **Framework:** Next.js 15 (App Router)
*   **Backend:** Supabase (PostgreSQL, Authentication, Realtime, RLS Policies)
*   **AI Engine:** Hugging Face Inference API (Llama 3.2, Mistral, etc.)
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
   Create `.env.local` in the project root:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Hugging Face API
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   ```

4. **Database Setup:**
   - Go to your Supabase Dashboard
   - Open SQL Editor
   - Copy contents of `schema.sql`
   - Click "Run"

5. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

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
1. Connect your GitHub repository to Vercel
2. Add Environment Variables in Vercel project settings
3. Deploy!

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Deploy
vercel --prod
```


## Trade Knowledge Hub
The Important Sites section now includes a local 190-source trade knowledge base with AI-assisted ranking and optional Hugging Face summarization.
