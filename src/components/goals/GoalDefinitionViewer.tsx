import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Printer, CreditCard as Edit2, X, ArrowLeft, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Employee {
  employee_code: string;
  first_name: string;
  last_name: string;
  position: string;
  hire_date: string;
  department: { name: string } | null;
  sub_department: { name: string } | null;
  manager: { first_name: string; last_name: string; position: string } | null;
}

interface AdministrativeGoalDefinition {
  id: string;
  employee_id: string;
  evaluation_period: string;
  definition_date: string;
  employee_comments: string;
  manager_comments: string;
  status: string;
  created_at: string;
  employee: Employee;
  individual_goals: Array<{
    id: string;
    goal_number: number;
    goal_description: string;
    measurement_and_expected_results: string;
  }>;
  competency_behaviors: Array<{
    id: string;
    behavior_number: number;
    behavior_description: string;
  }>;
}

interface GoalDefinitionViewerProps {
  definition: AdministrativeGoalDefinition;
  onClose: () => void;
  onUpdate?: () => void;
  mode?: 'view' | 'edit';
}

export function GoalDefinitionViewer({ definition, onClose, onUpdate, mode: initialMode = 'view' }: GoalDefinitionViewerProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [goals, setGoals] = useState(
    Array.from({ length: 5 }, (_, i) => {
      const existing = definition.individual_goals.find(g => g.goal_number === i + 1);
      return {
        id: existing?.id,
        number: i + 1,
        description: existing?.goal_description || '',
        measurement: existing?.measurement_and_expected_results || ''
      };
    })
  );

  const [behaviors, setBehaviors] = useState(
    Array.from({ length: 5 }, (_, i) => {
      const existing = definition.competency_behaviors.find(b => b.behavior_number === i + 1);
      return {
        id: existing?.id,
        number: i + 1,
        description: existing?.behavior_description || ''
      };
    })
  );

  const [managerComments, setManagerComments] = useState(definition.manager_comments || '');
  const [employeeComments, setEmployeeComments] = useState(definition.employee_comments || '');
  const [definitionDate, setDefinitionDate] = useState(definition.definition_date);

  const handleGoalChange = (index: number, field: 'description' | 'measurement', value: string) => {
    const newGoals = [...goals];
    newGoals[index][field] = value;
    setGoals(newGoals);
  };

  const handleBehaviorChange = (index: number, value: string) => {
    const newBehaviors = [...behaviors];
    newBehaviors[index].description = value;
    setBehaviors(newBehaviors);
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const { error: updateError } = await supabase
        .from('goal_definitions')
        .update({
          definition_date: definitionDate,
          employee_comments: employeeComments,
          manager_comments: managerComments
        })
        .eq('id', definition.id);

      if (updateError) throw updateError;

      for (const goal of goals) {
        if (goal.description.trim() || goal.measurement.trim()) {
          if (goal.id) {
            const { error } = await supabase
              .from('individual_goals')
              .update({
                goal_description: goal.description,
                measurement_and_expected_results: goal.measurement
              })
              .eq('id', goal.id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('individual_goals')
              .insert({
                goal_definition_id: definition.id,
                goal_number: goal.number,
                goal_description: goal.description,
                measurement_and_expected_results: goal.measurement
              });
            if (error) throw error;
          }
        } else if (goal.id) {
          const { error } = await supabase
            .from('individual_goals')
            .delete()
            .eq('id', goal.id);
          if (error) throw error;
        }
      }

      for (const behavior of behaviors) {
        if (behavior.description.trim()) {
          if (behavior.id) {
            const { error } = await supabase
              .from('competency_behaviors')
              .update({
                behavior_description: behavior.description
              })
              .eq('id', behavior.id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('competency_behaviors')
              .insert({
                goal_definition_id: definition.id,
                behavior_number: behavior.number,
                behavior_description: behavior.description
              });
            if (error) throw error;
          }
        } else if (behavior.id) {
          const { error } = await supabase
            .from('competency_behaviors')
            .delete()
            .eq('id', behavior.id);
          if (error) throw error;
        }
      }

      setMessage({ type: 'success', text: 'Definición de metas actualizada exitosamente' });
      setMode('view');
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Error updating goal definition:', error);
      setMessage({ type: 'error', text: error.message || 'Error al actualizar la definición de metas' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!formRef.current) return;

    setLoading(true);
    try {
      const canvas = await html2canvas(formRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: formRef.current.scrollWidth,
        windowHeight: formRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });

      const imgWidth = 215.9;
      const pageHeight = 279.4;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'letter');

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);

      const fileName = `Definicion_Metas_${definition.employee.first_name}_${definition.employee.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage({ type: 'error', text: 'Error al generar el PDF' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateSeniority = (hireDate: string): string => {
    const hire = new Date(hireDate);
    const now = new Date();
    const months = (now.getFullYear() - hire.getFullYear()) * 12 + (now.getMonth() - hire.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) return `${remainingMonths} mes(es)`;
    if (remainingMonths === 0) return `${years} año(s)`;
    return `${years} año(s) ${remainingMonths} mes(es)`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-50 rounded-xl shadow-xl max-w-7xl w-full my-8">
        <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between print:hidden rounded-t-xl">
          <h2 className="text-xl font-bold">
            Definición de Metas - {definition.employee.first_name} {definition.employee.last_name}
          </h2>
          <div className="flex gap-2">
            {mode === 'view' && (
              <>
                <button
                  onClick={() => setMode('edit')}
                  className="p-2 hover:bg-blue-800 rounded-lg transition"
                  title="Editar"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={loading}
                  className="p-2 hover:bg-blue-800 rounded-lg transition disabled:opacity-50"
                  title="Descargar PDF"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={handlePrint}
                  disabled={loading}
                  className="p-2 hover:bg-blue-800 rounded-lg transition disabled:opacity-50"
                  title="Imprimir"
                >
                  <Printer className="w-5 h-5" />
                </button>
              </>
            )}
            {mode === 'edit' && (
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            )}
            <button
              onClick={() => mode === 'edit' ? setMode('view') : onClose()}
              className="p-2 hover:bg-blue-800 rounded-lg transition"
            >
              {mode === 'edit' ? <X className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(100vh-120px)]">
          {message && (
            <div
              className={`mb-4 p-4 rounded-lg print:hidden ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print-content" ref={formRef}>
            <div className="bg-white border-b-2 border-slate-300">
              <div className="grid grid-cols-12">
                <div className="col-span-2 border-r-2 border-slate-300 p-2 flex items-center justify-center">
                  <img
                    src="https://i.imgur.com/hii0TM1.png"
                    alt="PLIHSA Logo"
                    className="w-full h-auto max-w-[120px]"
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="col-span-7 border-r-2 border-slate-300 p-2 flex items-center justify-center">
                  <h1 className="text-xs font-bold text-slate-800 text-center">
                    Definición de Factores y Revisión del Desempeño Administrativo
                  </h1>
                </div>
                <div className="col-span-3 p-1 text-[8px]">
                  <div className="border-b border-slate-300 px-1 py-0.5">
                    <span className="font-semibold">Código:</span> PL-RH-P-002-F01
                  </div>
                  <div className="border-b border-slate-300 px-1 py-0.5">
                    <span className="font-semibold">Versión:</span> 01
                  </div>
                  <div className="px-1 py-0.5">
                    <span className="font-semibold">Fecha de Revisión:</span> 09/07/2025
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
                <div className="space-y-0.5">
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[90px]">Código:</span>
                    <span className="text-slate-600">{definition.employee.employee_code}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[90px]">Nombre:</span>
                    <span className="text-slate-600">{definition.employee.first_name} {definition.employee.last_name}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[90px]">Puesto:</span>
                    <span className="text-slate-600">{definition.employee.position}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[90px]">Departamento:</span>
                    <span className="text-slate-600">{definition.employee.department?.name || 'N/A'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[90px]">Sub Depto:</span>
                    <span className="text-slate-600">{definition.employee.sub_department?.name || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[110px]">Fecha de Ingreso:</span>
                    <span className="text-slate-600">{new Date(definition.employee.hire_date).toLocaleDateString('es-HN')}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[110px]">Jefe Inmediato:</span>
                    <span className="text-slate-600">
                      {definition.employee.manager
                        ? `${definition.employee.manager.first_name} ${definition.employee.manager.last_name}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[110px]">Fecha Definición:</span>
                    {mode === 'edit' ? (
                      <input
                        type="date"
                        value={definitionDate}
                        onChange={(e) => setDefinitionDate(e.target.value)}
                        className="border border-slate-300 rounded px-1 py-0.5 text-slate-600 text-[10px]"
                      />
                    ) : (
                      <span className="text-slate-600">{new Date(definitionDate).toLocaleDateString('es-HN')}</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-white bg-blue-900 px-2 py-1 mb-1 text-[10px]">
                  DEFINICIÓN METAS INDIVIDUALES
                </h3>
                <table className="w-full border-2 border-slate-300 text-[9px]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-1 py-0.5 w-8">No.</th>
                      <th className="border border-slate-300 px-1 py-0.5">Metas Individuales</th>
                      <th className="border border-slate-300 px-1 py-0.5">Medición y Resultados Esperados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goals.map((goal, index) => (
                      <tr key={goal.number}>
                        <td className="border border-slate-300 px-1 py-0.5 text-center font-bold">{goal.number}</td>
                        <td className="border border-slate-300 px-1 py-0.5">
                          {mode === 'edit' ? (
                            <textarea
                              value={goal.description}
                              onChange={(e) => handleGoalChange(index, 'description', e.target.value)}
                              rows={2}
                              className="w-full border border-slate-200 rounded p-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-[9px]"
                              placeholder="Describa la meta..."
                            />
                          ) : (
                            <div className="min-h-[40px] whitespace-pre-wrap">{goal.description || '-'}</div>
                          )}
                        </td>
                        <td className="border border-slate-300 px-1 py-0.5">
                          {mode === 'edit' ? (
                            <textarea
                              value={goal.measurement}
                              onChange={(e) => handleGoalChange(index, 'measurement', e.target.value)}
                              rows={2}
                              className="w-full border border-slate-200 rounded p-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-[9px]"
                              placeholder="Indique medición..."
                            />
                          ) : (
                            <div className="min-h-[40px] whitespace-pre-wrap">{goal.measurement || '-'}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="font-bold text-white bg-blue-900 px-2 py-1 mb-1 text-[10px]">
                  DEFINICIÓN DE COMPETENCIAS CONDUCTUALES/HABILIDADES
                </h3>
                <table className="w-full border-2 border-slate-300 text-[9px]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-1 py-0.5 w-8">No.</th>
                      <th className="border border-slate-300 px-1 py-0.5">Conductas/Habilidades (Definir las 5 Principales)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {behaviors.map((behavior, index) => (
                      <tr key={behavior.number}>
                        <td className="border border-slate-300 px-1 py-0.5 text-center font-bold">{behavior.number}</td>
                        <td className="border border-slate-300 px-1 py-0.5">
                          {mode === 'edit' ? (
                            <textarea
                              value={behavior.description}
                              onChange={(e) => handleBehaviorChange(index, e.target.value)}
                              rows={1}
                              className="w-full border border-slate-200 rounded p-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-[9px]"
                              placeholder="Describa la competencia..."
                            />
                          ) : (
                            <div className="min-h-[25px] whitespace-pre-wrap">{behavior.description || ''}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-1">
                <div className="border-2 border-slate-300">
                  <div className="bg-blue-900 text-white px-2 py-0.5 text-[9px] font-bold">
                    Comentarios Jefe Inmediato
                  </div>
                  {mode === 'edit' ? (
                    <textarea
                      value={managerComments}
                      onChange={(e) => setManagerComments(e.target.value)}
                      rows={3}
                      className="w-full border-0 p-1 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-[9px]"
                      placeholder="Comentarios del jefe..."
                    />
                  ) : (
                    <div className="p-1 min-h-[50px] text-[9px] whitespace-pre-wrap">
                      {managerComments || ''}
                    </div>
                  )}
                </div>
                <div className="border-2 border-slate-300">
                  <div className="bg-blue-900 text-white px-2 py-0.5 text-[9px] font-bold">
                    Comentarios del Colaborador
                  </div>
                  {mode === 'edit' ? (
                    <textarea
                      value={employeeComments}
                      onChange={(e) => setEmployeeComments(e.target.value)}
                      rows={3}
                      className="w-full border-0 p-1 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-[9px]"
                      placeholder="Comentarios del colaborador..."
                    />
                  ) : (
                    <div className="p-1 min-h-[50px] text-[9px] whitespace-pre-wrap">
                      {employeeComments || ''}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[9px] mt-2">
                <div className="text-center">
                  <div className="border-t-2 border-slate-800 pt-1 mt-8">
                    <p className="font-bold text-slate-800">Firma Colaborador</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t-2 border-slate-800 pt-1 mt-8">
                    <p className="font-bold text-slate-800">Firma Jefe Inmediato</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
