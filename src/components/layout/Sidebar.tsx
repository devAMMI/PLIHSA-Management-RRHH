import { Home, Users, ClipboardCheck, BarChart2, Settings, LogOut, User as UserIcon, Shield, FileText, Database, Terminal, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { signOut, systemUser, employee, user } = useAuth();
  const { activeCompany } = useCompany();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'employees', label: 'Empleados', icon: Users },
    { id: 'goal-definition-enero', label: 'Definición de Metas', icon: null, phaseNumber: 1, requiredRoles: ['superadmin', 'admin', 'rrhh', 'manager', 'jefe'] },
    { id: 'evaluacion-junio', label: 'Revisión de Metas', icon: null, phaseNumber: 2, requiredRoles: ['superadmin', 'admin', 'rrhh', 'manager', 'jefe'] },
    { id: 'evaluacion-final', label: 'Evaluación Final', icon: null, phaseNumber: 3, requiredRoles: ['superadmin', 'admin', 'rrhh', 'manager', 'jefe'] },
    { id: 'evaluacion-administrativa-nueva', label: 'Nueva Evaluación Admin', icon: ClipboardCheck, requiredRoles: ['superadmin', 'rrhh'] },
    { id: 'evaluations-list', label: 'Ver Evaluaciones', icon: FileText, requiredRoles: ['superadmin', 'rrhh'] },
    { id: 'nueva-evaluacion-administrativa', label: 'Nueva Evaluación Completa', icon: ClipboardCheck, requiredRoles: ['superadmin', 'rrhh'] },
    { id: 'system-users', label: 'Usuarios', icon: Shield, requiredRoles: ['superadmin', 'admin'] },
    { id: 'reportes', label: 'Reportes', icon: BarChart2, requiredRoles: ['superadmin'] },
    { id: 'settings', label: 'Configuración', icon: Settings, requiredRoles: ['superadmin'] },
    { id: 'raw-evaluations', label: 'Evaluaciones Hechas', icon: Database, requiredRoles: ['superadmin'] },
    { id: 'sql-executor', label: 'SQL Evaluaciones', icon: Terminal, requiredRoles: ['superadmin'] },
    { id: 'audit-log', label: 'Registro de Actividad', icon: Activity, requiredRoles: ['superadmin', 'rrhh'] },
  ];

  const filteredItems = menuItems.filter(item => {
    if (!item.requiredRoles) return true;
    return item.requiredRoles.includes(systemUser?.role || '');
  });

  const getBrandingConfig = () => {
    const companyCode = activeCompany?.code?.toLowerCase();

    if (companyCode === 'plihsa') {
      return {
        logo: '/LOGO_PLIHSA_AZUL_(1).png',
        name: 'PLIHSA',
        fullName: 'Plásticos Industriales Hondureños SA',
        subtitle: 'Sistema de Gestión de RRHH',
        primaryColor: 'blue',
      };
    }

    return {
      logo: null,
      name: 'AMMI RRHH',
      fullName: null,
      subtitle: 'Sistema de Gestión de RRHH',
      primaryColor: 'blue',
    };
  };

  const branding = getBrandingConfig();

  return (
    <div className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 flex flex-col h-screen shadow-xl">
      <div className="px-6 py-6 h-[104px] flex items-center justify-center border-b border-slate-700/50">
        {branding.logo ? (
          <div className="flex flex-col items-center">
            <img
              src={branding.logo}
              alt={branding.name}
              className="h-14 w-auto object-contain mb-2"
            />
            {branding.fullName && (
              <p className="text-[10px] font-semibold text-white text-center mb-0.5 leading-tight">
                Plásticos Industriales<br />Hondureños SA
              </p>
            )}
            <p className="text-[9px] text-slate-400 text-center">{branding.subtitle}</p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-white">{branding.name}</h1>
            <p className="text-sm text-slate-400 mt-1">{branding.subtitle}</p>
          </>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isPhase = 'phaseNumber' in item && item.phaseNumber != null;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              {isPhase ? (
                <div className="relative w-5 h-5 flex-shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="8" y="2" width="8" height="3" rx="1" ry="1"/>
                    <path d="M16 2h2a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                  <span className={`absolute -bottom-1.5 -right-1.5 text-[8px] font-bold leading-none w-3.5 h-3.5 rounded-full flex items-center justify-center ${isActive ? 'bg-white text-blue-600' : 'bg-slate-600 text-slate-200'}`}>
                    {(item as any).phaseNumber}
                  </span>
                </div>
              ) : Icon ? (
                <Icon className="w-5 h-5 flex-shrink-0" />
              ) : null}
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        <button
          onClick={() => onViewChange('profile')}
          className={`w-full mb-3 px-3 py-3 rounded-lg transition-all duration-200 ${
            currentView === 'profile'
              ? 'bg-slate-700 shadow-lg'
              : 'bg-slate-800/50 hover:bg-slate-700/50'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              {employee?.photo_url ? (
                <img
                  src={employee.photo_url}
                  alt={`${employee.first_name} ${employee.last_name}`}
                  className="w-10 h-10 rounded-full object-cover border-2 border-slate-600 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600 shadow-sm">
                  <UserIcon className="w-5 h-5 text-slate-300" />
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-800"></div>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-white truncate">
                {employee ? `${employee.first_name} ${employee.last_name}` : user?.email?.split('@')[0] || 'Usuario'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {employee?.position || 'Sin cargo asignado'}
              </p>
            </div>
          </div>
          <div className="px-2 py-1 bg-blue-600/20 border border-blue-500/30 rounded text-xs font-medium text-blue-300 text-center">
            {systemUser?.role === 'superadmin' && 'Superadministrador'}
            {systemUser?.role === 'admin' && 'Administrador'}
            {systemUser?.role === 'rrhh' && 'Recursos Humanos'}
            {systemUser?.role === 'manager' && 'Gerente'}
            {systemUser?.role === 'jefe' && 'Jefe'}
            {systemUser?.role === 'employee' && 'Empleado'}
            {systemUser?.role === 'viewer' && 'Visor'}
          </div>
        </button>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-red-600/20 hover:text-red-400 rounded-lg transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
