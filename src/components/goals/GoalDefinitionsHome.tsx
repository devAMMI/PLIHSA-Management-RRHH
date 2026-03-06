import { useState } from 'react';
import { Users, Building2, List, File as FileEdit, FileCheck } from 'lucide-react';
import { GoalDefinitionForm } from './GoalDefinitionForm';
import { OperativeGoalDefinitionForm } from './OperativeGoalDefinitionForm';
import { GoalDefinitionsList } from './GoalDefinitionsList';

type ViewType =
  | 'home'
  | 'administrative-form'
  | 'operative-form'
  | 'administrative-list'
  | 'operative-list'
  | 'administrative-drafts'
  | 'operative-drafts'
  | 'administrative-finalized'
  | 'operative-finalized';

export function GoalDefinitionsHome() {
  const [currentView, setCurrentView] = useState<ViewType>('home');

  if (currentView === 'administrative-form') {
    return <GoalDefinitionForm onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'operative-form') {
    return <OperativeGoalDefinitionForm onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'administrative-list') {
    return <GoalDefinitionsList type="administrative" onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'operative-list') {
    return <GoalDefinitionsList type="operative" onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'administrative-drafts') {
    return <GoalDefinitionsList type="administrative" filterStatus="draft" onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'operative-drafts') {
    return <GoalDefinitionsList type="operative" filterStatus="draft" onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'administrative-finalized') {
    return <GoalDefinitionsList type="administrative" filterStatus="approved" onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'operative-finalized') {
    return <GoalDefinitionsList type="operative" filterStatus="approved" onBack={() => setCurrentView('home')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center justify-center mb-6">
            <img
              src="/Profile-pic-plihsa-logo-foto.jpg"
              alt="PLIHSA Logo"
              className="w-16 h-16 object-contain mr-4"
            />
            <h1 className="text-4xl font-bold text-slate-800">Definición de Metas</h1>
          </div>

          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg text-slate-600 mb-4">
              La definición de metas es un proceso fundamental para alinear los objetivos individuales
              con los objetivos organizacionales de PLIHSA. Este proceso permite establecer expectativas
              claras y medibles para el desempeño de cada colaborador.
            </p>
            <p className="text-slate-600">
              Seleccione el tipo de evaluación según el perfil del colaborador:
            </p>
          </div>
        </div>

        {/* Actions Grid - Organized by Type */}
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 justify-center">
            {/* Administrative Section - Left Side */}
            <div className="flex-1 max-w-md">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 shadow-lg border border-blue-200">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Administrativo</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Administrative Form */}
                  <button
                    onClick={() => setCurrentView('administrative-form')}
                    className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-blue-500 flex flex-col items-center text-center"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800">Nueva Definición</h3>
                  </button>

                  {/* Administrative List */}
                  <button
                    onClick={() => setCurrentView('administrative-list')}
                    className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-blue-500 flex flex-col items-center text-center"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <List className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800">Ver Definiciones</h3>
                  </button>

                  {/* Administrative Drafts */}
                  <button
                    onClick={() => setCurrentView('administrative-drafts')}
                    className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-blue-500 flex flex-col items-center text-center"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FileEdit className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800">Borradores</h3>
                  </button>

                  {/* Administrative Finalized */}
                  <button
                    onClick={() => setCurrentView('administrative-finalized')}
                    className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-blue-500 flex flex-col items-center text-center"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FileCheck className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800">Finalizados</h3>
                  </button>
                </div>
              </div>
            </div>

            {/* Operative Section - Right Side */}
            <div className="flex-1 max-w-md">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 shadow-lg border border-orange-200">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mr-3">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Operativo</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Operative Form */}
                  <button
                    onClick={() => setCurrentView('operative-form')}
                    className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-orange-500 flex flex-col items-center text-center"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800">Nueva Definición</h3>
                  </button>

                  {/* Operative List */}
                  <button
                    onClick={() => setCurrentView('operative-list')}
                    className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-orange-500 flex flex-col items-center text-center"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <List className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800">Ver Definiciones</h3>
                  </button>

                  {/* Operative Drafts */}
                  <button
                    onClick={() => setCurrentView('operative-drafts')}
                    className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-orange-500 flex flex-col items-center text-center"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FileEdit className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800">Borradores</h3>
                  </button>

                  {/* Operative Finalized */}
                  <button
                    onClick={() => setCurrentView('operative-finalized')}
                    className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-orange-500 flex flex-col items-center text-center"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FileCheck className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800">Finalizados</h3>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-12 max-w-3xl mx-auto bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-1">Nota Importante</h3>
              <p className="text-sm text-blue-700">
                Las metas definidas en este proceso servirán como base para las evaluaciones de desempeño
                del periodo correspondiente. Es importante que tanto el colaborador como el supervisor
                estén de acuerdo con las metas establecidas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
