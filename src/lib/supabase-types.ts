import type { Database } from './database.types';

// Type definitions based on Supabase schema v2.0

// ==========================================
// ENUMS
// ==========================================

export type UserRole = 'مالك' | 'إشراف إداري' | 'موظف' | 'مستورد' | 'مورد' | 'مصدر' | 'مستخدم مسجل' | 'زائر';
export type UserStatus = 'active' | 'suspended' | 'rejected';
export type TaskStatus = Database['public']['Enums']['task_status'];
export type OpportunityStatus = Database['public']['Enums']['opportunity_status'];
export type AlertType = 'opportunity' | 'market_change' | 'regulatory' | 'shipment' | 'supplier' | 'custom';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type DemandTrend = 'increasing' | 'stable' | 'decreasing';
export type CompetitionLevel = 'low' | 'medium' | 'high' | 'very_high';

// ==========================================
// PROFILE TYPES
// ==========================================

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// ==========================================
// CORE BUSINESS TYPES
// ==========================================

export type Customer = Database['public']['Tables']['customers']['Row'];
export type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
export type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

export type Supplier = Database['public']['Tables']['suppliers']['Row'];
export type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];
export type SupplierUpdate = Database['public']['Tables']['suppliers']['Update'];

export type Shipment = Database['public']['Tables']['shipments']['Row'];
export type ShipmentInsert = Database['public']['Tables']['shipments']['Insert'];
export type ShipmentUpdate = Database['public']['Tables']['shipments']['Update'];

// ==========================================
// KNOWLEDGE BASE TYPES
// ==========================================

export type ImportantSite = Database['public']['Tables']['important_sites']['Row'];
export type ImportantSiteInsert = Database['public']['Tables']['important_sites']['Insert'];
export type ImportantSiteUpdate = Database['public']['Tables']['important_sites']['Update'];

export type SiteCategory = Database['public']['Tables']['site_categories']['Row'];
export type SiteCategoryInsert = Database['public']['Tables']['site_categories']['Insert'];
export type SiteCategoryUpdate = Database['public']['Tables']['site_categories']['Update'];



// ==========================================
// NEW EXPORT PLATFORM TYPES
// ==========================================

// Employee Tasks
export type EmployeeTask = Database['public']['Tables']['employee_tasks']['Row'];
export type EmployeeTaskInsert = Database['public']['Tables']['employee_tasks']['Insert'];
export type EmployeeTaskUpdate = Database['public']['Tables']['employee_tasks']['Update'];

// HS Codes (Tariff Classification)
export type HsCode = Database['public']['Tables']['hs_codes']['Row'];
export type HsCodeInsert = Database['public']['Tables']['hs_codes']['Insert'];
export type HsCodeUpdate = Database['public']['Tables']['hs_codes']['Update'];

// Export Opportunities
export type ExportOpportunity = Database['public']['Tables']['export_opportunities']['Row'];
export type ExportOpportunityInsert = Database['public']['Tables']['export_opportunities']['Insert'];
export type ExportOpportunityUpdate = Database['public']['Tables']['export_opportunities']['Update'];

// Supplier Ratings
export type SupplierRating = Database['public']['Tables']['supplier_ratings']['Row'];
export type SupplierRatingInsert = Database['public']['Tables']['supplier_ratings']['Insert'];
export type SupplierRatingUpdate = Database['public']['Tables']['supplier_ratings']['Update'];

// Export Alerts
export type ExportAlert = Database['public']['Tables']['export_alerts']['Row'];
export type ExportAlertInsert = Database['public']['Tables']['export_alerts']['Insert'];
export type ExportAlertUpdate = Database['public']['Tables']['export_alerts']['Update'];

// ==========================================
// ANALYTICS & LOGGING
// ==========================================



export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

// ==========================================
// HELPER TYPES
// ==========================================

export type WithId<T> = T & { id: string };

export interface SupplierWithRating extends Supplier {
  overall_rating?: number;
  rating_count?: number;
}

export interface ExportOpportunityWithDetails extends ExportOpportunity {
  hs_code?: HsCode;
  discovered_by_profile?: Profile;
}

export interface EmployeeTaskWithAssignee extends EmployeeTask {
  assigned_to_profile?: Profile;
  assigned_by_profile?: Profile;
}

export interface ExportAlertWithContext extends ExportAlert {
  opportunity?: ExportOpportunity;
  shipment?: Shipment;
  supplier?: Supplier;
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}


