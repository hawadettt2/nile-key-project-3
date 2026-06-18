-- =====================================================
-- OWNER BYPASS FUNCTION (Database-level)
-- Allows owner emails to bypass all RLS checks
-- =====================================================

-- Function to check if user is owner by email
CREATE OR REPLACE FUNCTION public.is_owner_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND email IN ('hawadettt@gmail.com', 'hawadettt2@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update policies to include owner bypass
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (role IN ('مالك', 'إشراف إداري', 'موظف') OR email IN ('hawadettt@gmail.com', 'hawadettt2@gmail.com'))
    )
  );

DROP POLICY IF EXISTS "Admins can view all customers" ON public.customers;
CREATE POLICY "Admins can view all customers" 
  ON public.customers FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (role IN ('مالك', 'إشراف إداري', 'موظف') OR email IN ('hawadettt@gmail.com', 'hawadettt2@gmail.com'))
    )
  );

DROP POLICY IF EXISTS "Authorized can view suppliers" ON public.suppliers;
CREATE POLICY "Authorized can view suppliers" 
  ON public.suppliers FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (role IN ('مالك', 'إشراف إداري', 'موظد', 'مستورد', 'مصدر') OR email IN ('hawadettt@gmail.com', 'hawadettt2@gmail.com'))
    )
  );

DROP POLICY IF EXISTS "Admins can view all shipments" ON public.shipments;
CREATE POLICY "Admins can view all shipments" 
  ON public.shipments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (role IN ('مالك', 'إشراف إداري', 'موظف') OR email IN ('hawadettt@gmail.com', 'hawadettt2@gmail.com'))
    )
  );

-- Managers task policy
DROP POLICY IF EXISTS "Managers can view all tasks" ON public.employee_tasks;
CREATE POLICY "Managers can view all tasks" 
  ON public.employee_tasks FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (role IN ('مالك', 'إشراف إداري', 'موظف') OR email IN ('hawadettt@gmail.com', 'hawadettt2@gmail.com'))
    )
  );

-- Grant permission on the function
GRANT EXECUTE ON FUNCTION public.is_owner_user TO authenticated;