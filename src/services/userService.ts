import { supabase } from '../lib/supabase';
import { SystemUser, UserRole } from '../types/roles';

const MANAGE_USERS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No hay sesion activa. Por favor recarga la pagina.');
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

async function callManageUsers(body: Record<string, any>): Promise<{ success: boolean; error?: string; [key: string]: any }> {
  const headers = await getAuthHeaders();
  const response = await fetch(MANAGE_USERS_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  let result: any;
  try {
    result = await response.json();
  } catch {
    throw new Error('Respuesta invalida del servidor (no es JSON). Status: ' + response.status);
  }

  if (!response.ok || result.error) {
    throw new Error(result.error || 'Error del servidor: ' + response.status);
  }

  return result;
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
  email?: string;
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
      if (!session) throw new Error('No hay sesion activa. Por favor recarga la pagina.');

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
      const updatesPayload: Record<string, any> = {};
      if (updates.employeeId !== undefined) updatesPayload.employee_id = updates.employeeId;
      if (updates.role !== undefined) updatesPayload.role = updates.role;
      if (updates.isActive !== undefined) updatesPayload.is_active = updates.isActive;
      if (updates.companyId !== undefined) updatesPayload.company_id = updates.companyId;
      if (updates.email !== undefined) updatesPayload.email = updates.email;
      if (updates.accessibleCompanyIds !== undefined) {
        updatesPayload.accessible_company_ids = updates.accessibleCompanyIds?.length
          ? updates.accessibleCompanyIds
          : null;
      }

      await callManageUsers({ action: 'update_user', systemUserId, updates: updatesPayload });
      return { success: true };
    } catch (error: any) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await callManageUsers({ action: 'delete_user', userId });
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  }

  async resetPassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      await callManageUsers({ action: 'reset_password', userId, newPassword });
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
