import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Printer, CreditCard as Edit2, X, ArrowLeft } from 'lucide-react';
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

  const handlePrint = async () => {
    if (!formRef.current) return;

    setLoading(true);
    try {
      const canvas = await html2canvas(formRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Definicion_Metas_${definition.employee.first_name}_${definition.employee.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage({ type: 'error', text: 'Error al generar el PDF' });
    } finally {
      setLoading(false);
    }
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

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" ref={formRef}>
            <div className="bg-white border-b-2 border-slate-300">
              <div className="grid grid-cols-12">
                <div className="col-span-3 border-r-2 border-slate-300 p-4 flex items-center justify-center">
                  <img
                    src="/Profile-pic-plihsa-logo-foto.jpg"
                    alt="PLIHSA Logo"
                    className="w-full h-auto max-w-[180px]"
                  />
                </div>
                <div className="col-span-6 border-r-2 border-slate-300 p-4 flex items-center justify-center">
                  <h1 className="text-lg font-bold text-slate-800 text-center">
                    Definición de Factores y Revisión del Desempeño Administrativo
                  </h1>
                </div>
                <div className="col-span-3 p-2 text-xs">
                  <div className="border-b border-slate-300 px-2 py-1">
                    <span className="font-semibold">Código:</span> PL-RH-P-002-F01
                  </div>
                  <div className="border-b border-slate-300 px-2 py-1">
                    <span className="font-semibold">Versión:</span> 01
                  </div>
                  <div className="px-2 py-1">
                    <span className="font-semibold">Fecha de Revisión:</span> 09/07/2025
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[120px]">Código:</span>
                    <span className="text-slate-600">{definition.employee.employee_code}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[120px]">Nombre:</span>
                    <span className="text-slate-600">{definition.employee.first_name} {definition.employee.last_name}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[120px]">Puesto:</span>
                    <span className="text-slate-600">{definition.employee.position}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[120px]">Departamento:</span>
                    <span className="text-slate-600">{definition.employee.department?.name || 'N/A'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[120px]">Sub Depto:</span>
                    <span className="text-slate-600">{definition.employee.sub_department?.name || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[150px]">Fecha de Ingreso:</span>
                    <span className="text-slate-600">{new Date(definition.employee.hire_date).toLocaleDateString('es-HN')}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[150px]">Antigüedad:</span>
                    <span className="text-slate-600">{calculateSeniority(definition.employee.hire_date)}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[150px]">Jefe Inmediato:</span>
                    <span className="text-slate-600">
                      {definition.employee.manager
                        ? `${definition.employee.manager.first_name} ${definition.employee.manager.last_name}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[150px]">Puesto Jefe:</span>
                    <span className="text-slate-600">{definition.employee.manager?.position || 'N/A'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[150px]">Fecha Definición:</span>
                    {mode === 'edit' ? (
                      <input
                        type="date"
                        value={definitionDate}
                        onChange={(e) => setDefinitionDate(e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1 text-slate-600"
                      />
                    ) : (
                      <span className="text-slate-600">{new Date(definitionDate).toLocaleDateString('es-HN')}</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-white bg-blue-900 px-4 py-2 mb-4">
                  1. METAS INDIVIDUALES (Específicas del puesto, medibles, alcanzables y con tiempo definido)
                </h3>
                <div className="space-y-4">
                  {goals.map((goal, index) => (
                    <div key={goal.number} className="border-2 border-slate-300 rounded-lg p-4">
                      <div className="font-bold text-blue-900 mb-2">Meta #{goal.number}</div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Descripción de la Meta:
                          </label>
                          {mode === 'edit' ? (
                            <textarea
                              value={goal.description}
                              onChange={(e) => handleGoalChange(index, 'description', e.target.value)}
                              rows={3}
                              className="w-full border-2 border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                              placeholder="Describa la meta específica..."
                            />
                          ) : (
                            <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-3 min-h-[80px] text-slate-700 whitespace-pre-wrap">
                              {goal.description || '-'}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Medición y Resultados Esperados:
                          </label>
                          {mode === 'edit' ? (
                            <textarea
                              value={goal.measurement}
                              onChange={(e) => handleGoalChange(index, 'measurement', e.target.value)}
                              rows={3}
                              className="w-full border-2 border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                              placeholder="Indique cómo se medirá y qué resultados se esperan..."
                            />
                          ) : (
                            <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-3 min-h-[80px] text-slate-700 whitespace-pre-wrap">
                              {goal.measurement || '-'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-white bg-blue-900 px-4 py-2 mb-4">
                  2. COMPETENCIAS CONDUCTUALES / HABILIDADES
                </h3>
                <div className="space-y-3">
                  {behaviors.map((behavior, index) => (
                    <div key={behavior.number} className="flex gap-3 items-start">
                      <span className="font-bold text-blue-900 min-w-[30px]">#{behavior.number}</span>
                      {mode === 'edit' ? (
                        <textarea
                          value={behavior.description}
                          onChange={(e) => handleBehaviorChange(index, e.target.value)}
                          rows={2}
                          className="flex-1 border-2 border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                          placeholder="Describa la competencia o habilidad..."
                        />
                      ) : (
                        <div className="flex-1 bg-slate-50 border-2 border-slate-300 rounded-lg p-3 min-h-[60px] text-slate-700 whitespace-pre-wrap">
                          {behavior.description || '-'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-white bg-blue-900 px-4 py-2 mb-3">
                    Comentarios del Jefe Inmediato
                  </h3>
                  {mode === 'edit' ? (
                    <textarea
                      value={managerComments}
                      onChange={(e) => setManagerComments(e.target.value)}
                      rows={5}
                      className="w-full border-2 border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      placeholder="Comentarios adicionales del jefe inmediato..."
                    />
                  ) : (
                    <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-3 min-h-[120px] text-slate-700 whitespace-pre-wrap">
                      {managerComments || '-'}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white bg-blue-900 px-4 py-2 mb-3">
                    Comentarios del Colaborador
                  </h3>
                  {mode === 'edit' ? (
                    <textarea
                      value={employeeComments}
                      onChange={(e) => setEmployeeComments(e.target.value)}
                      rows={5}
                      className="w-full border-2 border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      placeholder="Comentarios del colaborador..."
                    />
                  ) : (
                    <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-3 min-h-[120px] text-slate-700 whitespace-pre-wrap">
                      {employeeComments || '-'}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t-2 border-slate-300 pt-6 grid grid-cols-2 gap-8 text-sm">
                <div className="text-center">
                  <div className="border-t-2 border-slate-800 pt-2 mt-16">
                    <p className="font-bold text-slate-800">Firma del Jefe Inmediato</p>
                    <p className="text-slate-600 text-xs mt-1">
                      {definition.employee.manager
                        ? `${definition.employee.manager.first_name} ${definition.employee.manager.last_name}`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t-2 border-slate-800 pt-2 mt-16">
                    <p className="font-bold text-slate-800">Firma del Colaborador</p>
                    <p className="text-slate-600 text-xs mt-1">
                      {definition.employee.first_name} {definition.employee.last_name}
                    </p>
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
