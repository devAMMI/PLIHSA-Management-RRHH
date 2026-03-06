import { useState } from 'react';
import { ClipboardList, Users, Building2, List, FileEdit, FileCheck } from 'lucide-react';
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

        {/* Cards Section */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Administrative Card */}
          <button
            onClick={() => setCurrentView('administrative-form')}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 text-left border-2 border-transparent hover:border-blue-500 group"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6 group-hover:bg-blue-200 transition-colors">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Definición de Metas
              <span className="block text-blue-600 mt-1">Administrativo</span>
            </h2>

            <p className="text-slate-600 mb-6">
              Dirigido a personal administrativo, gerencial y de oficina. Este formato evalúa
              competencias estratégicas, gestión de proyectos, liderazgo y resultados de negocio.
            </p>

            <div className="space-y-2 text-sm text-slate-500">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span>Metas individuales y objetivos estratégicos</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span>Factores de comportamiento organizacional</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span>Evaluación de competencias de liderazgo</span>
              </div>
            </div>

            <div className="mt-8 flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
              <span>Seleccionar</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Operative Card */}
          <button
            onClick={() => setCurrentView('operative-form')}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 text-left border-2 border-transparent hover:border-green-500 group"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6 group-hover:bg-green-200 transition-colors">
              <Users className="w-8 h-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Definición de Metas
              <span className="block text-green-600 mt-1">Operativo</span>
            </h2>

            <p className="text-slate-600 mb-6">
              Dirigido a personal operativo y técnico. Este formato evalúa el desempeño en tareas
              específicas, cumplimiento de procedimientos, seguridad y calidad del trabajo.
            </p>

            <div className="space-y-2 text-sm text-slate-500">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Objetivos operativos y de producción</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Cumplimiento de normas de seguridad</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Indicadores de calidad y eficiencia</span>
              </div>
            </div>

            <div className="mt-8 flex items-center text-green-600 font-semibold group-hover:translate-x-2 transition-transform">
              <span>Seleccionar</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* View Definitions Buttons */}
        <div className="mt-12 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
            Ver Definiciones de Metas Realizadas
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => setCurrentView('administrative-list')}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 border-2 border-transparent hover:border-blue-500 group"
            >
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mr-4 group-hover:bg-blue-200 transition-colors">
                  <List className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-slate-800">Ver Definiciones</h3>
                  <p className="text-blue-600 font-semibold">Administrativo</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Consultar y revisar las definiciones de metas administrativas ya realizadas
              </p>
            </button>

            <button
              onClick={() => setCurrentView('operative-list')}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 border-2 border-transparent hover:border-green-500 group"
            >
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mr-4 group-hover:bg-green-200 transition-colors">
                  <List className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-slate-800">Ver Definiciones</h3>
                  <p className="text-green-600 font-semibold">Operativo</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Consultar y revisar las definiciones de metas operativas ya realizadas
              </p>
            </button>
          </div>
        </div>

        {/* Draft Formats Buttons */}
        <div className="mt-12 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
            Formatos en Borrador Guardados
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => setCurrentView('administrative-drafts')}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 border-2 border-transparent hover:border-yellow-500 group"
            >
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mr-4 group-hover:bg-yellow-200 transition-colors">
                  <FileEdit className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-slate-800">Borradores</h3>
                  <p className="text-yellow-600 font-semibold">Administrativo</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Ver y continuar editando formatos administrativos guardados en borrador
              </p>
            </button>

            <button
              onClick={() => setCurrentView('operative-drafts')}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 border-2 border-transparent hover:border-yellow-500 group"
            >
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mr-4 group-hover:bg-yellow-200 transition-colors">
                  <FileEdit className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-slate-800">Borradores</h3>
                  <p className="text-yellow-600 font-semibold">Operativo</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Ver y continuar editando formatos operativos guardados en borrador
              </p>
            </button>
          </div>
        </div>

        {/* Finalized Formats Buttons */}
        <div className="mt-12 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
            Formatos Finalizados
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => setCurrentView('administrative-finalized')}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 border-2 border-transparent hover:border-green-500 group"
            >
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mr-4 group-hover:bg-green-200 transition-colors">
                  <FileCheck className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-slate-800">Finalizados</h3>
                  <p className="text-green-600 font-semibold">Administrativo</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Ver formatos administrativos aprobados y firmados
              </p>
            </button>

            <button
              onClick={() => setCurrentView('operative-finalized')}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 border-2 border-transparent hover:border-green-500 group"
            >
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mr-4 group-hover:bg-green-200 transition-colors">
                  <FileCheck className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-slate-800">Finalizados</h3>
                  <p className="text-green-600 font-semibold">Operativo</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Ver formatos operativos aprobados y firmados
              </p>
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
