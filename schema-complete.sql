-- Nile-Key3 Database Schema + Audit Triggers (Unified)
-- This is the complete schema ready for fresh Supabase deployment
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER ROLES ENUM
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.user_role AS ENUM (
      'مالك',
      'إشراف إداري',
      'موظف',
      'مستورد',
      'مورد',
      'مصدر',
      'مستخدم مسجل',
      'زائر'
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
-- 4. TRADE SOURCES TABLE
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

-- =====================================================
-- 5. PROFILES TABLE (with verification columns)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT UNIQUE,
  country TEXT,
  gps_location TEXT,
  email_verified BOOLEAN DEFAULT false,
  role public.user_role DEFAULT 'مستخدم مسجل',
  permissions JSONB DEFAULT '{}'::jsonb,
  entity_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'rejected')),
  verification_code TEXT,
  verification_code_expires_at TIMESTAMP WITH TIME ZONE,
  language_preference TEXT DEFAULT 'ar',
  theme_preference TEXT DEFAULT 'dark',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT phone_format_check CHECK (phone ~ '^\+[1-9]\d{1,14}$' OR phone IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_entity_id ON public.profiles(entity_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON public.profiles(email_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_code ON public.profiles(verification_code);

-- =====================================================
-- 6. ROLE MANAGEMENT TABLES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.role_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_role public.user_role NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  reviewer_id UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. AUDIT LOGS TABLE (IMMUTABLE)
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

-- Immutable trigger to prevent audit log changes
CREATE OR REPLACE FUNCTION public.prevent_audit_log_changes()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_audit_log_updates ON public.audit_logs;
CREATE TRIGGER prevent_audit_log_updates
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_changes();

-- =====================================================
-- 8. AUDIT LOGGING FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
  client_ip INET;
  client_user_agent TEXT;
BEGIN
  client_ip := inet_client_addr();
  client_user_agent := current_setting('request.headers', true)::jsonb->>'user-agent';

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data, ip_address, user_agent)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW), client_ip, client_user_agent);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data, ip_address, user_agent)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW), client_ip, client_user_agent);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, ip_address, user_agent)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD), client_ip, client_user_agent);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. AUDIT TRIGGERS ON ALL TABLES
-- =====================================================
CREATE TRIGGER IF NOT EXISTS audit_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

CREATE TRIGGER IF NOT EXISTS audit_shipments_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

CREATE TRIGGER IF NOT EXISTS audit_customers_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

CREATE TRIGGER IF NOT EXISTS audit_suppliers_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

CREATE TRIGGER IF NOT EXISTS audit_role_change_requests_changes
  AFTER INSERT OR UPDATE ON public.role_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

CREATE TRIGGER IF NOT EXISTS audit_user_roles_changes
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

-- =====================================================
-- 10. HANDLE NEW USER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN NEW.email IN ('hawadettt@gmail.com', 'hawadettt2@gmail.com') THEN 'مالك'::public.user_role
      ELSE 'مستخدم مسجل'::public.user_role
    END,
    'active',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role = CASE
      WHEN EXCLUDED.email IN ('hawadettt@gmail.com', 'hawadettt2@gmail.com') THEN 'مالك'::public.user_role
      ELSE profiles.role
    END,
    email_verified = true,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. RLS POLICIES (same as original schema)
-- =====================================================
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
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
  WITH CHECK (true);

CREATE POLICY "Admins can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('مالك', 'إشراف إداري', 'موظف')
    )
  );

CREATE POLICY "Admins can update all profiles" 
  ON public.profiles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('مالك', 'إشراف إداري')
    )
  )
  WITH CHECK (true);

-- Audit logs policy (Owner/Admin only)
DROP POLICY IF EXISTS "Owner admin can view audit logs" ON public.audit_logs;
CREATE POLICY "Owner admin can view audit logs" 
  ON public.audit_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('مالك', 'إشراف إداري')
    )
  );

-- =====================================================
-- 12. GRANT PERMISSIONS
-- =====================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.role_change_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_roles TO authenticated;
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

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- END OF COMPLETE SCHEMA
-- =====================================================
-- Run this file in Supabase SQL Editor to set up the complete database