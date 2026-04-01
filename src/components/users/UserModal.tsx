import { useState, useEffect } from 'react';
import { X, Save, User, Mail, Shield, Building2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { UserRole, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_HIERARCHY } from '../../types/roles';
import { permissionService } from '../../services/permissionService';

interface SystemUser {
  id: string;
  user_id: string;
  employee_id: string | null;
  company_id: string;
  role: string;
  is_active: boolean;
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
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    employee_id: '',
    company_id: '',
    role: 'employee' as UserRole,
    is_active: true,
  });

  useEffect(() => {
    loadEmployees();
    loadCompanies();
    loadUserRole();

    if (user) {
      setFormData({
        email: '',
        password: '',
        employee_id: user.employee_id || '',
        company_id: user.company_id,
        role: user.role as UserRole,
        is_active: user.is_active,
      });
    }
  }, [user]);

  const loadUserRole = async () => {
    const role = await permissionService.getUserRole();
    setUserRole(role);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (user) {
        // Actualizar usuario existente
        const { error: updateError } = await supabase
          .from('system_users')
          .update({
            employee_id: formData.employee_id || null,
            company_id: formData.company_id,
            role: formData.role,
            is_active: formData.is_active,
          })
          .eq('id', user.id);

        if (updateError) throw updateError;
      } else {
        // Crear nuevo usuario
        if (!formData.email || !formData.password) {
          throw new Error('Email y contraseña son requeridos');
        }

        if (formData.password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        // Obtener la sesión actual para autenticación
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No hay sesión activa');
        }

        // Llamar a la Edge Function para crear el usuario
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin-user`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            companyId: formData.company_id,
            employeeId: formData.employee_id || null,
            role: formData.role,
            isActive: formData.is_active,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Error al crear el usuario');
        }
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error saving user:', err);
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
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {!user && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Building2 className="w-4 h-4 inline mr-2" />
              Empresa *
            </label>
            <select
              value={formData.company_id}
              onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Empleado (Opcional)
            </label>
            <select
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sin empleado vinculado</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name} - {employee.employee_code}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Vincular con un empleado existente para heredar datos personales
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Shield className="w-4 h-4 inline mr-2" />
              Rol *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {Object.entries(ROLE_LABELS).map(([roleKey, roleLabel]) => {
                const role = roleKey as UserRole;
                const currentUserLevel = userRole ? ROLE_HIERARCHY[userRole] : 0;
                const roleLevel = ROLE_HIERARCHY[role];

                // Only show roles that are lower than the current user's role
                if (roleLevel < currentUserLevel) {
                  return (
                    <option key={role} value={role}>
                      {roleLabel}
                    </option>
                  );
                }
                return null;
              })}
            </select>
            <div className="mt-2 text-xs text-slate-600 space-y-1">
              {Object.entries(ROLE_DESCRIPTIONS).map(([roleKey, desc]) => {
                const role = roleKey as UserRole;
                const currentUserLevel = userRole ? ROLE_HIERARCHY[userRole] : 0;
                const roleLevel = ROLE_HIERARCHY[role];

                // Only show descriptions for roles the user can assign
                if (roleLevel < currentUserLevel) {
                  return (
                    <div key={role}>
                      <strong>{ROLE_LABELS[role]}:</strong> {desc}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
              Usuario activo
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : user ? 'Actualizar Usuario' : 'Crear Usuario'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
