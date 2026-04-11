import { useState, useEffect } from 'react';
import { X, Save, User, Mail, Shield, Building2, AlertCircle, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { UserRole, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_HIERARCHY } from '../../types/roles';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';

interface SystemUser {
  id: string;
  user_id: string;
  employee_id: string | null;
  company_id: string;
  role: string;
  is_active: boolean;
  email?: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  employee_code: string;
}

interface Company {
  id: string;
  name: string;
  code: string;
}

interface UserModalProps {
  user: SystemUser | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserModal({ user, onClose, onSuccess }: UserModalProps) {
  const { systemUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = systemUser?.role === 'superadmin';
  const isEditingSelf = !!user && user.user_id === systemUser?.user_id;
  const myLevel = systemUser ? ROLE_HIERARCHY[systemUser.role] : 0;

  const [formData, setFormData] = useState({
    email: '',
    password: 'Temporal2026',
    employee_id: '',
    company_id: '',
    accessible_company_ids: [] as string[],
    role: 'employee' as UserRole,
    is_active: true,
  });

  useEffect(() => {
    loadEmployees();
    loadCompanies();
    if (user) loadUserData(user);
  }, [user]);

  const loadUserData = async (userData: SystemUser) => {
    const { data } = await supabase
      .from('system_users')
      .select('accessible_company_ids')
      .eq('id', userData.id)
      .single();

    setFormData({
      email: userData.email || '',
      password: '',
      employee_id: userData.employee_id || '',
      company_id: userData.company_id,
      accessible_company_ids: data?.accessible_company_ids || [],
      role: userData.role as UserRole,
      is_active: userData.is_active,
    });
  };

  const loadEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email, employee_code')
      .order('first_name');
    setEmployees(data || []);
  };

  const loadCompanies = async () => {
    const { data } = await supabase
      .from('companies')
      .select('id, name, code')
      .order('name');
    setCompanies(data || []);
  };

  const availableRoles = Object.entries(ROLE_LABELS).filter(([roleKey]) => {
    const role = roleKey as UserRole;
    if (isSuperAdmin) return true;
    if (systemUser?.role === 'admin') return role !== 'superadmin';
    const roleLevel = ROLE_HIERARCHY[role];
    return roleLevel < myLevel;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.company_id) throw new Error('Selecciona una empresa principal');
      if (!formData.role) throw new Error('Selecciona un rol');

      if (user) {
        const result = await userService.updateUser(user.id, {
          employeeId: formData.employee_id || null,
          companyId: formData.company_id,
          accessibleCompanyIds: formData.accessible_company_ids,
          role: formData.role,
          isActive: formData.is_active,
        });
        if (!result.success) throw new Error(result.error || 'Error al actualizar usuario');
      } else {
        if (!formData.email) throw new Error('El email es requerido');
        if (!formData.password) throw new Error('La contrasena es requerida');
        if (formData.password.length < 6) throw new Error('La contrasena debe tener al menos 6 caracteres');

        const result = await userService.createUser({
          email: formData.email,
          password: formData.password,
          companyId: formData.company_id,
          employeeId: formData.employee_id || undefined,
          accessibleCompanyIds: formData.accessible_company_ids,
          role: formData.role,
          isActive: formData.is_active,
        });
        if (!result.success) throw new Error(result.error || 'Error desconocido al crear usuario');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {!user && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <Mail className="w-4 h-4 inline mr-1.5" />
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                  placeholder="usuario@plihsa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <Lock className="w-4 h-4 inline mr-1.5" />
                  Contrasena *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                  minLength={6}
                  placeholder="Temporal2026"
                />
              </div>
            </div>
          )}

          {user && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-xs text-slate-500 mb-0.5">Email del usuario</div>
              <div className="text-sm font-medium text-slate-700">{formData.email || '—'}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Building2 className="w-4 h-4 inline mr-1.5" />
                Empresa Principal *
              </label>
              <select
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                required
              >
                <option value="">Seleccionar empresa</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({company.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Shield className="w-4 h-4 inline mr-1.5" />
                Rol *
              </label>
              {isEditingSelf ? (
                <div className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-600">
                  {ROLE_LABELS[formData.role]}
                  <p className="mt-1 text-xs text-slate-400">No puedes cambiar tu propio rol</p>
                </div>
              ) : (
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                >
                  {availableRoles.map(([roleKey, roleLabel]) => (
                    <option key={roleKey} value={roleKey}>{roleLabel}</option>
                  ))}
                </select>
              )}
              {!isEditingSelf && formData.role && ROLE_DESCRIPTIONS[formData.role] && (
                <p className="mt-1 text-xs text-slate-500">{ROLE_DESCRIPTIONS[formData.role]}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Building2 className="w-4 h-4 inline mr-1.5" />
              Empresas Adicionales Accesibles
            </label>
            <div className="border border-slate-300 rounded-lg p-3 space-y-1.5 max-h-36 overflow-y-auto">
              {companies
                .filter(c => c.id !== formData.company_id)
                .map((company) => (
                  <label key={company.id} className="flex items-center gap-2 hover:bg-slate-50 px-2 py-1.5 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.accessible_company_ids.includes(company.id)}
                      onChange={(e) => {
                        const ids = e.target.checked
                          ? [...formData.accessible_company_ids, company.id]
                          : formData.accessible_company_ids.filter(id => id !== company.id);
                        setFormData({ ...formData, accessible_company_ids: ids });
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-slate-700">{company.name} ({company.code})</span>
                  </label>
                ))}
              {companies.filter(c => c.id !== formData.company_id).length === 0 && (
                <p className="text-xs text-slate-400 px-2">Selecciona una empresa principal primero</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <User className="w-4 h-4 inline mr-1.5" />
              Empleado Vinculado (Opcional)
            </label>
            <select
              value={formData.employee_id}
              onChange={(e) => {
                const emp = employees.find(em => em.id === e.target.value);
                setFormData({
                  ...formData,
                  employee_id: e.target.value,
                  email: !user && emp ? emp.email : formData.email,
                });
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Sin empleado vinculado</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} — {emp.employee_code}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Vincula con un empleado para mostrar su nombre y foto en el sistema
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-slate-700 cursor-pointer">
              Usuario activo — puede iniciar sesion en el sistema
            </label>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : user ? 'Actualizar Usuario' : 'Crear Usuario'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
