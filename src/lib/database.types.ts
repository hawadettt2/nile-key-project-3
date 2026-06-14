export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'owner' | 'admin' | 'employee' | 'importer' | 'supplier' | 'agent' | 'user';

export interface Database {
  public: {
    Enums: {
      user_role: UserRole;
      task_status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
      opportunity_status: 'discovered' | 'analyzing' | 'qualified' | 'high_potential' | 'pursuing' | 'closed_won' | 'closed_lost';
    };
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          gps_location: string | null;
          email_verified: boolean;
          role: UserRole;
          permissions: Json;
          entity_id: string | null;
          status: 'active' | 'suspended' | 'rejected' | null;
          language_preference: string | null;
          theme_preference: string | null;
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          gps_location?: string | null;
          email_verified?: boolean;
          role?: UserRole;
          permissions?: Json;
          entity_id?: string | null;
          status?: 'active' | 'suspended' | 'rejected' | null;
          language_preference?: string | null;
          theme_preference?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          gps_location?: string | null;
          email_verified?: boolean;
          role?: UserRole;
          permissions?: Json;
          entity_id?: string | null;
          status?: 'active' | 'suspended' | 'rejected' | null;
          language_preference?: string | null;
          theme_preference?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          table_name: string;
          record_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          table_name: string;
          record_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: never;
      };
      customers: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          company_name: string | null;
          country: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email?: string | null;
          phone?: string | null;
          company_name?: string | null;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          email?: string | null;
          phone?: string | null;
          company_name?: string | null;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      shipments: {
        Row: {
          id: string;
          user_id: string | null;
          customer_id: string | null;
          shipment_type: string | null;
          weight_kg: number | null;
          quantity: number | null;
          price: number | null;
          container_number: string | null;
          tracking_number: string | null;
          acid_number: string | null;
          transport_type: string | null;
          status: 'active' | 'suspended' | 'rejected' | null;
          is_temperature_controlled: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          customer_id?: string | null;
          shipment_type?: string | null;
          weight_kg?: number | null;
          quantity?: number | null;
          price?: number | null;
          container_number?: string | null;
          tracking_number?: string | null;
          acid_number?: string | null;
          transport_type?: string | null;
          status?: 'active' | 'suspended' | 'rejected' | null;
          is_temperature_controlled?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          customer_id?: string | null;
          shipment_type?: string | null;
          weight_kg?: number | null;
          quantity?: number | null;
          price?: number | null;
          container_number?: string | null;
          tracking_number?: string | null;
          acid_number?: string | null;
          transport_type?: string | null;
          status?: 'active' | 'suspended' | 'rejected' | null;
          is_temperature_controlled?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          contact_person: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          governorate: string | null;

          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          contact_person?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          governorate?: string | null;

          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          contact_person?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          governorate?: string | null;

          created_at?: string;
          updated_at?: string;
        };
      };
      important_sites: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          url: string;
          description: string | null;
          category_id: string | null;
          icon: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          url: string;
          description?: string | null;
          category_id?: string | null;
          icon?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          url?: string;
          description?: string | null;
          category_id?: string | null;
          icon?: string | null;
          created_at?: string;
        };
      };
      site_categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          description: string | null;
          icon: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
        };
};
        employee_tasks: {
        Row: {
          id: string;
          assigned_by: string;
          assigned_to: string;
          title: string;
          description: string | null;
          priority: 'low' | 'medium' | 'high' | 'critical' | null;
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold' | null;
          due_date: string | null;
          completed_at: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          assigned_by: string;
          assigned_to: string;
          title: string;
          description?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'critical' | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold' | null;
          due_date?: string | null;
          completed_at?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          assigned_by?: string;
          assigned_to?: string;
          title?: string;
          description?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'critical' | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold' | null;
          due_date?: string | null;
          completed_at?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      hs_codes: {
        Row: {
          id: string;
          code: string;
          product_description: string;
          product_name_ar: string | null;
          product_name_en: string | null;
          category: string | null;
          is_agricultural: boolean | null;
          tariff_rate: number | null;
          restrictions: Json | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          product_description: string;
          product_name_ar?: string | null;
          product_name_en?: string | null;
          category?: string | null;
          is_agricultural?: boolean | null;
          tariff_rate?: number | null;
          restrictions?: Json | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          product_description?: string;
          product_name_ar?: string | null;
          product_name_en?: string | null;
          category?: string | null;
          is_agricultural?: boolean | null;
          tariff_rate?: number | null;
          restrictions?: Json | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      export_opportunities: {
        Row: {
          id: string;
          discovered_by: string | null;
          product_name_ar: string;
          product_name_en: string;
          hs_code_id: string | null;
          target_country: string;
          target_market_region: string | null;
          market_size_usd: number | null;
          current_gap_tons: number | null;
          demand_trend: 'increasing' | 'stable' | 'decreasing' | null;
          estimated_price_per_ton: number | null;
          competition_level: 'low' | 'medium' | 'high' | 'very_high' | null;
          entry_barriers: Json | null;
          regulatory_requirements: Json | null;
          logistics_notes: string | null;
          status: 'discovered' | 'analyzing' | 'qualified' | 'high_potential' | 'pursuing' | 'closed_won' | 'closed_lost' | null;
          confidence_score: number | null;
          ai_generated: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          discovered_by?: string | null;
          product_name_ar: string;
          product_name_en: string;
          hs_code_id?: string | null;
          target_country: string;
          target_market_region?: string | null;
          market_size_usd?: number | null;
          current_gap_tons?: number | null;
          demand_trend?: 'increasing' | 'stable' | 'decreasing' | null;
          estimated_price_per_ton?: number | null;
          competition_level?: 'low' | 'medium' | 'high' | 'very_high' | null;
          entry_barriers?: Json | null;
          regulatory_requirements?: Json | null;
          logistics_notes?: string | null;
          status?: 'discovered' | 'analyzing' | 'qualified' | 'high_potential' | 'pursuing' | 'closed_won' | 'closed_lost' | null;
          confidence_score?: number | null;
          ai_generated?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          discovered_by?: string | null;
          product_name_ar?: string;
          product_name_en?: string;
          hs_code_id?: string | null;
          target_country?: string;
          target_market_region?: string | null;
          market_size_usd?: number | null;
          current_gap_tons?: number | null;
          demand_trend?: 'increasing' | 'stable' | 'decreasing' | null;
          estimated_price_per_ton?: number | null;
          competition_level?: 'low' | 'medium' | 'high' | 'very_high' | null;
          entry_barriers?: Json | null;
          regulatory_requirements?: Json | null;
          logistics_notes?: string | null;
          status?: 'discovered' | 'analyzing' | 'qualified' | 'high_potential' | 'pursuing' | 'closed_won' | 'closed_lost' | null;
          confidence_score?: number | null;
          ai_generated?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      supplier_ratings: {
        Row: {
          id: string;
          supplier_id: string;
          rated_by: string | null;
          quality_score: number | null;
          delivery_score: number | null;
          communication_score: number | null;
          reliability_score: number | null;
          comments: string | null;
          overall_rating: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supplier_id: string;
          rated_by?: string | null;
          quality_score?: number | null;
          delivery_score?: number | null;
          communication_score?: number | null;
          reliability_score?: number | null;
          comments?: string | null;
          overall_rating?: never;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          supplier_id?: string;
          rated_by?: string | null;
          quality_score?: number | null;
          delivery_score?: number | null;
          communication_score?: number | null;
          reliability_score?: number | null;
          comments?: string | null;
          overall_rating?: never;
          created_at?: string;
          updated_at?: string;
        };
      };
      export_alerts: {
        Row: {
          id: string;
          user_id: string | null;
          alert_type: 'opportunity' | 'market_change' | 'regulatory' | 'shipment' | 'supplier' | 'custom';
          title_ar: string;
          title_en: string;
          description_ar: string | null;
          description_en: string | null;
          related_opportunity_id: string | null;
          related_shipment_id: string | null;
          related_supplier_id: string | null;
          priority: 'low' | 'medium' | 'high' | 'critical' | null;
          is_read: boolean | null;
          is_dismissed: boolean | null;
          action_url: string | null;
          metadata: Json | null;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          alert_type: 'opportunity' | 'market_change' | 'regulatory' | 'shipment' | 'supplier' | 'custom';
          title_ar: string;
          title_en: string;
          description_ar?: string | null;
          description_en?: string | null;
          related_opportunity_id?: string | null;
          related_shipment_id?: string | null;
          related_supplier_id?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'critical' | null;
          is_read?: boolean | null;
          is_dismissed?: boolean | null;
          action_url?: string | null;
          metadata?: Json | null;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          alert_type?: 'opportunity' | 'market_change' | 'regulatory' | 'shipment' | 'supplier' | 'custom';
          title_ar?: string;
          title_en?: string;
          description_ar?: string | null;
          description_en?: string | null;
          related_opportunity_id?: string | null;
          related_shipment_id?: string | null;
          related_supplier_id?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'critical' | null;
          is_read?: boolean | null;
          is_dismissed?: boolean | null;
          action_url?: string | null;
          metadata?: Json | null;
          created_at?: string;
          read_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}
