import { FileText, ClipboardCheck, UserCheck, CheckCircle } from 'lucide-react';

interface OperativeEvaluationWelcomeProps {
  onStartEvaluation: () => void;
}

export function OperativeEvaluationWelcome({ onStartEvaluation }: OperativeEvaluationWelcomeProps) {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 rounded-t-lg">
          <div className="flex items-center gap-4">
            <div className="bg-white p-4 rounded-lg">
              <img src="/Profile-pic-plihsa-logo-foto.jpg" alt="PLIHSA" className="h-16" />
            </div>
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2">Evaluación de Desempeño Operativo</h1>
              <p className="text-blue-100">Definición de Factores y Revisión del Desempeño - Marzo 2026</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Bienvenido al Sistema de Evaluaciones</h2>
            <p className="text-slate-600 text-lg">
              Este formulario está diseñado para definir y evaluar el desempeño de los colaboradores operativos.
              A través de este proceso, podrás establecer factores funcionales, competencias conductuales y habilidades técnicas
              que serán la base para el seguimiento del rendimiento durante el año.
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
                    Información básica del empleado, departamento, posición y fechas relevantes.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex-shrink-0">
                  <div className="bg-green-600 p-3 rounded-lg">
                    <ClipboardCheck className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Factores Funcionales</h4>
                  <p className="text-sm text-slate-600">
                    Definición de las 5 funciones principales del puesto y los resultados esperados.
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
                  <h4 className="font-semibold text-slate-800 mb-1">Competencias y Habilidades</h4>
                  <p className="text-sm text-slate-600">
                    Definición de las 5 principales competencias conductuales y habilidades técnicas.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-shrink-0">
                  <div className="bg-slate-600 p-3 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Comentarios</h4>
                  <p className="text-sm text-slate-600">
                    Sección para comentarios del jefe inmediato y del colaborador evaluado.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-3">Pasos para completar la evaluación:</h3>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</span>
                <p className="text-slate-700 pt-1">Selecciona al colaborador operativo que deseas evaluar</p>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</span>
                <p className="text-slate-700 pt-1">Completa los datos del departamento y fechas si es necesario</p>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</span>
                <p className="text-slate-700 pt-1">Define las 5 funciones del puesto y los resultados esperados</p>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</span>
                <p className="text-slate-700 pt-1">Establece las 5 principales competencias conductuales y habilidades técnicas</p>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">5</span>
                <p className="text-slate-700 pt-1">Agrega comentarios si lo consideras necesario</p>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">6</span>
                <p className="text-slate-700 pt-1">Guarda la evaluación como borrador o finalízala</p>
              </li>
            </ol>
          </div>

          <div className="flex justify-center pt-6 border-t border-slate-200">
            <button
              onClick={onStartEvaluation}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-lg font-semibold shadow-lg hover:shadow-xl flex items-center gap-3"
            >
              <FileText className="w-6 h-6" />
              Nueva Evaluación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
