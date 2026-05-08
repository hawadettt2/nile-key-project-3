-- Nile-Key3 Database Schema (Enhanced with Advanced RBAC + RLS + OTP)
-- Migration from Firebase Firestore to Supabase PostgreSQL with Enterprise-grade Security

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER ROLES ENUM
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.user_role AS ENUM (
      'owner',       -- المالك (كامل الصلاحيات)
      'admin',       -- المدير (إدارة المستخدمين)
      'employee',    -- الموظف (محدود حسب القسم)
      'importer',    -- المستورد (يرى طلباته فقط)
      'supplier',    -- المورد (يرى عروضه فقط)
      'agent'        -- الوكيل (صلاحيات محددة)
    );
  END IF;
END $$;

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
  country TEXT,
  gps_location TEXT,
  
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
-- 3. AUDIT LOGS TABLE (Read-Only, Immutable)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. SHIPMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  customer_id UUID,
  shipment_type TEXT,
  weight_kg DECIMAL,
  quantity INTEGER,
  price DECIMAL,
  container_number TEXT,
  tracking_number TEXT,
  acid_number TEXT,
  transport_type TEXT,
  status TEXT DEFAULT 'processing',
  is_temperature_controlled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. SUPPLIERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  governorate TEXT,
  is_nfsa_whitelisted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. IMPORTANT SITES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.important_sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category_id UUID,
  icon TEXT DEFAULT 'Globe',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. SITE CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.site_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Folder',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. NFSA WHITELIST TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.nfsa_whitelist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_name TEXT NOT NULL,
  governorate TEXT,
  address TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. PREDICTIVE ANALYTICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.predictive_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  crop_type TEXT,
  harvest_time_prediction TEXT,
  market_opportunities JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.important_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfsa_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

-- Users can update their own profile (except role and status)
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
    status = (SELECT status FROM public.profiles WHERE id = auth.uid())
  );

-- Admins (owner, admin, employee) can view all profiles
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'employee')
    )
  );

-- Only owners and admins can update roles and status
CREATE POLICY "Admins can update all profiles" 
  ON public.profiles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- SHIPMENTS POLICIES
-- =====================================================

-- Users can view their own shipments
CREATE POLICY "Users can view own shipments" 
  ON public.shipments FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create their own shipments
CREATE POLICY "Users can create shipments" 
  ON public.shipments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own shipments
CREATE POLICY "Users can update own shipments" 
  ON public.shipments FOR UPDATE 
  USING (auth.uid() = user_id);

-- Admins can view all shipments
CREATE POLICY "Admins can view all shipments" 
  ON public.shipments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'employee')
    )
  );

-- =====================================================
-- CUSTOMERS POLICIES
-- =====================================================

-- Users can view their own customers
CREATE POLICY "Users can view own customers" 
  ON public.customers FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can manage their own customers
CREATE POLICY "Users can manage own customers" 
  ON public.customers FOR ALL 
  USING (auth.uid() = user_id);

-- Admins can view all customers
CREATE POLICY "Admins can view all customers" 
  ON public.customers FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'employee')
    )
  );

-- =====================================================
-- SUPPLIERS POLICIES
-- =====================================================

-- Everyone can view suppliers
CREATE POLICY "Everyone can view suppliers" 
  ON public.suppliers FOR SELECT 
  USING (true);

-- Suppliers can update their own data
CREATE POLICY "Suppliers can update own data" 
  ON public.suppliers FOR UPDATE 
  USING (auth.uid() = user_id);

-- Admins can manage all suppliers
CREATE POLICY "Admins can manage suppliers" 
  ON public.suppliers FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'employee')
    )
  );

-- =====================================================
-- AUDIT LOGS POLICIES (Read-Only)
-- =====================================================

-- No one can insert/update/delete audit logs directly
-- Only through SECURITY DEFINER functions

-- Everyone can view audit logs (read-only)
CREATE POLICY "Everyone can view audit logs" 
  ON public.audit_logs FOR SELECT 
  USING (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status, whatsapp_verified)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email = 'hawadettt@gmail.com' THEN 'owner'::public.user_role
      ELSE 'importer'::public.user_role
    END,
    'pending_verification',
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to log audit events (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  action TEXT,
  table_name TEXT,
  record_id UUID,
  old_data JSONB DEFAULT NULL,
  new_data JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (auth.uid(), action, table_name, record_id, old_data, new_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.important_sites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_categories TO authenticated;
GRANT SELECT ON public.nfsa_whitelist TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.predictive_analytics TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- SAMPLE DATA (Site Categories)
-- =====================================================

INSERT INTO public.site_categories (name, description, icon) VALUES
  ('Sovereign & Operations Platforms', 'Platforms like Nafeza, ACID, etc.', 'Globe'),
  ('Egyptian Government Sites', 'Official government websites', 'Landmark'),
  ('Agricultural Sites', 'Agricultural organizations and research centers', 'Sprout'),
  ('Logistics Tracking Tools', 'Tracking and logistics tools', 'Truck'),
  ('Market Intelligence & Technical Data', 'Market analysis and technical data', 'BarChart3')
ON CONFLICT DO NOTHING;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
