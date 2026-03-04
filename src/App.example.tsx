import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

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
      case 'system-users':
        return 'Usuarios del Sistema';
      case 'profile':
        return 'Mi Perfil';
      default:
        return 'Dashboard';
    }
  };

  const mockSystemUser = { role: 'admin' };
  const mockEmployee = {
    first_name: 'Juan',
    last_name: 'Pérez',
    position: 'Administrador de RRHH'
  };
  const mockUser = { email: 'juan.perez@example.com' };

  const handleSignOut = () => {
    console.log('Cerrar sesión');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        systemUser={mockSystemUser}
        employee={mockEmployee}
        user={mockUser}
        onSignOut={handleSignOut}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={getViewTitle()} />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-slate-700 mb-2">
              {getViewTitle()}
            </h2>
            <p className="text-slate-500">
              Vista actual: <strong>{currentView}</strong>
            </p>
            <div className="mt-8 max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6 text-left">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Sistema de Tiempo Actualizado
              </h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>✓ Zona horaria configurada: GMT-6 (Honduras)</li>
                <li>✓ Reloj en tiempo real en el header</li>
                <li>✓ Fecha completa en español</li>
                <li>✓ Actualización automática cada segundo</li>
                <li>✓ Formato de 12 horas (AM/PM)</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
