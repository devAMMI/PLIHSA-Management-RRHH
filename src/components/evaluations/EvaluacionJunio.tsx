import { useState } from 'react';
import { Building2, Users, List, File as FileEdit, FileCheck, Calendar, ClipboardList, ClipboardCheck } from 'lucide-react';
import { AdministrativeEvaluationForm } from './AdministrativeEvaluationForm';
import { OperativeEvaluationForm } from './OperativeEvaluationForm';
import { JuneEvaluationsList } from './JuneEvaluationsList';
import { JuneReviewForm } from './JuneReviewForm';

const JUNE_ADMIN_PERIOD_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567891';
const JUNE_OPERATIVE_PERIOD_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567892';

type ViewType =
  | 'home'
  | 'admin-form'
  | 'operative-form'
  | 'admin-review'
  | 'admin-list'
  | 'operative-list'
  | 'admin-drafts'
  | 'operative-drafts'
  | 'admin-finalized'
  | 'operative-finalized';

export function EvaluacionJunio() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEditAdmin = (id: string) => {
    setEditingId(id);
    setCurrentView('admin-form');
  };

  const handleReviewAdmin = (id: string) => {
    setEditingId(id);
    setCurrentView('admin-review');
  };

  const handleEditOperative = (id: string) => {
    setEditingId(id);
    setCurrentView('operative-form');
  };

  const handleBackFromForm = (type: 'admin' | 'operative') => {
    setEditingId(null);
    setCurrentView(type === 'admin' ? 'admin-list' : 'operative-list');
  };

  if (currentView === 'admin-review' && editingId) {
    return (
      <JuneReviewForm
        evaluationId={editingId}
        onCancel={() => { setEditingId(null); setCurrentView('admin-list'); }}
      />
    );
  }

  if (currentView === 'admin-form') {
    return (
      <AdministrativeEvaluationForm
        periodId={JUNE_ADMIN_PERIOD_ID}
        editingEvaluationId={editingId}
        onCancel={() => handleBackFromForm('admin')}
      />
    );
  }

  if (currentView === 'operative-form') {
    return (
      <OperativeEvaluationForm
        periodId={JUNE_OPERATIVE_PERIOD_ID}
        editingEvaluationId={editingId}
        onCancel={() => handleBackFromForm('operative')}
      />
    );
  }

  if (currentView === 'admin-list') {
    return (
      <JuneEvaluationsList
        type="administrative"
        statusFilter="all"
        onBack={() => setCurrentView('home')}
        onNew={() => { setEditingId(null); setCurrentView('admin-form'); }}
        onEdit={handleEditAdmin}
        onReview={handleReviewAdmin}
      />
    );
  }

  if (currentView === 'operative-list') {
    return (
      <JuneEvaluationsList
        type="operative"
        statusFilter="all"
        onBack={() => setCurrentView('home')}
        onNew={() => { setEditingId(null); setCurrentView('operative-form'); }}
        onEdit={handleEditOperative}
      />
    );
  }

  if (currentView === 'admin-drafts') {
    return (
      <JuneEvaluationsList
        type="administrative"
        statusFilter="draft"
        onBack={() => setCurrentView('home')}
        onNew={() => { setEditingId(null); setCurrentView('admin-form'); }}
        onEdit={handleEditAdmin}
        onReview={handleReviewAdmin}
      />
    );
  }

  if (currentView === 'operative-drafts') {
    return (
      <JuneEvaluationsList
        type="operative"
        statusFilter="draft"
        onBack={() => setCurrentView('home')}
        onNew={() => { setEditingId(null); setCurrentView('operative-form'); }}
        onEdit={handleEditOperative}
      />
    );
  }

  if (currentView === 'admin-finalized') {
    return (
      <JuneEvaluationsList
        type="administrative"
        statusFilter="completed"
        onBack={() => setCurrentView('home')}
        onNew={() => { setEditingId(null); setCurrentView('admin-form'); }}
        onEdit={handleEditAdmin}
        onReview={handleReviewAdmin}
      />
    );
  }

  if (currentView === 'operative-finalized') {
    return (
      <JuneEvaluationsList
        type="operative"
        statusFilter="completed"
        onBack={() => setCurrentView('home')}
        onNew={() => { setEditingId(null); setCurrentView('operative-form'); }}
        onEdit={handleEditOperative}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center justify-center mb-6">
            <img
              src="/Logo_PLIHSA_BLUE.png"
              alt="PLIHSA Logo"
              className="w-16 h-16 object-contain mr-4"
            />
            <div>
              <h1 className="text-4xl font-bold text-slate-800">2da Evaluacion - Junio</h1>
              <p className="text-slate-500 text-sm mt-1">Evaluacion de Desempeno Semestral &mdash; Junio 2026</p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg text-slate-600 mb-4">
              La segunda evaluacion del ano mide el avance en las metas definidas en enero
              y el cumplimiento de los objetivos del primer semestre.
              Seleccione el tipo de evaluacion segun el perfil del colaborador.
            </p>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Periodo: Abril &ndash; Junio 2026</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <ClipboardList className="w-4 h-4" />
                <span className="text-sm">Etapa 2 de 3</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 justify-center">
            <div className="flex-1 max-w-md">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 shadow-lg border border-blue-200">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Administrativo</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setEditingId(null); setCurrentView('admin-form'); }}
                    className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-blue-500 flex flex-col items-center text-center"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800">Nueva Evaluacion</h3>
                  </button>

                  <button
                    onClick={() => setCurrentView('admin-list')}
                    className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-blue-500 flex flex-col items-center text-center"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <List className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800">Ver Evaluaciones</h3>
                  </button>

                  <button
                    onClick={() => setCurrentView('admin-drafts')}
                    className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-blue-500 flex flex-col items-center text-center"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FileEdit className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800">Borradores</h3>
                  </button>

                  <button
                    onClick={() => setCurrentView('admin-finalized')}
                    className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-blue-500 flex flex-col items-center text-center"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FileCheck className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800">Finalizados</h3>
                  </button>
                </div>

                <div className="mt-3 border-t border-blue-200 pt-3">
                  <button
                    onClick={() => setCurrentView('admin-list')}
                    className="group w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-teal-500 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                      <ClipboardCheck className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xs font-bold text-slate-800">Revision Junio (Parte 2)</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Calificar metas y conductas</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 max-w-md">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 shadow-lg border border-orange-200">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mr-3">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Operativo</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setEditingId(null); setCurrentView('operative-form'); }}
                    className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-orange-500 flex flex-col items-center text-center"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800">Nueva Evaluacion</h3>
                  </button>

                  <button
                    onClick={() => setCurrentView('operative-list')}
                    className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-orange-500 flex flex-col items-center text-center"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <List className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800">Ver Evaluaciones</h3>
                  </button>

                  <button
                    onClick={() => setCurrentView('operative-drafts')}
                    className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-orange-500 flex flex-col items-center text-center"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FileEdit className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800">Borradores</h3>
                  </button>

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

        <div className="mt-12 max-w-3xl mx-auto bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-1">Ciclo de Evaluaciones Anual</h3>
              <p className="text-sm text-blue-700">
                <span className="font-medium">1. Definicion de Metas (Enero)</span> &rarr; Establecimiento de objetivos. &nbsp;
                <span className="font-semibold text-blue-900">2. Evaluacion - Junio</span> &rarr; Seguimiento semestral del desempeno. &nbsp;
                <span className="font-medium">3. Evaluacion - Diciembre</span> &rarr; Cierre y evaluacion final del ano.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
