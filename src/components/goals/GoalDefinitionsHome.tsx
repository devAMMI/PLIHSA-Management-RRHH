import { useState } from 'react';
import { ClipboardList, Users, Building2, List, File as FileEdit, FileCheck } from 'lucide-react';
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
            <ClipboardList className="w-12 h-12 text-blue-600 mr-4" />
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

        {/* Actions Grid - App Style */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Administrative Form */}
            <button
              onClick={() => setCurrentView('administrative-form')}
              className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-blue-500 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Nueva Definición</h3>
              <p className="text-xs text-blue-600 font-semibold">Administrativo</p>
            </button>

            {/* Operative Form */}
            <button
              onClick={() => setCurrentView('operative-form')}
              className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-green-500 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Nueva Definición</h3>
              <p className="text-xs text-green-600 font-semibold">Operativo</p>
            </button>

            {/* Administrative List */}
            <button
              onClick={() => setCurrentView('administrative-list')}
              className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-blue-500 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
                <List className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Ver Definiciones</h3>
              <p className="text-xs text-blue-600 font-semibold">Administrativo</p>
            </button>

            {/* Operative List */}
            <button
              onClick={() => setCurrentView('operative-list')}
              className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-green-500 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
                <List className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Ver Definiciones</h3>
              <p className="text-xs text-green-600 font-semibold">Operativo</p>
            </button>

            {/* Administrative Drafts */}
            <button
              onClick={() => setCurrentView('administrative-drafts')}
              className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-amber-500 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
                <FileEdit className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Borradores</h3>
              <p className="text-xs text-amber-600 font-semibold">Administrativo</p>
            </button>

            {/* Operative Drafts */}
            <button
              onClick={() => setCurrentView('operative-drafts')}
              className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-amber-500 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
                <FileEdit className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Borradores</h3>
              <p className="text-xs text-amber-600 font-semibold">Operativo</p>
            </button>

            {/* Administrative Finalized */}
            <button
              onClick={() => setCurrentView('administrative-finalized')}
              className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-emerald-500 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
                <FileCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Finalizados</h3>
              <p className="text-xs text-emerald-600 font-semibold">Administrativo</p>
            </button>

            {/* Operative Finalized */}
            <button
              onClick={() => setCurrentView('operative-finalized')}
              className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-emerald-500 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
                <FileCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Finalizados</h3>
              <p className="text-xs text-emerald-600 font-semibold">Operativo</p>
            </button>
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
