-- =====================================================
-- Audit Triggers Migration - Run AFTER schema.sql
-- Adds automatic audit logging for all data changes
-- =====================================================

-- Enable RLS on role management tables (if not already)
ALTER TABLE public.role_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Audit Logging Function
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
-- Audit Triggers on all tables
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

CREATE TRIGGER IF NOT EXISTS audit_important_sites_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.important_sites
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

CREATE TRIGGER IF NOT EXISTS audit_site_categories_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.site_categories
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

CREATE TRIGGER IF NOT EXISTS audit_employee_tasks_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

CREATE TRIGGER IF NOT EXISTS audit_hs_codes_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.hs_codes
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

CREATE TRIGGER IF NOT EXISTS audit_export_opportunities_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.export_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

CREATE TRIGGER IF NOT EXISTS audit_supplier_ratings_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.supplier_ratings
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

CREATE TRIGGER IF NOT EXISTS audit_export_alerts_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.export_alerts
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

CREATE TRIGGER IF NOT EXISTS audit_role_change_requests_changes
  AFTER INSERT OR UPDATE ON public.role_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

CREATE TRIGGER IF NOT EXISTS audit_user_roles_changes
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();