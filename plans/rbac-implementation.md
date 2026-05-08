# خطة تنفيذ نظام المصادقة والصلاحيات المتقدم (RBAC + RLS + OTP)

## نظرة عامة
هذه الخطة تفصيلية لتحويل نظام المصادقة في Nile-Key3 إلى نظام مؤسسي متقدم يدعم:
- أدوار متعددة (Owner, Admin, Employee, Importer, Supplier, Agent)
- صلاحيات دقيقة (JSONB permissions)
- تحديث جدول profiles ليشمل كافة الحقول الجديدة
- سجلات تدقيق غير قابلة للتغيير (audit_logs)
- سياسات RLS متقدمة تعتمد على الأدوار
- نظام OTP عبر WhatsApp

---

## المهمة 1: تحديث schema.sql (الجزء الأول - الأنواع والجداول الأساسية)

### 1.1 إضافة ENUM للأدوار
```sql
CREATE TYPE IF NOT EXISTS public.user_role AS ENUM (
  'owner',       -- المالك (كامل الصلاحيات)
  'admin',       -- المسؤول (إدارة المستخدمين)
  'employee',    -- الموظف (محدود حسب القسم)
  'importer',    -- المستورد (يرى طلباته فقط)
  'supplier',    -- المورد (يرى عروضه فقط)
  'agent'        -- الوكيل (صلاحيات محددة)
);
```

### 1.2 تحديث جدول profiles
```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  
  -- معلومات الاتصال
  phone TEXT UNIQUE,
  whatsapp_number TEXT,
  whatsapp_verified BOOLEAN DEFAULT FALSE,
  
  -- نظام RBAC
  role public.user_role DEFAULT 'importer',
  permissions JSONB DEFAULT '{}'::jsonb,
  entity_id UUID,  -- ربط الموظف بقسم، المورد بشركته
  
  -- حالة الحساب
  status TEXT DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'active', 'suspended', 'rejected')),
  verification_code TEXT,  -- OTP للتحقق
  verification_code_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- التفضيلات
  language_preference TEXT DEFAULT 'ar',
  theme_preference TEXT DEFAULT 'dark',
  
  -- البيانات الوصفية
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- القيود
  CONSTRAINT phone_format_check CHECK (phone ~ '^\+[1-9]\d{1,14}$'),
  CONSTRAINT whatsapp_format_check CHECK (whatsapp_number ~ '^\+[1-9]\d{1,14}$' OR whatsapp_number IS NULL)
);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_entity_id ON public.profiles(entity_id);
```

### 1.3 إنشاء جدول audit_logs (للقراءة فقط)
```sql
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- منع التعديل أو الحذف في سجلات التدقيق
CREATE OR REPLACE FUNCTION public.prevent_audit_log_changes()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER prevent_audit_log_updates
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_changes();

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
```

---

## المهمة 2: تحديث دالة handle_new_user()

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    display_name,
    role,
    status,
    language_preference,
    theme_preference,
    phone
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'importer'::public.user_role),
    'pending_verification',
    COALESCE(NEW.raw_user_meta_data->>'language_preference', 'ar'),
    COALESCE(NEW.raw_user_meta_data->>'theme_preference', 'dark')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## المهمة 3: كتابة سياسات RLS متقدمة

### 3.1 سياسات profiles
```sql
-- تمكين RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- المستخدمون يرون ملفاتهم فقط
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

-- المسؤولون والمالكون يرون جميع الملفات
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- المستخدمون يحدثون ملفاتهم فقط
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- المسؤولون يحدثون أدوار المستخدمين
CREATE POLICY "Admins can update user roles" 
  ON public.profiles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
```

### 3.2 سياسات customers (حسب الدور)
```sql
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- المستخدم يرى عملاءه فقط
CREATE POLICY "Users can view own customers" 
  ON public.customers FOR SELECT 
  USING (auth.uid() = user_id);

-- الموظفون يرون عملاء قسمهم (بناءً على permissions)
CREATE POLICY "Employees can view department customers" 
  ON public.customers FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'employee' 
      AND (permissions->>'can_view_customers')::boolean = true
    )
  );
```

### 3.3 سياسات suppliers (المورد يرى بياناته فقط)
```sql
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can view own data only" 
  ON public.suppliers FOR SELECT 
  USING (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'supplier'
    )
  );
```

---

## المهمة 4: تحديث TypeScript Types

### 4.1 تحديث src/lib/database.types.ts
إضافة الأنواع الجديدة:
```typescript
profiles: {
  Row: {
    id: string
    email: string | null
    display_name: string | null
    avatar_url: string | null
    phone: string | null
    whatsapp_number: string | null
    whatsapp_verified: boolean | null
    role: 'owner' | 'admin' | 'employee' | 'importer' | 'supplier' | 'agent'
    permissions: Json
    entity_id: string | null
    status: string | null
    verification_code: string | null
    verification_code_expires_at: string | null
    language_preference: string | null
    theme_preference: string | null
    created_at: string
    updated_at: string
    last_login_at: string | null
  }
  // ... Insert and Update types
}

audit_logs: {
  Row: {
    id: string
    user_id: string | null
    action: string
    table_name: string
    record_id: string
    old_values: Json | null
    new_values: Json | null
    ip_address: any | null
    user_agent: string | null
    created_at: string
  }
  // Insert only (no update/delete)
}
```

### 4.2 تحديث src/lib/supabase-types.ts
```typescript
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type UserRole = Database['public']['Enums']['user_role'];

export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
```

---

## المهمة 5: إنشاء وظائف التدقيق (Audit Functions)

```sql
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  client_ip INET;
  client_user_agent TEXT;
BEGIN
  current_user_id := auth.uid();
  client_ip := inet_client_addr();
  client_user_agent := current_setting('request.headers', true)::jsonb->>'user-agent';
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      user_id, action, table_name, record_id, new_values, ip_address, user_agent
    ) VALUES (
      current_user_id, 'INSERT', TG_TABLE_NAME, NEW.id::TEXT, to_jsonb(NEW), client_ip, client_user_agent
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent
    ) VALUES (
      current_user_id, 'UPDATE', TG_TABLE_NAME, NEW.id::TEXT, to_jsonb(OLD), to_jsonb(NEW), client_ip, client_user_agent
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      user_id, action, table_name, record_id, old_values, ip_address, user_agent
    ) VALUES (
      current_user_id, 'DELETE', TG_TABLE_NAME, OLD.id::TEXT, to_jsonb(OLD), client_ip, client_user_agent
    );
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تطبيق المحفزات على الجداول المهمة
CREATE TRIGGER audit_customers_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_suppliers_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_shipments_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_profiles_changes
  AFTER UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();
```

---

## المهمة 6: تحديث Supabase Middleware لحماية المسارات

تحديث `src/supabase/middleware.ts` ليشمل:
1. التحقق من حالة المستخدم (status)
2. التحقق من دور المستخدم (role)
3. حماية مسارات `/dashboard/admin/*` للمسؤولين فقط
4. حماية مسارات `/suppliers/*` للموردين
5. حماية مسارات `/customers/*` للمستوردين والموظفين المصرح لهم

---

## المهمة 7: تطوير نظام OTP عبر WhatsApp

إنشاء API route في `src/app/api/auth/whatsapp-verify/route.ts`:
1. إرسال كود OTP عبر WhatsApp Business API
2. التحقق من الكود وحفظ رقم WhatsApp في الملف الشخصي
3. تحديث حالة `whatsapp_verified` إلى true

---

## المهمة 8: تطوير صفحة التسجيل الجديدة

تحديث `src/app/login/page.tsx`:
1. نموذج هجين (موبايل + إيميل + كلمة سر)
2. إرسال OTP للموبايل (WhatsApp)
3. التحقق من الكود وتفعيل الحساب
4. إكمال بيانات الملف الشخصي بعد التسجيل

---

## المهمة 9: إنشاء لوحة تحكم المسؤول (Admin Dashboard)

إنشاء `src/app/dashboard/admin/page.tsx`:
1. عرض جميع المستخدمين مع حالاتهم وأدوارهم
2. زر "تفعيل" لتغيير حالة المستخدم من `pending_verification` إلى `active`
3. تحديد دور المستخدم (Role) وصلاحياته (permissions)
4. عرض سجلات التدقيق (audit_logs) للشفافية

---

## ترتيب التنفيذ
1. ✅ تحديث schema.sql (المهمة 1، 2، 3)
2. ✅ تحديث TypeScript types (المهمة 4)
3. ✅ إنشاء وظائف التدقيق (المهمة 5)
4. ⏳ تحديث Middleware (المهمة 6)
5. ⏳ تطوير OTP WhatsApp (المهمة 7)
6. ⏳ تحديث صفحة التسجيل (المهمة 8)
7. ⏳ إنشاء Admin Dashboard (المهمة 9)
8. ⏳ تحديث مكونات الواجهة لدعم الأدوار الجديدة
9. ⏳ اختبار شامل لنظام الصلاحيات

---

## ملاحظات هامة
- يجب تنفيذ schema.sql في Supabase SQL Editor قبل تشغيل التطبيق
- تأكد من تعيين `ENABLE ROW LEVEL SECURITY` على جميع الجداول
- اختبر السياسات باستخدام `supabase.rpc()` للتأكد من عملها
- استخدم Zod للتحقق من الأدوار في Server Actions لمنع IDOR attacks
- تأكد من أن audit_logs لا يمكن تعديله أو حذفه حتى من قبل المسؤولين
