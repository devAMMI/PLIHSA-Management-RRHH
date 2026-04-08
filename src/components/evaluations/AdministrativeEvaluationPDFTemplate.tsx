import { formatDateForDisplay } from '../../lib/timezone';

interface Goal {
  goal_number: number;
  goal_description: string;
  measurement_and_expected_results: string;
}

interface Competency {
  competency_number: number;
  competency_description: string;
}

interface PDFTemplateProps {
  id?: string;
  employeeName: string;
  position: string;
  department: string;
  subDepartment: string;
  hireDate: string;
  definitionDate: string;
  periodName: string;
  formCode: string;
  formVersion: string;
  goals: Goal[];
  competencies: Competency[];
  managerComments: string;
  employeeComments: string;
  createdAt: string;
}

export function AdministrativeEvaluationPDFTemplate({
  id = 'pdf-content',
  employeeName,
  position,
  department,
  subDepartment,
  hireDate,
  definitionDate,
  periodName,
  formCode,
  formVersion,
  goals,
  competencies,
  managerComments,
  employeeComments,
  createdAt
}: PDFTemplateProps) {
  return (
    <div id={id} className="bg-white p-8 w-[210mm] mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="mb-6 border-b-2 border-blue-600 pb-4">
        <div className="flex items-center justify-between mb-2">
          <img src="/Profile-pic-plihsa-logo-foto.jpg" alt="PLIHSA" className="h-12" />
          <div className="text-right">
            <div className="text-sm font-semibold">Código: {formCode}</div>
            <div className="text-sm">Versión: {formVersion}</div>
          </div>
        </div>
        <h1 className="text-xl font-bold text-center text-blue-900 mt-2">
          Evaluación de Desempeño - Personal Administrativo
        </h1>
        <div className="text-center text-sm text-slate-600 mt-1">{periodName}</div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <span className="font-semibold">Nombre del Colaborador:</span> {employeeName}
        </div>
        <div>
          <span className="font-semibold">Puesto:</span> {position}
        </div>
        <div>
          <span className="font-semibold">Departamento:</span> {department}
        </div>
        <div>
          <span className="font-semibold">Sub-Departamento:</span> {subDepartment}
        </div>
        <div>
          <span className="font-semibold">Fecha de Ingreso:</span> {formatDateForDisplay(hireDate)}
        </div>
        <div>
          <span className="font-semibold">Fecha de Definición:</span> {formatDateForDisplay(definitionDate)}
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-t-lg font-semibold flex items-center gap-2">
          <span className="bg-white text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
          Metas Individuales
        </div>
        <div className="border border-slate-300 rounded-b-lg p-4 bg-slate-50">
          {goals.filter(g => g.goal_description).map((goal) => (
            <div key={goal.goal_number} className="mb-4 pb-4 border-b border-slate-200 last:border-0">
              <div className="font-semibold text-sm mb-2">Meta {goal.goal_number}</div>
              <div className="text-sm mb-2">
                <span className="font-medium">Descripción:</span> {goal.goal_description}
              </div>
              <div className="text-sm">
                <span className="font-medium">Medición y Resultados Esperados:</span> {goal.measurement_and_expected_results}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-t-lg font-semibold flex items-center gap-2">
          <span className="bg-white text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
          Competencias Organizacionales
        </div>
        <div className="border border-slate-300 rounded-b-lg p-4 bg-slate-50">
          {competencies.filter(c => c.competency_description).map((comp) => (
            <div key={comp.competency_number} className="mb-3 pb-3 border-b border-slate-200 last:border-0">
              <div className="text-sm">
                <span className="font-semibold">Competencia {comp.competency_number}:</span> {comp.competency_description}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-t-lg font-semibold flex items-center gap-2">
          <span className="bg-white text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
          Comentarios del Manager
        </div>
        <div className="border border-slate-300 rounded-b-lg p-4 bg-slate-50 text-sm min-h-[80px]">
          {managerComments || 'Sin comentarios'}
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-t-lg font-semibold flex items-center gap-2">
          <span className="bg-white text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
          Comentarios del Colaborador
        </div>
        <div className="border border-slate-300 rounded-b-lg p-4 bg-slate-50 text-sm min-h-[80px]">
          {employeeComments || 'Sin comentarios'}
        </div>
      </div>

      <div className="text-xs text-slate-500 text-right mt-8">
        Generado el {formatDateForDisplay(createdAt)}
      </div>
    </div>
  );
}
