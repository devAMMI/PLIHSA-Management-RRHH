export type UserRole = 'superadmin' | 'admin' | 'rrhh' | 'manager' | 'jefe' | 'employee' | 'viewer';

export type Permission =
  | 'users.create'
  | 'users.read'
  | 'users.update'
  | 'users.delete'
  | 'users.change_role'
  | 'users.reset_password'
  | 'employees.create'
  | 'employees.read'
  | 'employees.update'
  | 'employees.delete'
  | 'companies.create'
  | 'companies.read'
  | 'companies.update'
  | 'companies.delete'
  | 'departments.manage'
  | 'departments.read'
  | 'system.configure';

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

export interface SystemUser {
  id: string;
  user_id: string;
  employee_id?: string;
  company_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  email?: string;
  employee?: {
    first_name: string;
    last_name: string;
    photo_url?: string;
  };
  company?: {
    name: string;
  };
}

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Super Administrador',
  admin: 'Administrador',
  rrhh: 'Recursos Humanos',
  manager: 'Gerente',
  jefe: 'Jefe',
  employee: 'Empleado',
  viewer: 'Visitante'
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  superadmin: 'Acceso total al sistema. Puede gestionar todo incluyendo usuarios y configuraciones.',
  admin: 'Administrador de empresa. Acceso completo a su empresa.',
  rrhh: 'Recursos Humanos. Gestión completa de empleados.',
  manager: 'Gerente. Acceso a sus empleados directos bajo su cargo.',
  jefe: 'Jefe de área. Acceso a sus empleados directos bajo su cargo.',
  employee: 'Empleado. Acceso de solo lectura.',
  viewer: 'Visitante. Acceso muy limitado.'
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  superadmin: 6,
  admin: 5,
  rrhh: 4,
  manager: 3,
  jefe: 3,
  employee: 2,
  viewer: 1
};

export function canManageUser(currentUserRole: UserRole, targetUserRole: UserRole): boolean {
  if (currentUserRole === 'superadmin') return true;
  if (currentUserRole === 'admin') return targetUserRole !== 'superadmin';
  const currentLevel = ROLE_HIERARCHY[currentUserRole];
  const targetLevel = ROLE_HIERARCHY[targetUserRole];
  return currentLevel > targetLevel;
}

export function canSeeUser(viewerRole: UserRole, targetUserRole: UserRole, isSelf: boolean): boolean {
  if (isSelf) return true;
  if (viewerRole === 'superadmin') return true;
  if (viewerRole === 'admin') return targetUserRole !== 'superadmin';
  const viewerLevel = ROLE_HIERARCHY[viewerRole];
  const targetLevel = ROLE_HIERARCHY[targetUserRole];
  return targetLevel < viewerLevel;
}
