import { Home, Users, ClipboardCheck, Building2, Settings, LogOut, User as UserIcon, Shield, FileText, Database, Terminal, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { signOut, systemUser, employee, user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'employees', label: 'Empleados', icon: Users },
    { id: 'new-evaluations-plihsa', label: 'Evaluaciones PLIHSA', icon: BarChart3 },
    { id: 'evaluations-list', label: 'Ver Evaluaciones', icon: FileText },
    { id: 'evaluation-admin-enero', label: 'Nueva Evaluación Admin', icon: ClipboardCheck },
    { id: 'evaluation-operative-enero', label: 'Nueva Evaluación Operativa', icon: ClipboardCheck },
    { id: 'system-users', label: 'Usuarios', icon: Shield, requiredRoles: ['superadmin', 'admin'] },
    { id: 'companies', label: 'Empresas', icon: Building2, requiredRoles: ['superadmin'] },
    { id: 'settings', label: 'Configuración', icon: Settings, requiredRoles: ['superadmin'] },
    { id: 'raw-evaluations', label: 'Evaluaciones Hechas', icon: Database, requiredRoles: ['superadmin'] },
    { id: 'sql-executor', label: 'SQL Evaluaciones', icon: Terminal, requiredRoles: ['superadmin'] },
  ];

  const filteredItems = menuItems.filter(item => {
    if (!item.requiredRoles) return true;
    return item.requiredRoles.includes(systemUser?.role || '');
  });

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-800">AMMI RRHH</h1>
        <p className="text-sm text-slate-500 mt-1">Sistema de Gestión</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button
          onClick={() => onViewChange('profile')}
          className={`w-full mb-3 px-3 py-3 rounded-lg transition hover:bg-slate-100 ${
            currentView === 'profile' ? 'bg-blue-50' : 'bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              {employee?.photo_url ? (
                <img
                  src={employee.photo_url}
                  alt={`${employee.first_name} ${employee.last_name}`}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm">
                  <UserIcon className="w-5 h-5 text-blue-600" />
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {employee ? `${employee.first_name} ${employee.last_name}` : user?.email?.split('@')[0] || 'Usuario'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {employee?.position || 'Sin cargo asignado'}
              </p>
            </div>
          </div>
          <div className="px-2 py-1 bg-blue-100 rounded text-xs font-medium text-blue-700 text-center">
            {systemUser?.role === 'superadmin' && 'Superadministrador'}
            {systemUser?.role === 'admin' && 'Administrador'}
            {systemUser?.role === 'rrhh' && 'Recursos Humanos'}
            {systemUser?.role === 'manager' && 'Manager'}
            {systemUser?.role === 'employee' && 'Empleado'}
            {systemUser?.role === 'viewer' && 'Visor'}
          </div>
        </button>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
