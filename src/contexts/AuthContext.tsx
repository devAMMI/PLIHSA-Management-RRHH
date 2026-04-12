import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface SystemUser {
  id: string;
  user_id: string;
  employee_id: string | null;
  company_id: string;
  role: 'superadmin' | 'admin' | 'rrhh' | 'manager' | 'jefe' | 'employee' | 'viewer';
  is_active: boolean;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  position: string;
  email: string | null;
  work_location?: {
    id: string;
    name: string;
    city: string;
    code: string;
  } | null;
}

export interface SidebarPermission {
  menu_item_id: string;
  granted: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  systemUser: SystemUser | null;
  employee: Employee | null;
  sidebarPermissions: SidebarPermission[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  reloadSidebarPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function loadSidebarPerms(systemUserId: string): Promise<SidebarPermission[]> {
  try {
    const { data } = await supabase
      .from('user_sidebar_permissions' as any)
      .select('menu_item_id, granted')
      .eq('system_user_id', systemUserId);
    return (data as SidebarPermission[]) || [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [systemUser, setSystemUser] = useState<SystemUser | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [sidebarPermissions, setSidebarPermissions] = useState<SidebarPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data: systemUserData } = await supabase
            .from('system_users')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

          setSystemUser(systemUserData);

          if (systemUserData?.id) {
            const perms = await loadSidebarPerms(systemUserData.id);
            setSidebarPermissions(perms);
          }

          if (systemUserData?.employee_id) {
            const { data: employeeData } = await supabase
              .from('employees')
              .select('id, first_name, last_name, photo_url, position, email, work_location:work_locations(id, name, city, code)')
              .eq('id', systemUserData.employee_id)
              .maybeSingle();

            setEmployee(employeeData);
          }
        }

        setLoading(false);
      })();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data: systemUserData } = await supabase
            .from('system_users')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

          setSystemUser(systemUserData);

          if (systemUserData?.id) {
            const perms = await loadSidebarPerms(systemUserData.id);
            setSidebarPermissions(perms);
          }

          if (systemUserData?.employee_id) {
            const { data: employeeData } = await supabase
              .from('employees')
              .select('id, first_name, last_name, photo_url, position, email, work_location:work_locations(id, name, city, code)')
              .eq('id', systemUserData.employee_id)
              .maybeSingle();

            setEmployee(employeeData);
          } else {
            setEmployee(null);
          }
        } else {
          setSystemUser(null);
          setEmployee(null);
          setSidebarPermissions([]);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const reloadSidebarPermissions = async () => {
    if (!systemUser?.id) return;
    const perms = await loadSidebarPerms(systemUser.id);
    setSidebarPermissions(perms);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSystemUser(null);
    setEmployee(null);
    setSidebarPermissions([]);
  };

  const value = {
    user,
    session,
    systemUser,
    employee,
    sidebarPermissions,
    loading,
    signIn,
    signUp,
    signOut,
    reloadSidebarPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
