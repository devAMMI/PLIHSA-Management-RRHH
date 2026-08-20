import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { FinalEvaluationContainer } from './components/evaluations/FinalEvaluationContainer';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { EmployeeList } from './components/employees/EmployeeList';
import { UserProfile } from './components/profile/UserProfile';
import { UserList } from './components/users/UserList';
import { AdministrativeEvaluationContainer } from './components/evaluations/AdministrativeEvaluationContainer';
import { OperativeEvaluationContainer } from './components/evaluations/OperativeEvaluationContainer';
import { EvaluationsList } from './components/evaluations/EvaluationsList';
import { NewEvaluationsPLIHSA } from './components/evaluations/NewEvaluationsPLIHSA';
import NuevaEvaluacionAdministrativa from './components/evaluations/NuevaEvaluacionAdministrativa';
import EvaluacionAdministrativa from './components/evaluations/EvaluacionAdministrativa';
import { RawEvaluations } from './components/debug/RawEvaluations';
import { SQLExecutor } from './components/debug/SQLExecutor';
import { GoalDefinitionsHome } from './components/goals/GoalDefinitionsHome';
import { GoalDefinitionsList } from './components/goals/GoalDefinitionsList';
import { EvaluacionJunio } from './components/evaluations/EvaluacionJunio';
import { EvaluationAuditLog } from './components/audit/EvaluationAuditLog';
import { ReportesView } from './components/reports/ReportesView';

const ROUTE_TITLES: Record<string, string> = {
  '/plihsa/empresa/Dashboard': 'Dashboard',
  '/plihsa/empresa/Empleados': 'Gestión de Empleados',
  '/plihsa/empresa/1_Definicionmetas': 'Definición de Metas',
  '/plihsa/empresa/2_Revisionmetas': 'Revisión de Metas',
  '/plihsa/empresa/3_Evaluacionfinal': 'Evaluación Final',
  '/plihsa/empresa/Evaluaciones': 'Evaluaciones Guardadas',
  '/plihsa/empresa/Evaluacion-admin': 'Evaluación Administrativa',
  '/plihsa/empresa/Evaluacion-operativa': 'Evaluación Operativa',
  '/plihsa/empresa/Usuarios': 'Usuarios del Sistema',
  '/plihsa/empresa/Reportes': 'Reportes',
  '/plihsa/empresa/Configuracion': 'Configuración',
  '/plihsa/empresa/Perfil': 'Mi Perfil',
  '/plihsa/empresa/Datos-raw': 'Evaluaciones Hechas (Raw Data)',
  '/plihsa/empresa/SQL': 'SQL Evaluaciones',
  '/plihsa/empresa/Registro-actividad': 'Registro de Actividad',
};

function getCurrentTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  if (pathname.includes('/evaluaciones/editar/')) return 'Editar Evaluación';
  return 'Dashboard';
}

function AppContent() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const showRegister = location.pathname === '/registro';

  useEffect(() => {
    if (!user && location.pathname !== '/registro' && !location.pathname.startsWith('/plihsa')) {
      navigate('/', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    if (showRegister) {
      return <RegisterForm onBackToLogin={() => navigate('/')} />;
    }
    return <LoginForm onSwitchToRegister={() => navigate('/registro')} />;
  }

  const handleViewChange = (view: string) => {
    const routeMap: Record<string, string> = {
      'dashboard': '/plihsa/empresa/Dashboard',
      'employees': '/plihsa/empresa/Empleados',
      'goal-definition-enero': '/plihsa/empresa/1_Definicionmetas',
      'evaluacion-junio': '/plihsa/empresa/2_Revisionmetas',
      'evaluacion-final': '/plihsa/empresa/3_Evaluacionfinal',
      'evaluations-list': '/plihsa/empresa/Evaluaciones',
      'evaluation-admin-enero': '/plihsa/empresa/Evaluacion-admin',
      'evaluation-operative-enero': '/plihsa/empresa/Evaluacion-operativa',
      'system-users': '/plihsa/empresa/Usuarios',
      'reportes': '/plihsa/empresa/Reportes',
      'settings': '/plihsa/empresa/Configuracion',
      'profile': '/plihsa/empresa/Perfil',
      'raw-evaluations': '/plihsa/empresa/Datos-raw',
      'sql-executor': '/plihsa/empresa/SQL',
      'audit-log': '/plihsa/empresa/Registro-actividad',
    };
    const route = routeMap[view] || '/plihsa/empresa/Dashboard';
    navigate(route);
  };

  const currentPath = location.pathname;
  const currentViewKey = Object.entries({
    'dashboard': currentPath === '/plihsa/empresa/Dashboard',
    'employees': currentPath === '/plihsa/empresa/Empleados',
    'goal-definition-enero': currentPath === '/plihsa/empresa/1_Definicionmetas',
    'evaluacion-junio': currentPath === '/plihsa/empresa/2_Revisionmetas',
    'evaluacion-final': currentPath === '/plihsa/empresa/3_Evaluacionfinal',
    'evaluations-list': currentPath === '/plihsa/empresa/Evaluaciones',
    'evaluation-admin-enero': currentPath.startsWith('/plihsa/empresa/Evaluacion-admin'),
    'evaluation-operative-enero': currentPath.startsWith('/plihsa/empresa/Evaluacion-operativa'),
    'system-users': currentPath === '/plihsa/empresa/Usuarios',
    'reportes': currentPath === '/plihsa/empresa/Reportes',
    'settings': currentPath === '/plihsa/empresa/Configuracion',
    'profile': currentPath === '/plihsa/empresa/Perfil',
    'raw-evaluations': currentPath === '/plihsa/empresa/Datos-raw',
    'sql-executor': currentPath === '/plihsa/empresa/SQL',
    'audit-log': currentPath === '/plihsa/empresa/Registro-actividad',
  }).find(([, v]) => v)?.[0] || 'dashboard';

  const editingEvaluationId = location.pathname.match(/\/(Evaluacion-admin|Evaluacion-operativa)\/editar\/([^/]+)/)?.[2] || null;

  const handleEditEvaluation = (evaluationId: string, employeeType: string) => {
    const route = employeeType === 'administrativo'
      ? `/plihsa/empresa/Evaluacion-admin/editar/${evaluationId}`
      : `/plihsa/empresa/Evaluacion-operativa/editar/${evaluationId}`;
    navigate(route);
  };

  const handleBackToList = () => {
    navigate('/plihsa/empresa/Evaluaciones');
  };

  const overflowClass = ['employees', 'evaluation-admin-enero', 'evaluation-operative-enero'].includes(currentViewKey)
    ? 'overflow-hidden'
    : 'overflow-y-auto';

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar currentView={currentViewKey} onViewChange={handleViewChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={getCurrentTitle(currentPath)} />
        <main className={`flex-1 bg-slate-50 ${overflowClass}`}>
          <Routes>
            <Route path="/plihsa/empresa/Dashboard" element={<Dashboard />} />
            <Route path="/plihsa/empresa/Empleados" element={<EmployeeList />} />
            <Route path="/plihsa/empresa/1_Definicionmetas" element={<GoalDefinitionsHome />} />
            <Route path="/plihsa/empresa/2_Revisionmetas" element={<EvaluacionJunio />} />
            <Route path="/plihsa/empresa/3_Evaluacionfinal" element={<FinalEvaluationContainer />} />
            <Route path="/plihsa/empresa/Evaluaciones" element={<EvaluationsList onEditEvaluation={handleEditEvaluation} />} />
            <Route path="/plihsa/empresa/Evaluacion-admin" element={<AdministrativeEvaluationContainer editingEvaluationId={editingEvaluationId} onBack={handleBackToList} />} />
            <Route path="/plihsa/empresa/Evaluacion-admin/editar/:evalId" element={<AdministrativeEvaluationContainer editingEvaluationId={editingEvaluationId} onBack={handleBackToList} />} />
            <Route path="/plihsa/empresa/Evaluacion-operativa" element={<OperativeEvaluationContainer editingEvaluationId={editingEvaluationId} onBack={handleBackToList} />} />
            <Route path="/plihsa/empresa/Evaluacion-operativa/editar/:evalId" element={<OperativeEvaluationContainer editingEvaluationId={editingEvaluationId} onBack={handleBackToList} />} />
            <Route path="/plihsa/empresa/Usuarios" element={<UserList />} />
            <Route path="/plihsa/empresa/Reportes" element={<ReportesView />} />
            <Route path="/plihsa/empresa/Configuracion" element={<div className="text-center py-12"><p className="text-slate-600">Configuración en desarrollo</p></div>} />
            <Route path="/plihsa/empresa/Perfil" element={<UserProfile />} />
            <Route path="/plihsa/empresa/Datos-raw" element={<RawEvaluations />} />
            <Route path="/plihsa/empresa/SQL" element={<SQLExecutor />} />
            <Route path="/plihsa/empresa/Registro-actividad" element={<EvaluationAuditLog />} />
            <Route path="*" element={<Navigate to="/plihsa/empresa/Dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* WhatsApp IT Support Button */}
      <a
        href="https://api.whatsapp.com/send?phone=50488196106&text=Hola%20Kenneth%2C%20solicito%20apoyo%20con%20la%20plataforma%20del%20sistema%20de%20evaluacion%20de%20desempe%C3%B1o%20de%20PLIHSA."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 group flex items-center gap-3"
        title="Chat Support - Soporte IT"
      >
        <span className="hidden group-hover:flex items-center bg-white text-slate-700 text-sm font-medium px-3 py-2 rounded-xl shadow-lg border border-slate-200 whitespace-nowrap transition-all duration-200">
          <span className="font-semibold text-slate-800">Kenneth</span>
          <span className="mx-1.5 text-slate-400">·</span>
          <span className="text-slate-500">Soporte IT</span>
        </span>
        <div className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center"
          style={{ background: 'linear-gradient(180deg, #57d163 0%, #23b33a 100%)' }}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
            alt="WhatsApp Soporte IT"
            className="w-9 h-9"
          />
        </div>
      </a>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;
