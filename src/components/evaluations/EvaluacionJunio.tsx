import { useState } from 'react';
import { Building2, Calendar, ClipboardList, List, File as FileEdit, FileCheck, Plus } from 'lucide-react';
import { JuneReviewsList } from './JuneReviewsList';
import { JuneReviewFormNew } from './JuneReviewFormNew';

type ViewType =
  | 'home'
  | 'review-new'
  | 'review-list'
  | 'review-drafts'
  | 'review-finalized';

export function EvaluacionJunio() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    setEditingId(id);
    setCurrentView('review-new');
  };

  const handleBackFromForm = () => {
    setEditingId(null);
    setCurrentView('review-list');
  };

  if (currentView === 'review-new') {
    return (
      <JuneReviewFormNew
        reviewId={editingId}
        onCancel={handleBackFromForm}
        onSaved={handleBackFromForm}
      />
    );
  }

  if (currentView === 'review-list') {
    return (
      <JuneReviewsList
        statusFilter="all"
        onBack={() => setCurrentView('home')}
        onNew={() => { setEditingId(null); setCurrentView('review-new'); }}
        onEdit={handleEdit}
      />
    );
  }

  if (currentView === 'review-drafts') {
    return (
      <JuneReviewsList
        statusFilter="draft"
        onBack={() => setCurrentView('home')}
        onNew={() => { setEditingId(null); setCurrentView('review-new'); }}
        onEdit={handleEdit}
      />
    );
  }

  if (currentView === 'review-finalized') {
    return (
      <JuneReviewsList
        statusFilter="completed"
        onBack={() => setCurrentView('home')}
        onNew={() => { setEditingId(null); setCurrentView('review-new'); }}
        onEdit={handleEdit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex items-center justify-center mb-6">
            <img
              src="/Logo_PLIHSA_BLUE.png"
              alt="PLIHSA Logo"
              className="w-16 h-16 object-contain mr-4"
            />
            <div>
              <h1 className="text-4xl font-bold text-slate-800">2da Evaluacion &mdash; Revision</h1>
              <p className="text-slate-500 text-sm mt-1">Revision de Desempeno Semestral &mdash; Junio 2026</p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg text-slate-600 mb-4">
              Segunda etapa del ciclo anual de evaluaciones. Se revisan las metas individuales definidas
              en enero y se califican los factores conductuales y habilidades tecnicas de cada colaborador.
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

        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-3xl p-6 shadow-lg border border-teal-200">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center mr-3">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Revision Administrativa</h2>
                <p className="text-sm text-teal-700">Revision de Metas y Factores Conductuales</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setEditingId(null); setCurrentView('review-new'); }}
                className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-teal-500 flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xs font-bold text-slate-800">Nueva Revision</h3>
              </button>

              <button
                onClick={() => setCurrentView('review-list')}
                className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-teal-500 flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <List className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xs font-bold text-slate-800">Ver Revisiones</h3>
              </button>

              <button
                onClick={() => setCurrentView('review-drafts')}
                className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-teal-500 flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FileEdit className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xs font-bold text-slate-800">Borradores</h3>
              </button>

              <button
                onClick={() => setCurrentView('review-finalized')}
                className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-teal-500 flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FileCheck className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xs font-bold text-slate-800">Finalizadas</h3>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 max-w-3xl mx-auto bg-teal-50 rounded-xl p-6 border border-teal-200">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-teal-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-4">
              <h3 className="text-sm font-semibold text-teal-800 mb-1">Ciclo de Evaluaciones Anual</h3>
              <p className="text-sm text-teal-700">
                <span className="font-medium">1. Definicion de Metas (Enero)</span> &rarr; Establecimiento de objetivos y conductas. &nbsp;
                <span className="font-semibold text-teal-900">2. Revision (Junio)</span> &rarr; Calificacion de avance semestral. &nbsp;
                <span className="font-medium">3. Evaluacion Final (Diciembre)</span> &rarr; Cierre y evaluacion del ano.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
