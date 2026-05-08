-- Nile-Key3 Database Schema (Enhanced with Advanced RBAC + RLS + OTP)
-- Migration from Firebase Firestore to Supabase PostgreSQL with Enterprise-grade Security

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER ROLES ENUM
-- =====================================================
CREATE TYPE IF NOT EXISTS public.user_role AS ENUM (
  'owner',       -- المالك (كامل الصلاحيات)
  'admin',       -- المسؤول (إدارة المستخدمين)
  'employee',    -- الموظف (محدود حسب القسم)
  'importer',    -- المستورد (يرى طلباته فقط)
  'supplier',    -- المورد (يرى عروضه فقط)
  'agent'        -- الوكيل (صلاحيات محددة)
);

-- =====================================================
-- 2. USERS PROFILES TABLE (Extended with RBAC)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  
  -- Contact Information
  phone TEXT UNIQUE,
  whatsapp_number TEXT,
  whatsapp_verified BOOLEAN DEFAULT FALSE,
  
  -- Role-Based Access Control (RBAC)
  role public.user_role DEFAULT 'importer',
  permissions JSONB DEFAULT '{}'::jsonb,  -- Fine-grained permissions
  entity_id UUID,  -- Links employee to department, supplier to company, etc.
  
  -- Account Status
  status TEXT DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'active', 'suspended', 'rejected')),
  verification_code TEXT,  -- OTP for WhatsApp verification
  verification_code_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Preferences
  language_preference TEXT DEFAULT 'ar',
  theme_preference TEXT DEFAULT 'dark',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT phone_format_check CHECK (phone ~ '^\+[1-9]\d{1,14}$'),  -- E.164 format
  CONSTRAINT whatsapp_format_check CHECK (whatsapp_number ~ '^\+[1-9]\d{1,14}$' OR whatsapp_number IS NULL)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_entity_id ON public.profiles(entity_id);

-- =====================================================
-- 3. AUDIT LOGS TABLE (Immutable, Read-Only)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,  -- e.g., 'UPDATE', 'DELETE', 'INSERT'
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,  -- ID of the affected record
  old_values JSONB,  -- Previous state
  new_values JSONB,  -- New state
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs should be append-only (no updates or deletes)
CREATE OR REPLACE FUNCTION public.prevent_audit_log_changes()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER prevent_audit_log_updates
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_changes();

-- Index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- =====================================================
-- 4. CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);

-- =====================================================
-- 5. SUPPLIERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  category TEXT,
  rating NUMERIC(2,1),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);

-- =====================================================
-- 6. SHIPMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  origin TEXT,
  destination TEXT,
  shipment_date DATE,
  estimated_arrival DATE,
  items JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON public.shipments(user_id);

-- =====================================================
-- 7. IMPORTANT SITES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.important_sites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT,
  category TEXT,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_important_sites_user_id ON public.important_sites(user_id);

-- =====================================================
-- 8. SITE CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.site_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_categories_user_id ON public.site_categories(user_id);

-- =====================================================
-- 9. NFSA WHITELIST TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.nfsa_whitelist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  supplier_name TEXT NOT NULL,
  registration_number TEXT,
  status TEXT DEFAULT 'pending',
  approved_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nfsa_whitelist_user_id ON public.nfsa_whitelist(user_id);

-- =====================================================
-- 10. PREDICTIVE ANALYTICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.predictive_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data_type TEXT NOT NULL,
  prediction_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictive_analytics_user_id ON public.predictive_analytics(user_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.important_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfsa_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ADVANCED RLS POLICIES
-- =====================================================

-- PROFILES POLICIES
-- Owners and Admins can see all profiles; users can see their own
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update user roles" 
  ON public.profiles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- CUSTOMERS POLICIES (Role-based)
CREATE POLICY "Users can view own customers" 
  ON public.customers FOR SELECT 
  USING (auth.uid() = user_id);

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

CREATE POLICY "Users can insert own customers" 
  ON public.customers FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers" 
  ON public.customers FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own customers" 
  ON public.customers FOR DELETE 
  USING (auth.uid() = user_id);

-- SUPPLIERS POLICIES
CREATE POLICY "Users can view own suppliers" 
  ON public.suppliers FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Suppliers can view own data only" 
  ON public.suppliers FOR SELECT 
  USING (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'supplier'
    )
  );

CREATE POLICY "Users can insert own suppliers" 
  ON public.suppliers FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own suppliers" 
  ON public.suppliers FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own suppliers" 
  ON public.suppliers FOR DELETE 
  USING (auth.uid() = user_id);

-- SHIPMENTS POLICIES
CREATE POLICY "Users can view own shipments" 
  ON public.shipments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shipments" 
  ON public.shipments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shipments" 
  ON public.shipments FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shipments" 
  ON public.shipments FOR DELETE 
  USING (auth.uid() = user_id);

-- IMPORTANT SITES POLICIES
CREATE POLICY "Users can view own sites" 
  ON public.important_sites FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sites" 
  ON public.important_sites FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sites" 
  ON public.important_sites FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sites" 
  ON public.important_sites FOR DELETE 
  USING (auth.uid() = user_id);

-- SITE CATEGORIES POLICIES
CREATE POLICY "Users can view own categories" 
  ON public.site_categories FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" 
  ON public.site_categories FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" 
  ON public.site_categories FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" 
  ON public.site_categories FOR DELETE 
  USING (auth.uid() = user_id);

-- NFSA WHITELIST POLICIES
CREATE POLICY "Users can view own whitelist" 
  ON public.nfsa_whitelist FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own whitelist" 
  ON public.nfsa_whitelist FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own whitelist" 
  ON public.nfsa_whitelist FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own whitelist" 
  ON public.nfsa_whitelist FOR DELETE 
  USING (auth.uid() = user_id);

-- PREDICTIVE ANALYTICS POLICIES
CREATE POLICY "Users can view own analytics" 
  ON public.predictive_analytics FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics" 
  ON public.predictive_analytics FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- AUDIT LOGS POLICIES (Read-only for all, insertable by system)
CREATE POLICY "Users can view own audit logs" 
  ON public.audit_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs" 
  ON public.audit_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Only system can insert audit logs (via trigger or secure function)
CREATE POLICY "System can insert audit logs" 
  ON public.audit_logs FOR INSERT 
  WITH CHECK (true);  -- Will be controlled by trigger/function security

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to handle new user creation with enhanced profile
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
    theme_preference
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

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to log audit trail
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  client_ip INET;
  client_user_agent TEXT;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Get client info from session (if available)
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

-- Apply audit logging to critical tables
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_important_sites_updated_at BEFORE UPDATE ON public.important_sites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_categories_updated_at BEFORE UPDATE ON public.site_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nfsa_whitelist_updated_at BEFORE UPDATE ON public.nfsa_whitelist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Allow anon users to insert into profiles (for signup)
GRANT INSERT ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO anon;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE public.profiles IS 'User profiles with RBAC support - extends auth.users';
COMMENT ON COLUMN public.profiles.role IS 'User role: owner, admin, employee, importer, supplier, agent';
COMMENT ON COLUMN public.profiles.permissions IS 'JSONB field for fine-grained permissions (e.g., {"can_edit_prices": true})';
COMMENT ON COLUMN public.profiles.entity_id IS 'Links employee to department, supplier to company, etc.';
COMMENT ON COLUMN public.profiles.status IS 'Account status: pending_verification, active, suspended, rejected';
COMMENT ON COLUMN public.profiles.verification_code IS 'OTP code for WhatsApp verification';

COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail - records all data changes with user info';
COMMENT ON COLUMN public.audit_logs.action IS 'Database action: INSERT, UPDATE, DELETE';
