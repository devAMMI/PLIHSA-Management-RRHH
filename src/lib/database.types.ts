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
      companies: {
        Row: {
          id: string
          name: string
          code: string
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      plants: {
        Row: {
          id: string
          company_id: string
          name: string
          location: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          location?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          location?: string | null
          created_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          employee_code: string
          company_id: string
          department_id: string | null
          plant_id: string | null
          first_name: string
          last_name: string
          birth_date: string | null
          photo_url: string | null
          gender: string | null
          employee_type: 'operativo' | 'administrativo'
          position: string
          hire_date: string
          status: 'active' | 'inactive' | 'suspended'
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          education_level: string | null
          university: string | null
          degree: string | null
          marital_status: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          manager_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_code: string
          company_id: string
          department_id?: string | null
          plant_id?: string | null
          first_name: string
          last_name: string
          birth_date?: string | null
          photo_url?: string | null
          gender?: string | null
          employee_type: 'operativo' | 'administrativo'
          position: string
          hire_date: string
          status?: 'active' | 'inactive' | 'suspended'
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          education_level?: string | null
          university?: string | null
          degree?: string | null
          marital_status?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_code?: string
          company_id?: string
          department_id?: string | null
          plant_id?: string | null
          first_name?: string
          last_name?: string
          birth_date?: string | null
          photo_url?: string | null
          gender?: string | null
          employee_type?: 'operativo' | 'administrativo'
          position?: string
          hire_date?: string
          status?: 'active' | 'inactive' | 'suspended'
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          education_level?: string | null
          university?: string | null
          degree?: string | null
          marital_status?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      employee_family_members: {
        Row: {
          id: string
          employee_id: string
          relationship: 'padre' | 'madre' | 'hijo' | 'hija' | 'conyuge' | 'otro'
          first_name: string
          last_name: string
          birth_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          relationship: 'padre' | 'madre' | 'hijo' | 'hija' | 'conyuge' | 'otro'
          first_name: string
          last_name: string
          birth_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          relationship?: 'padre' | 'madre' | 'hijo' | 'hija' | 'conyuge' | 'otro'
          first_name?: string
          last_name?: string
          birth_date?: string | null
          created_at?: string
        }
      }
      system_users: {
        Row: {
          id: string
          user_id: string
          employee_id: string | null
          company_id: string
          role: 'admin' | 'rrhh' | 'manager' | 'employee' | 'viewer'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          employee_id?: string | null
          company_id: string
          role: 'admin' | 'rrhh' | 'manager' | 'employee' | 'viewer'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          employee_id?: string | null
          company_id?: string
          role?: 'admin' | 'rrhh' | 'manager' | 'employee' | 'viewer'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      evaluation_types: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          period: string
          requires_employee_signature: boolean
          requires_manager_signature: boolean
          requires_hr_signature: boolean
          has_scoring: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string | null
          period: string
          requires_employee_signature?: boolean
          requires_manager_signature?: boolean
          requires_hr_signature?: boolean
          has_scoring?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          period?: string
          requires_employee_signature?: boolean
          requires_manager_signature?: boolean
          requires_hr_signature?: boolean
          has_scoring?: boolean
          created_at?: string
        }
      }
      evaluations: {
        Row: {
          id: string
          employee_id: string
          evaluation_type_id: string
          year: number
          status: 'draft' | 'pending_employee' | 'pending_manager' | 'pending_hr' | 'completed' | 'cancelled'
          employee_signed_at: string | null
          employee_signed_by: string | null
          manager_signed_at: string | null
          manager_signed_by: string | null
          hr_signed_at: string | null
          hr_signed_by: string | null
          score: number | null
          comments: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          evaluation_type_id: string
          year: number
          status?: 'draft' | 'pending_employee' | 'pending_manager' | 'pending_hr' | 'completed' | 'cancelled'
          employee_signed_at?: string | null
          employee_signed_by?: string | null
          manager_signed_at?: string | null
          manager_signed_by?: string | null
          hr_signed_at?: string | null
          hr_signed_by?: string | null
          score?: number | null
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          evaluation_type_id?: string
          year?: number
          status?: 'draft' | 'pending_employee' | 'pending_manager' | 'pending_hr' | 'completed' | 'cancelled'
          employee_signed_at?: string | null
          employee_signed_by?: string | null
          manager_signed_at?: string | null
          manager_signed_by?: string | null
          hr_signed_at?: string | null
          hr_signed_by?: string | null
          score?: number | null
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      evaluation_goals: {
        Row: {
          id: string
          evaluation_id: string
          goal_number: number
          description: string
          target: string | null
          weight: number | null
          achieved_result: string | null
          score: number | null
          comments: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          evaluation_id: string
          goal_number: number
          description: string
          target?: string | null
          weight?: number | null
          achieved_result?: string | null
          score?: number | null
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          evaluation_id?: string
          goal_number?: number
          description?: string
          target?: string | null
          weight?: number | null
          achieved_result?: string | null
          score?: number | null
          comments?: string | null
          created_at?: string
          updated_at?: string
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
