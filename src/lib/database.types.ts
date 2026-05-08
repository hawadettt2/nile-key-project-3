export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'owner' | 'admin' | 'employee' | 'importer' | 'supplier' | 'agent';

export interface Database {
  public: {
    Enums: {
      user_role: UserRole
    }
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          avatar_url: string | null
          phone: string | null
          whatsapp_number: string | null
          whatsapp_verified: boolean | null
          role: UserRole
          permissions: Json
          entity_id: string | null
          status: string | null
          verification_code: string | null
          verification_code_expires_at: string | null
          language_preference: string | null
          theme_preference: string | null
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          whatsapp_number?: string | null
          whatsapp_verified?: boolean | null
          role?: UserRole
          permissions?: Json
          entity_id?: string | null
          status?: string | null
          verification_code?: string | null
          verification_code_expires_at?: string | null
          language_preference?: string | null
          theme_preference?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          whatsapp_number?: string | null
          whatsapp_verified?: boolean | null
          role?: UserRole
          permissions?: Json
          entity_id?: string | null
          status?: string | null
          verification_code?: string | null
          verification_code_expires_at?: string | null
          language_preference?: string | null
          theme_preference?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          table_name: string
          record_id: string
          old_values: Json | null
          new_values: Json | null
          ip_address: any | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          table_name: string
          record_id: string
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: any | null
          user_agent?: string | null
          created_at?: string
        }
        // No Update or Delete - audit logs are immutable
      }
      customers: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          company: string | null
          address: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          company: string | null
          address: string | null
          category: string | null
          rating: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          address?: string | null
          category?: string | null
          rating?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          address?: string | null
          category?: string | null
          rating?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shipments: {
        Row: {
          id: string
          user_id: string
          customer_id: string | null
          supplier_id: string | null
          status: string
          origin: string | null
          destination: string | null
          shipment_date: string | null
          estimated_arrival: string | null
          items: Json | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          customer_id?: string | null
          supplier_id?: string | null
          status: string
          origin?: string | null
          destination?: string | null
          shipment_date?: string | null
          estimated_arrival?: string | null
          items?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          customer_id?: string | null
          supplier_id?: string | null
          status?: string
          origin?: string | null
          destination?: string | null
          shipment_date?: string | null
          estimated_arrival?: string | null
          items?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      important_sites: {
        Row: {
          id: string
          user_id: string
          name: string
          url: string | null
          category: string | null
          description: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          url?: string | null
          category?: string | null
          description?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          url?: string | null
          category?: string | null
          description?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      site_categories: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          icon: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
      },
      nfsa_whitelist: {
        Row: {
          id: string
          user_id: string
          supplier_name: string
          registration_number: string | null
          status: string | null
          approved_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          supplier_name: string
          registration_number?: string | null
          status?: string | null
          approved_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          supplier_name?: string
          registration_number?: string | null
          status?: string | null
          approved_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      predictive_analytics: {
        Row: {
          id: string
          user_id: string
          data_type: string
          prediction_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          data_type: string
          prediction_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          data_type?: string
          prediction_data?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
