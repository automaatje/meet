export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          user_id: string
          company_name: string
          contact_name: string
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          contact_name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          contact_name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          customer_id: string
          title: string
          description: string
          address: string | null
          status: 'draft' | 'sent' | 'accepted' | 'rejected'
          total_m2: number
          total_price: number
          quote_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          customer_id: string
          title: string
          description?: string
          address?: string | null
          status?: 'draft' | 'sent' | 'accepted' | 'rejected'
          total_m2?: number
          total_price?: number
          quote_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          customer_id?: string
          title?: string
          description?: string
          address?: string | null
          status?: 'draft' | 'sent' | 'accepted' | 'rejected'
          total_m2?: number
          total_price?: number
          quote_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      measurements: {
        Row: {
          id: string
          project_id: string
          photo_url: string | null
          wall_area_m2: number
          doors_area_m2: number
          windows_area_m2: number
          net_area_m2: number
          reference_height: number | null
          notes: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          photo_url?: string | null
          wall_area_m2?: number
          doors_area_m2?: number
          windows_area_m2?: number
          net_area_m2?: number
          reference_height?: number | null
          notes?: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          photo_url?: string | null
          wall_area_m2?: number
          doors_area_m2?: number
          windows_area_m2?: number
          net_area_m2?: number
          reference_height?: number | null
          notes?: string
          created_at?: string
        }
      }
      project_photos: {
        Row: {
          id: string
          project_id: string
          photo_url: string
          caption: string
          photo_type: 'before' | 'after' | 'detail'
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          photo_url: string
          caption?: string
          photo_type?: 'before' | 'after' | 'detail'
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          photo_url?: string
          caption?: string
          photo_type?: 'before' | 'after' | 'detail'
          created_at?: string
        }
      }
      price_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          material_price_per_m2: number
          labor_price_per_m2: number
          waste_percentage: number
          vat_percentage: number
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          material_price_per_m2?: number
          labor_price_per_m2?: number
          waste_percentage?: number
          vat_percentage?: number
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          material_price_per_m2?: number
          labor_price_per_m2?: number
          waste_percentage?: number
          vat_percentage?: number
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          company_name: string | null
          contact_name: string | null
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          kvk_number: string | null
          btw_number: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          company_name?: string | null
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          kvk_number?: string | null
          btw_number?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string | null
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          kvk_number?: string | null
          btw_number?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
