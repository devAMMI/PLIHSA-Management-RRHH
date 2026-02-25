import { supabase } from '../lib/supabase';
import { SystemUser, UserRole } from '../types/roles';

export interface CreateUserData {
  email: string;
  password: string;
  companyId: string;
  employeeId?: string;
  role: UserRole;
  isActive: boolean;
}

export interface UpdateUserData {
  employeeId?: string;
  role?: UserRole;
  isActive?: boolean;
}

class UserService {
  async getUsers(companyId?: string): Promise<SystemUser[]> {
    let query = supabase
      .from('system_users')
      .select(`
        *,
        employee:employees(first_name, last_name, photo_url),
        company:companies(name)
      `);

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    const { data: authUsers } = await supabase.auth.admin.listUsers();

    return (data || []).map(user => {
      const authUser = authUsers?.users.find(u => u.id === user.user_id);
      return {
        ...user,
        email: authUser?.email
      };
    });
  }

  async createUser(userData: CreateUserData): Promise<{ success: boolean; error?: string; userId?: string }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: undefined,
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      const { error: userError } = await supabase
        .from('system_users')
        .insert({
          user_id: authData.user.id,
          company_id: userData.companyId,
          employee_id: userData.employeeId || null,
          role: userData.role,
          is_active: userData.isActive
        });

      if (userError) throw userError;

      return { success: true, userId: authData.user.id };
    } catch (error: any) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUser(userId: string, updates: UpdateUserData): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('system_users')
        .update({
          employee_id: updates.employeeId,
          role: updates.role,
          is_active: updates.isActive,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error: userError } = await supabase
        .from('system_users')
        .delete()
        .eq('user_id', userId);

      if (userError) throw userError;

      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        console.warn('Could not delete auth user:', authError);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  }

  async resetPassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) throw error;

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
        password: currentPassword
      });

      if (signInError) throw new Error('Contraseña actual incorrecta');

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error changing password:', error);
      return { success: false, error: error.message };
    }
  }

  async toggleUserStatus(userId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    return this.updateUser(userId, { isActive });
  }
}

export const userService = new UserService();
