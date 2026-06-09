-- Nile-Key3 Database Schema v2.0 (Export Platform)
-- Advanced RBAC + RLS + AI-Powered Export Management
-- Migration: Email/Password Only Authentication, Enhanced Export Features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER ROLES ENUM
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.user_role AS ENUM (
      'owner',       -- المالك (كامل الصلاحيات)
      'admin',       -- المدير (إدارة المستخدمين والنظام)
      'employee',    -- الموظف (محدود حسب المسؤوليات)
      'importer',    -- المستورد (يرى طلباته فقط)
      'supplier',    -- المورد (يرى عروضه فقط)
      'agent'        -- الوكيل (صلاحيات محددة للأسواق)
    );
  END IF;
END $$;

-- =====================================================
-- 2. TASK STATUS ENUM
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.task_status AS ENUM (
      'pending',
      'in_progress',
      'completed',
      'cancelled',
      'on_hold'
    );
  END IF;
END $$;

-- =====================================================
-- 3. OPPORTUNITY STATUS ENUM
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opportunity_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.opportunity_status AS ENUM (
      'discovered',
      'analyzing',
      'qualified',
      'high_potential',
      'pursuing',
      'closed_won',
      'closed_lost'
    );
  END IF;
END $$;

-- =====================================================
-- 4. TRADE SOURCES TABLE (VERIFIED SOURCES ONLY)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.trade_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  main_category TEXT NOT NULL,
  description TEXT,
  credibility_score NUMERIC CHECK (credibility_score >= 0 AND credibility_score <= 100),
  source_type TEXT CHECK (source_type IN ('official', 'institutional', 'market', 'logistics', 'customs')) NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  country TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trade_sources_is_verified ON public.trade_sources(is_verified);
CREATE INDEX IF NOT EXISTS idx_trade_sources_source_type ON public.trade_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_trade_sources_main_category ON public.trade_sources(main_category);
CREATE INDEX IF NOT EXISTS idx_trade_sources_credibility_score ON public.trade_sources(credibility_score DESC);

-- =====================================================
-- 5. USERS PROFILES TABLE (Cleaned - No WhatsApp)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  
  -- Contact Information
  phone TEXT UNIQUE,
  country TEXT,
  gps_location TEXT,
  
  -- Role-Based Access Control (RBAC)
  role public.user_role DEFAULT 'importer',
  permissions JSONB DEFAULT '{}'::jsonb,
  entity_id UUID,
  
  -- Account Status (Email-only verification)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'rejected')),
  email_verified BOOLEAN DEFAULT false,
  
  -- Preferences
  language_preference TEXT DEFAULT 'ar',
  theme_preference TEXT DEFAULT 'dark',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT phone_format_check CHECK (phone ~ '^\+[1-9]\d{1,14}$' OR phone IS NULL)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_entity_id ON public.profiles(entity_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON public.profiles(email_verified);

-- =====================================================
-- 5. AUDIT LOGS TABLE (Read-Only, Immutable)
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
-- 6. SHIPMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON public.shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON public.shipments(created_at);

-- =====================================================
-- 7. CUSTOMERS TABLE
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

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_country ON public.customers(country);

-- =====================================================
-- 8. SUPPLIERS TABLE
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

CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_governorate ON public.suppliers(governorate);
CREATE INDEX IF NOT EXISTS idx_suppliers_nfsa_whitelisted ON public.suppliers(is_nfsa_whitelisted);

-- =====================================================
-- 10. IMPORTANT SITES TABLE (Verified Sources Only)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.important_sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.site_categories(id) ON DELETE CASCADE,
  is_verified BOOLEAN DEFAULT false,
  source_type TEXT CHECK (source_type IN ('official', 'institutional', 'market', 'logistics', 'customs')),
  credibility_score NUMERIC CHECK (credibility_score >= 0 AND credibility_score <= 100),
  country TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_important_sites_category_id ON public.important_sites(category_id);

-- =====================================================
-- 10. SITE CATEGORIES TABLE
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
-- 11. NFSA WHITELIST TABLE
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

CREATE INDEX IF NOT EXISTS idx_nfsa_whitelist_governorate ON public.nfsa_whitelist(governorate);

-- =====================================================
-- 12. PREDICTIVE ANALYTICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.predictive_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  crop_type TEXT,
  harvest_time_prediction TEXT,
  market_opportunities JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

Create INDEX IF NOT EXISTS idx_predictive_analytics_user_id ON public.predictive_analytics(user_id);

-- =====================================================
-- 13. EMPLOYEE TASKS TABLE (NEW)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.employee_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assigned_by UUID REFERENCES auth.users(id) NOT NULL,
  assigned_to UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status public.task_status DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_tasks_assigned_to ON public.employee_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_employee_tasks_assigned_by ON public.employee_tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_employee_tasks_status ON public.employee_tasks(status);
CREATE INDEX IF NOT EXISTS idx_employee_tasks_due_date ON public.employee_tasks(due_date);

-- =====================================================
-- 14. HS CODES TABLE (NEW)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.hs_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  product_description TEXT NOT NULL,
  product_name_ar TEXT,
  product_name_en TEXT,
  category TEXT,
  is_agricultural BOOLEAN DEFAULT false,
  tariff_rate DECIMAL,
  restrictions JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hs_codes_code ON public.hs_codes(code);
CREATE INDEX IF NOT EXISTS idx_hs_codes_category ON public.hs_codes(category);
CREATE INDEX IF NOT EXISTS idx_hs_codes_is_agricultural ON public.hs_codes(is_agricultural);

-- =====================================================
-- 15. EXPORT OPPORTUNITIES TABLE (NEW)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.export_opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discovered_by UUID REFERENCES auth.users(id),
  product_name_ar TEXT NOT NULL,
  product_name_en TEXT NOT NULL,
  hs_code_id UUID REFERENCES public.hs_codes(id) ON DELETE SET NULL,
  target_country TEXT NOT NULL,
  target_market_region TEXT,
  market_size_usd DECIMAL,
  current_gap_tons DECIMAL,
  demand_trend TEXT CHECK (demand_trend IN ('increasing', 'stable', 'decreasing')),
  estimated_price_per_ton DECIMAL,
  competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high', 'very_high')),
  entry_barriers JSONB DEFAULT '{}'::jsonb,
  regulatory_requirements JSONB DEFAULT '{}'::jsonb,
  logistics_notes TEXT,
  status public.opportunity_status DEFAULT 'discovered',
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_export_opportunities_discovered_by ON public.export_opportunities(discovered_by);
CREATE INDEX IF NOT EXISTS idx_export_opportunities_target_country ON public.export_opportunities(target_country);
CREATE INDEX IF NOT EXISTS idx_export_opportunities_status ON public.export_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_export_opportunities_hs_code_id ON public.export_opportunities(hs_code_id);
CREATE INDEX IF NOT EXISTS idx_export_opportunities_confidence_score ON public.export_opportunities(confidence_score DESC);

-- =====================================================
-- 16. SUPPLIER RATINGS TABLE (NEW)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.supplier_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  rated_by UUID REFERENCES auth.users(id),
  quality_score NUMERIC CHECK (quality_score >= 1 AND quality_score <= 5),
  delivery_score NUMERIC CHECK (delivery_score >= 1 AND delivery_score <= 5),
  communication_score NUMERIC CHECK (communication_score >= 1 AND communication_score <= 5),
  reliability_score NUMERIC CHECK (reliability_score >= 1 AND reliability_score <= 5),
  comments TEXT,
  overall_rating NUMERIC GENERATED ALWAYS AS (
    ROUND((quality_score + delivery_score + communication_score + reliability_score) / 4, 2)
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_ratings_supplier_id ON public.supplier_ratings(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_ratings_overall_rating ON public.supplier_ratings(overall_rating DESC);

-- =====================================================
-- 17. EXPORT ALERTS TABLE (NEW)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.export_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  alert_type TEXT CHECK (alert_type IN ('opportunity', 'market_change', 'regulatory', 'shipment', 'supplier', 'custom')) NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  related_opportunity_id UUID REFERENCES public.export_opportunities(id),
  related_shipment_id UUID REFERENCES public.shipments(id),
  related_supplier_id UUID REFERENCES public.suppliers(id),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_export_alerts_user_id ON public.export_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_export_alerts_alert_type ON public.export_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_export_alerts_priority ON public.export_alerts(priority);
CREATE INDEX IF NOT EXISTS idx_export_alerts_is_read ON public.export_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_export_alerts_created_at ON public.export_alerts(created_at DESC);

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
ALTER TABLE public.employee_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hs_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_alerts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
    status = (SELECT status FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'employee')
    )
  );

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

DROP POLICY IF EXISTS "Users can view own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can create shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can update own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admins can view all shipments" ON public.shipments;

CREATE POLICY "Users can view own shipments" 
  ON public.shipments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create shipments" 
  ON public.shipments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shipments" 
  ON public.shipments FOR UPDATE 
  USING (auth.uid() = user_id);

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

DROP POLICY IF EXISTS "Users can view own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can manage own customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can view all customers" ON public.customers;

CREATE POLICY "Users can view own customers" 
  ON public.customers FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own customers" 
  ON public.customers FOR ALL 
  USING (auth.uid() = user_id);

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

DROP POLICY IF EXISTS "Authorized can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Suppliers can update own data" ON public.suppliers;
DROP POLICY IF EXISTS "Admins can manage suppliers" ON public.suppliers;

CREATE POLICY "Authorized can view suppliers" 
  ON public.suppliers FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'employee', 'importer', 'agent')
    )
  );

CREATE POLICY "Suppliers can update own data" 
  ON public.suppliers FOR UPDATE 
  USING (auth.uid() = user_id);

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
-- EMPLOYEE TASKS POLICIES (NEW)
-- =====================================================

CREATE POLICY "Employees can view assigned tasks" 
  ON public.employee_tasks FOR SELECT 
  USING (auth.uid() = assigned_to);

CREATE POLICY "Managers can view all tasks" 
  ON public.employee_tasks FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'employee')
    )
  );

CREATE POLICY "Managers can create tasks" 
  ON public.employee_tasks FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'employee')
    )
  );

CREATE POLICY "Employees can update own tasks" 
  ON public.employee_tasks FOR UPDATE 
  USING (auth.uid() = assigned_to);

-- =====================================================
-- HS CODES POLICIES (NEW)
-- =====================================================

CREATE POLICY "Everyone can view hs codes" 
  ON public.hs_codes FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can manage hs codes" 
  ON public.hs_codes FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- EXPORT OPPORTUNITIES POLICIES (NEW)
-- =====================================================

CREATE POLICY "Users can view opportunities" 
  ON public.export_opportunities FOR SELECT 
  USING (true);

CREATE POLICY "Authorized users can create opportunities" 
  ON public.export_opportunities FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'employee', 'agent')
    )
  );

CREATE POLICY "Authorized users can update opportunities" 
  ON public.export_opportunities FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'employee')
    )
  );

-- =====================================================
-- SUPPLIER RATINGS POLICIES (NEW)
-- =====================================================

CREATE POLICY "Everyone can view supplier ratings" 
  ON public.supplier_ratings FOR SELECT 
  USING (true);

CREATE POLICY "Users can create ratings" 
  ON public.supplier_ratings FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'employee', 'importer', 'agent')
    )
  );

-- =====================================================
-- EXPORT ALERTS POLICIES (NEW)
-- =====================================================

CREATE POLICY "Users can view own alerts" 
  ON public.export_alerts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can create alerts" 
  ON public.export_alerts FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update own alerts" 
  ON public.export_alerts FOR UPDATE 
  USING (auth.uid() = user_id);

-- =====================================================
-- AUDIT LOGS POLICIES (Restricted - Owner/Admin Only)
-- =====================================================

DROP POLICY IF EXISTS "Everyone can view audit logs" ON public.audit_logs;

CREATE POLICY "Owner admin can view audit logs" 
  ON public.audit_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email = 'hawadettt@gmail.com' THEN 'owner'::public.user_role
      ELSE 'importer'::public.user_role
    END,
    'active',
    true
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

-- Function to calculate supplier overall rating
CREATE OR REPLACE FUNCTION public.recalculate_supplier_rating(supplier_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  overall_rating NUMERIC;
BEGIN
  SELECT ROUND(AVG(overall_rating), 2) INTO overall_rating
  FROM public.supplier_ratings
  WHERE supplier_id = $1;
  
  RETURN COALESCE(overall_rating, 0);
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
GRANT SELECT, INSERT, UPDATE ON public.employee_tasks TO authenticated;
GRANT SELECT ON public.hs_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.export_opportunities TO authenticated;
GRANT SELECT, INSERT ON public.supplier_ratings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.export_alerts TO authenticated;

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
-- SAMPLE HS CODES (Agricultural Products)
-- =====================================================

INSERT INTO public.hs_codes (code, product_name_ar, product_name_en, product_description, category, is_agricultural, tariff_rate) VALUES
  ('0702.00.00', 'الطماطم', 'Tomatoes', 'Tomatoes, fresh or chilled', 'Vegetables', true, 0.05),
  ('0703.10.10', 'البصل', 'Onions', 'Onions and shallots, fresh or chilled', 'Vegetables', true, 0.05),
  ('0804.30.00', 'التمر', 'Dates', 'Dates, fresh or dried', 'Fruits', true, 0.05),
  ('0805.10.00', 'البرتقال', 'Oranges', 'Oranges, fresh or dried', 'Fruits', true, 0.08),
  ('0806.10.00', 'العنب', 'Grapes', 'Grapes, fresh or dried', 'Fruits', true, 0.10)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
