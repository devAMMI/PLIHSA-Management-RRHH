import { Building2, Users, Calendar, ClipboardList, Clock } from 'lucide-react';

export function EvaluacionJunio() {
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
              <h1 className="text-4xl font-bold text-slate-800">2da Evaluación - Junio</h1>
              <p className="text-slate-500 text-sm mt-1">Evaluación de Desempeño Semestral</p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg text-slate-600 mb-4">
              La segunda evaluación del año corresponde al seguimiento semestral del desempeño
              de los colaboradores de PLIHSA. Este proceso mide el avance en las metas definidas
              en enero y el cumplimiento de los objetivos del periodo.
            </p>

            <div className="flex items-center justify-center gap-2 text-slate-500">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Periodo: Junio 2026</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mb-8">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Etapa</span>
              </div>
              <p className="text-sm font-bold text-slate-800">2 de 3</p>
              <p className="text-xs text-slate-500">En el ciclo anual</p>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Periodo</span>
              </div>
              <p className="text-sm font-bold text-slate-800">Junio 2026</p>
              <p className="text-xs text-slate-500">Evaluacion semestral</p>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</span>
              </div>
              <p className="text-sm font-bold text-slate-800">Proximo</p>
              <p className="text-xs text-slate-500">En preparacion</p>
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

                <div className="bg-white/60 rounded-2xl p-6 text-center border border-blue-200/50">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 mb-2">Modulo en Preparacion</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    El modulo de evaluacion administrativa para junio estara disponible proximamente.
                  </p>
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

                <div className="bg-white/60 rounded-2xl p-6 text-center border border-orange-200/50">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-orange-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 mb-2">Modulo en Preparacion</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    El modulo de evaluacion operativa para junio estara disponible proximamente.
                  </p>
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
                <span className="font-medium">1. Definicion de Metas (Enero)</span> &rarr; Establecimiento de objetivos del periodo. &nbsp;
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
