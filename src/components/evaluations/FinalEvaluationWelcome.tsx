import { FileText, ClipboardCheck, UserCheck, CheckCircle, List, Target, Award } from 'lucide-react';

interface FinalEvaluationWelcomeProps {
  onStartEvaluation: () => void;
  onViewEvaluations: () => void;
}

export function FinalEvaluationWelcome({ onStartEvaluation, onViewEvaluations }: FinalEvaluationWelcomeProps) {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 rounded-t-lg">
          <div className="flex items-center gap-4">
            <div className="bg-white p-4 rounded-lg">
              <img src="/Profile-pic-plihsa-logo-foto.jpg" alt="PLIHSA" className="h-16" />
            </div>
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2">Evaluación Final del Desempeño</h1>
              <p className="text-blue-100">Formulario PL-RH-P-002-F02 - Empleados Administrativos</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Bienvenido a la Evaluación Final</h2>
            <p className="text-slate-600 text-lg">
              Este es el paso final del proceso de evaluación del desempeño para colaboradores administrativos.
              Aquí se califican las metas individuales definidas en la Fase 1 y se evalúan las competencias
              conductuales, generando la calificación final del colaborador.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-4">¿Qué incluye esta evaluación?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-shrink-0">
                  <div className="bg-blue-600 p-3 rounded-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Datos del Colaborador</h4>
                  <p className="text-sm text-slate-600">
                    Información del empleado, posición, antigüedad y jefe inmediato.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex-shrink-0">
                  <div className="bg-green-600 p-3 rounded-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Metas Individuales (60%)</h4>
                  <p className="text-sm text-slate-600">
                    Calificación de cada meta con escala del 1 al 10, medición de resultados y comentarios.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex-shrink-0">
                  <div className="bg-orange-600 p-3 rounded-lg">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Competencias (40%)</h4>
                  <p className="text-sm text-slate-600">
                    Evaluación de competencias conductuales con calificación numérica.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-shrink-0">
                  <div className="bg-slate-600 p-3 rounded-lg">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Calificación Final</h4>
                  <p className="text-sm text-slate-600">
                    Resultado ponderado entre metas (60%) y competencias (40%).
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 p-6 bg-amber-50 rounded-lg border border-amber-200">
            <h3 className="text-lg font-bold text-slate-800 mb-3">Escala de Calificación</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                <p className="text-2xl font-bold text-green-600">10</p>
                <p className="text-sm font-semibold text-slate-700">Excede</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                <p className="text-2xl font-bold text-blue-600">8-9</p>
                <p className="text-sm font-semibold text-slate-700">Cumple</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                <p className="text-2xl font-bold text-amber-600">6-7</p>
                <p className="text-sm font-semibold text-slate-700">A Mejorar</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                <p className="text-2xl font-bold text-red-600">1-5</p>
                <p className="text-sm font-semibold text-slate-700">Debajo</p>
              </div>
            </div>
          </div>

          <div className="mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-3">Pasos para completar la evaluación:</h3>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</span>
                <p className="text-slate-700 pt-1">Selecciona al colaborador administrativo a evaluar</p>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</span>
                <p className="text-slate-700 pt-1">Califica cada meta individual del 1 al 10 con sus resultados</p>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</span>
                <p className="text-slate-700 pt-1">Califica las competencias conductuales del 1 al 10</p>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</span>
                <p className="text-slate-700 pt-1">Agrega comentarios del jefe y del colaborador</p>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">5</span>
                <p className="text-slate-700 pt-1">Guarda la evaluación y descarga el PDF</p>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">6</span>
                <p className="text-slate-700 pt-1">Sube el documento firmado y finaliza el proceso</p>
              </li>
            </ol>
          </div>

          <div className="flex justify-center gap-4 pt-6 border-t border-slate-200">
            <button
              onClick={onViewEvaluations}
              className="px-8 py-4 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition text-lg font-semibold shadow-lg hover:shadow-xl flex items-center gap-3"
            >
              <List className="w-6 h-6" />
              Ver Evaluaciones Finales
            </button>
            <button
              onClick={onStartEvaluation}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-lg font-semibold shadow-lg hover:shadow-xl flex items-center gap-3"
            >
              <FileText className="w-6 h-6" />
              Nueva Evaluación Final
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
