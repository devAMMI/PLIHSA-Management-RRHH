import { useState } from 'react';
import { Archive } from 'lucide-react';
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

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [showRegister, setShowRegister] = useState(false);
  const [editingEvaluationId, setEditingEvaluationId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    if (showRegister) {
      return <RegisterForm onBackToLogin={() => setShowRegister(false)} />;
    }
    return <LoginForm onSwitchToRegister={() => setShowRegister(true)} />;
  }

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Dashboard';
      case 'employees':
        return 'Gestión de Empleados';
      case 'evaluaciones-plihsa':
        return 'Evaluaciones Administrativas PLIHSA';
      case 'evaluacion-administrativa-nueva':
        return 'Nueva Evaluación Administrativa';
      case 'evaluations-list':
        return 'Evaluaciones Guardadas';
      case 'nueva-evaluacion-administrativa':
        return 'Nueva Evaluación Administrativa';
      case 'evaluation-admin-enero':
        return 'Evaluación Administrativo - Marzo 2026';
      case 'evaluation-operative-enero':
        return 'Evaluación Operativo - Marzo 2026';
      case 'system-users':
        return 'Usuarios del Sistema';
      case 'reportes':
        return 'Reportes';
      case 'settings':
        return 'Configuración';
      case 'profile':
        return 'Mi Perfil';
      case 'raw-evaluations':
        return 'Evaluaciones Hechas (Raw Data)';
      case 'sql-executor':
        return 'SQL Evaluaciones';
      case 'goal-definition-enero':
        return 'Definición de Metas';
      case 'goal-definitions-list':
        return 'Definiciones de Metas Guardadas';
      case 'evaluacion-junio':
        return 'Revisión de Metas';
      case 'evaluacion-final':
        return 'Evaluación Final';
      case 'audit-log':
        return 'Registro de Actividad';
      default:
        return 'Dashboard';
    }
  };

  const handleEditEvaluation = (evaluationId: string, employeeType: string) => {
    setEditingEvaluationId(evaluationId);
    if (employeeType === 'administrativo') {
      setCurrentView('evaluation-admin-enero');
    } else {
      setCurrentView('evaluation-operative-enero');
    }
  };

  const handleBackToList = () => {
    setEditingEvaluationId(null);
    setCurrentView('evaluations-list');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'employees':
        return <EmployeeList />;
      case 'evaluacion-administrativa-nueva':
        return <EvaluacionAdministrativa />;
      case 'evaluations-list':
        return <EvaluationsList onEditEvaluation={handleEditEvaluation} />;
      case 'nueva-evaluacion-administrativa':
        return <NuevaEvaluacionAdministrativa />;
      case 'evaluation-admin-enero':
        return <AdministrativeEvaluationContainer editingEvaluationId={editingEvaluationId} onBack={handleBackToList} />;
      case 'evaluation-operative-enero':
        return <OperativeEvaluationContainer editingEvaluationId={editingEvaluationId} onBack={handleBackToList} />;
      case 'system-users':
        return <UserList />;
      case 'profile':
        return <UserProfile />;
      case 'raw-evaluations':
        return <RawEvaluations />;
      case 'sql-executor':
        return <SQLExecutor />;
      case 'reportes':
        return <ReportesView />;
      case 'settings':
        return (
          <div className="text-center py-12">
            <p className="text-slate-600">Configuración en desarrollo</p>
          </div>
        );
      case 'goal-definition-enero':
        return <GoalDefinitionsHome />;
      case 'goal-definitions-list':
        return <GoalDefinitionsList />;
      case 'evaluacion-junio':
        return <EvaluacionJunio />;
      case 'audit-log':
        return <EvaluationAuditLog />;
      case 'evaluacion-final':
        return (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Archive className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-700">Evaluación Final</h2>
            <p className="text-slate-500 text-sm text-center max-w-sm">
              Este módulo está en preparación. Aquí se realizará la evaluación final del desempeño.
            </p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={getViewTitle()} />
        <main className={`flex-1 bg-slate-50 ${[
          'employees',
          'evaluation-admin-enero',
          'evaluation-operative-enero',
          'evaluacion-administrativa-nueva',
          'nueva-evaluacion-administrativa',
        ].includes(currentView) ? 'overflow-hidden' : [
          'evaluacion-junio',
          'goal-definition-enero',
        ].includes(currentView) ? 'overflow-y-auto' : ['dashboard', 'audit-log'].includes(currentView) ? 'overflow-y-auto' : 'overflow-y-auto p-8'}`}>
          {renderView()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <AppContent />
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;
