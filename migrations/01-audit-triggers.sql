-- =====================================================
-- Audit Triggers Migration - Run AFTER schema.sql
-- Adds automatic audit logging for all data changes
-- =====================================================

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

CREATE OR REPLACE FUNCTION public.log_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
  client_ip INET;
  client_user_agent TEXT;
  request_headers JSONB;
BEGIN
  client_ip := inet_client_addr();
  request_headers := current_setting('request.headers', true)::jsonb;
  client_user_agent := request_headers->>'user-agent';

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

DROP TRIGGER IF EXISTS audit_profiles_changes ON public.profiles;
CREATE TRIGGER audit_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

DROP TRIGGER IF EXISTS audit_trade_sources_changes ON public.trade_sources;
CREATE TRIGGER audit_trade_sources_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.trade_sources
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

DROP TRIGGER IF EXISTS audit_shipments_changes ON public.shipments;
CREATE TRIGGER audit_shipments_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

DROP TRIGGER IF EXISTS audit_customers_changes ON public.customers;
CREATE TRIGGER audit_customers_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

DROP TRIGGER IF EXISTS audit_suppliers_changes ON public.suppliers;
CREATE TRIGGER audit_suppliers_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

DROP TRIGGER IF EXISTS audit_important_sites_changes ON public.important_sites;
CREATE TRIGGER audit_important_sites_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.important_sites
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

DROP TRIGGER IF EXISTS audit_site_categories_changes ON public.site_categories;
CREATE TRIGGER audit_site_categories_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.site_categories
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

DROP TRIGGER IF EXISTS audit_nfsa_whitelist_changes ON public.nfsa_whitelist;
CREATE TRIGGER audit_nfsa_whitelist_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.nfsa_whitelist
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

DROP TRIGGER IF EXISTS audit_predictive_analytics_changes ON public.predictive_analytics;
CREATE TRIGGER audit_predictive_analytics_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.predictive_analytics
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

DROP TRIGGER IF EXISTS audit_employee_tasks_changes ON public.employee_tasks;
CREATE TRIGGER audit_employee_tasks_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

DROP TRIGGER IF EXISTS audit_hs_codes_changes ON public.hs_codes;
CREATE TRIGGER audit_hs_codes_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.hs_codes
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

DROP TRIGGER IF EXISTS audit_export_opportunities_changes ON public.export_opportunities;
CREATE TRIGGER audit_export_opportunities_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.export_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

DROP TRIGGER IF EXISTS audit_supplier_ratings_changes ON public.supplier_ratings;
CREATE TRIGGER audit_supplier_ratings_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.supplier_ratings
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

DROP TRIGGER IF EXISTS audit_export_alerts_changes ON public.export_alerts;
CREATE TRIGGER audit_export_alerts_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.export_alerts
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

DROP TRIGGER IF EXISTS audit_role_change_requests_changes ON public.role_change_requests;
CREATE TRIGGER audit_role_change_requests_changes
  AFTER INSERT OR UPDATE ON public.role_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

DROP TRIGGER IF EXISTS audit_user_roles_changes ON public.user_roles;
CREATE TRIGGER audit_user_roles_changes
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();
