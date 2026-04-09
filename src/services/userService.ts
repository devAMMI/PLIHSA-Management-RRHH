import { supabase } from '../lib/supabase';
import { SystemUser, UserRole } from '../types/roles';

const MANAGE_USERS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No hay sesion activa');
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export interface CreateUserData {
  email: string;
  password: string;
  companyId: string;
  employeeId?: string;
  accessibleCompanyIds?: string[];
  role: UserRole;
  isActive: boolean;
}

export interface UpdateUserData {
  employeeId?: string | null;
  role?: UserRole;
  isActive?: boolean;
  companyId?: string;
  accessibleCompanyIds?: string[] | null;
}

class UserService {
  async getUsers(): Promise<SystemUser[]> {
    try {
      const { data, error } = await supabase
        .from('system_users')
        .select(`
          *,
          employee:employees(first_name, last_name, photo_url),
          company:companies(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as SystemUser[];
    } catch (error: any) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async createUser(userData: CreateUserData): Promise<{ success: boolean; error?: string; userId?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesion activa');

      const CREATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin-user`;
      const response = await fetch(CREATE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          companyId: userData.companyId,
          employeeId: userData.employeeId || null,
          accessibleCompanyIds: userData.accessibleCompanyIds?.length ? userData.accessibleCompanyIds : null,
          role: userData.role,
          isActive: userData.isActive,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al crear el usuario');
      return { success: true, userId: result.userId };
    } catch (error: any) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUser(systemUserId: string, updates: UpdateUserData): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.employeeId !== undefined) updateData.employee_id = updates.employeeId;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.companyId !== undefined) updateData.company_id = updates.companyId;
      if (updates.accessibleCompanyIds !== undefined) {
        updateData.accessible_company_ids = updates.accessibleCompanyIds?.length ? updates.accessibleCompanyIds : null;
      }

      const { error } = await supabase
        .from('system_users')
        .update(updateData)
        .eq('id', systemUserId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(MANAGE_USERS_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'delete_user', userId }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al eliminar el usuario');
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  }

  async resetPassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(MANAGE_USERS_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'reset_password', userId, newPassword }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al cambiar la contrasena');
      return { success: true };
    } catch (error: any) {
      console.error('Error resetting password:', error);
      return { success: false, error: error.message };
    }
  }

  async changeOwnPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Usuario no autenticado');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) throw new Error('Contrasena actual incorrecta');

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error changing password:', error);
      return { success: false, error: error.message };
    }
  }

  async toggleUserStatus(systemUserId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    return this.updateUser(systemUserId, { isActive });
  }
}

export const userService = new UserService();
