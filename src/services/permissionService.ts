import { supabase } from '../lib/supabase';
import { Permission, UserRole } from '../types/roles';

class PermissionService {
  private permissionsCache: Map<UserRole, Permission[]> = new Map();

  async loadPermissions(): Promise<void> {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('role, permission');

    if (error) {
      console.error('Error loading permissions:', error);
      return;
    }

    this.permissionsCache.clear();
    data?.forEach((item) => {
      const role = item.role as UserRole;
      const permission = item.permission as Permission;

      if (!this.permissionsCache.has(role)) {
        this.permissionsCache.set(role, []);
      }
      this.permissionsCache.get(role)?.push(permission);
    });
  }

  async hasPermission(role: UserRole, permission: Permission): Promise<boolean> {
    if (this.permissionsCache.size === 0) {
      await this.loadPermissions();
    }

    const rolePermissions = this.permissionsCache.get(role);
    return rolePermissions?.includes(permission) ?? false;
  }

  async getUserRole(): Promise<UserRole | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('system_users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return null;
    return data.role as UserRole;
  }

  async canPerform(permission: Permission): Promise<boolean> {
    const role = await this.getUserRole();
    if (!role) return false;
    return this.hasPermission(role, permission);
  }

  getPermissionsForRole(role: UserRole): Permission[] {
    return this.permissionsCache.get(role) ?? [];
  }
}

export const permissionService = new PermissionService();
