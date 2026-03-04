import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
import { RawEvaluations } from './components/debug/RawEvaluations';
import { SQLExecutor } from './components/debug/SQLExecutor';

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
      case 'evaluations-list':
        return 'Evaluaciones Guardadas';
      case 'new-evaluations-plihsa':
        return 'Evaluaciones PLIHSA';
      case 'nueva-evaluacion-administrativa':
        return 'Nueva Evaluación Administrativa';
      case 'evaluation-admin-enero':
        return 'Evaluación Administrativo - Marzo 2026';
      case 'evaluation-operative-enero':
        return 'Evaluación Operativo - Marzo 2026';
      case 'system-users':
        return 'Usuarios del Sistema';
      case 'companies':
        return 'Empresas';
      case 'settings':
        return 'Configuración';
      case 'profile':
        return 'Mi Perfil';
      case 'raw-evaluations':
        return 'Evaluaciones Hechas (Raw Data)';
      case 'sql-executor':
        return 'SQL Evaluaciones';
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
      case 'evaluations-list':
        return <EvaluationsList onEditEvaluation={handleEditEvaluation} />;
      case 'new-evaluations-plihsa':
        return <NewEvaluationsPLIHSA />;
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
      case 'companies':
        return (
          <div className="text-center py-12">
            <p className="text-slate-600">Módulo de empresas en desarrollo</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <p className="text-slate-600">Configuración en desarrollo</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={getViewTitle()} />
        <main className="flex-1 overflow-y-auto p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
