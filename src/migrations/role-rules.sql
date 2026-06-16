-- RLS policies for role management
-- Enable RLS on new tables
ALTER TABLE public.role_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can insert own request" ON public.role_change_requests;
DROP POLICY IF EXISTS "users can view own requests" ON public.role_change_requests;
DROP POLICY IF EXISTS "owner/admin can view all requests" ON public.role_change_requests;
DROP POLICY IF EXISTS "owner/admin can update status" ON public.role_change_requests;
DROP POLICY IF EXISTS "owner/admin can view all role history" ON public.user_roles;
DROP POLICY IF EXISTS "owner/admin can insert role history" ON public.user_roles;
DROP POLICY IF EXISTS "owner/admin can update role history" ON public.user_roles;

-- role_change_requests policies
CREATE POLICY "users can insert own request" ON public.role_change_requests
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "users can view own requests" ON public.role_change_requests
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "owner/admin can view all requests" ON public.role_change_requests
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('مالك','إشراف إداري')));

CREATE POLICY "owner/admin can update status" ON public.role_change_requests
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('مالك','إشراف إداري')));

-- user_roles policies
CREATE POLICY "owner/admin can view all role history" ON public.user_roles
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('مالك','إشراف إداري')));

CREATE POLICY "owner/admin can insert role history" ON public.user_roles
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('مالك','إشراف إداري')));

CREATE POLICY "owner/admin can update role history" ON public.user_roles
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('مالك','إشراف إداري')));
