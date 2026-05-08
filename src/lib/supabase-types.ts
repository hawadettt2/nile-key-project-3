import type { Database } from './database.types';

// Type definitions based on Supabase schema
export type UserRole = Database['public']['Enums']['user_role'];
export type UserStatus = 'pending_verification' | 'active' | 'suspended' | 'rejected';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Customer = Database['public']['Tables']['customers']['Row'];
export type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
export type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

export type Supplier = Database['public']['Tables']['suppliers']['Row'];
export type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];
export type SupplierUpdate = Database['public']['Tables']['suppliers']['Update'];

export type Shipment = Database['public']['Tables']['shipments']['Row'];
export type ShipmentInsert = Database['public']['Tables']['shipments']['Insert'];
export type ShipmentUpdate = Database['public']['Tables']['shipments']['Update'];

export type ImportantSite = Database['public']['Tables']['important_sites']['Row'];
export type ImportantSiteInsert = Database['public']['Tables']['important_sites']['Insert'];
export type ImportantSiteUpdate = Database['public']['Tables']['important_sites']['Update'];

export type NfsaWhitelist = Database['public']['Tables']['nfsa_whitelist']['Row'];
export type NfsaWhitelistInsert = Database['public']['Tables']['nfsa_whitelist']['Insert'];
export type NfsaWhitelistUpdate = Database['public']['Tables']['nfsa_whitelist']['Update'];

export type PredictiveAnalytics = Database['public']['Tables']['predictive_analytics']['Row'];
export type PredictiveAnalyticsInsert = Database['public']['Tables']['predictive_analytics']['Insert'];

// Audit Log type (read-only)
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

// Helper type for Supabase query responses
export type WithId<T> = T & { id: string };

export type SiteCategory = Database['public']['Tables']['site_categories']['Row'];
export type SiteCategoryInsert = Database['public']['Tables']['site_categories']['Insert'];
export type SiteCategoryUpdate = Database['public']['Tables']['site_categories']['Update'];
