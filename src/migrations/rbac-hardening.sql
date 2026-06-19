-- =====================================================
-- RBAC Hardening Migration - Run AFTER schema.sql
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_role_change_requests_updated_at ON public.role_change_requests;
CREATE TRIGGER set_role_change_requests_updated_at
  BEFORE UPDATE ON public.role_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.role_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can insert own request" ON public.role_change_requests;
DROP POLICY IF EXISTS "users can view own requests" ON public.role_change_requests;
DROP POLICY IF EXISTS "owner/admin can view all requests" ON public.role_change_requests;
DROP POLICY IF EXISTS "owner/admin can update status" ON public.role_change_requests;
DROP POLICY IF EXISTS "owner/admin can view all role history" ON public.user_roles;
DROP POLICY IF EXISTS "owner/admin can insert role history" ON public.user_roles;
DROP POLICY IF EXISTS "owner/admin can update role history" ON public.user_roles;

CREATE POLICY "users can insert own request" ON public.role_change_requests
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "users can view own requests" ON public.role_change_requests
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "owner/admin can view all requests" ON public.role_change_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('مالك', 'إشراف إداري')
    )
  );

CREATE POLICY "owner/admin can update review fields only" ON public.role_change_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('مالك', 'إشراف إداري')
    )
  )
  WITH CHECK (
    profile_id = OLD.profile_id
    AND requested_role = OLD.requested_role
    AND reason = OLD.reason
    AND created_at = OLD.created_at
    AND status IN ('pending', 'approved', 'rejected')
  );

CREATE POLICY "owner/admin can view all role history" ON public.user_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('مالك', 'إشراف إداري')
    )
  );

CREATE POLICY "owner/admin can insert role history" ON public.user_roles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('مالك', 'إشراف إداري')
    )
  );

CREATE POLICY "owner/admin can update role history" ON public.user_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('مالك', 'إشراف إداري')
    )
  )
  WITH CHECK (
    profile_id = OLD.profile_id
    AND role = OLD.role
    AND assigned_at = OLD.assigned_at
  );

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
      AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;
