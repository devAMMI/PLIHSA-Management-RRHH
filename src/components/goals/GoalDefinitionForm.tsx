import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Save, FileText, Users, Calendar, Building2, MapPin, User, Download, Printer, X, ArrowLeft, FilePlus } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  position: string;
  hire_date: string;
  department: { name: string } | null;
  sub_department: { name: string } | null;
  manager: { first_name: string; last_name: string; position: string } | null;
}

interface GoalDefinitionFormProps {
  onBack?: () => void;
}

export function GoalDefinitionForm({ onBack }: GoalDefinitionFormProps) {
  const { systemUser } = useAuth();
  const formRef = useRef<HTMLDivElement>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const restrictedRoles = ['jefe', 'manager'];
  const canSelfEvaluate = systemUser?.role && !restrictedRoles.includes(systemUser.role);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [definitionDate, setDefinitionDate] = useState(new Date().toISOString().split('T')[0]);

  const [goals, setGoals] = useState([
    { number: 1, description: '', measurement: '' },
    { number: 2, description: '', measurement: '' },
    { number: 3, description: '', measurement: '' },
    { number: 4, description: '', measurement: '' },
    { number: 5, description: '', measurement: '' },
  ]);

  const [behaviors, setBehaviors] = useState([
    { number: 1, description: '' },
    { number: 2, description: '' },
    { number: 3, description: '' },
    { number: 4, description: '' },
    { number: 5, description: '' },
  ]);

  const [managerComments, setManagerComments] = useState('');
  const [employeeComments, setEmployeeComments] = useState('');
  const [subDepartment, setSubDepartment] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      const employee = employees.find(e => e.id === selectedEmployeeId);
      setSelectedEmployee(employee || null);
      setSubDepartment((employee?.sub_department as any)?.name || '');
    } else {
      setSelectedEmployee(null);
      setSubDepartment('');
    }
  }, [selectedEmployeeId, employees]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          employee_code,
          first_name,
          last_name,
          position,
          hire_date,
          department:departments(name),
          sub_department:sub_departments(name),
          manager:manager_id(first_name, last_name, position)
        `)
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      setMessage({ type: 'error', text: 'Error al cargar empleados' });
    }
  };

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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && formRef.current) {
      const styles = Array.from(document.styleSheets)
        .map(styleSheet => {
          try {
            return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('\n');
          } catch {
            return '';
          }
        })
        .join('\n');

      printWindow.document.write(`
        <html>
          <head>
            <title>Imprimir Definicion de Metas</title>
            <style>${styles}body { margin: 0; padding: 20px; }@media print { body { margin: 0; padding: 0; } }</style>
          </head>
          <body>${formRef.current.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  const handleDownloadPDF = async () => {
    if (!formRef.current || !selectedEmployee) return;

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

      if (imgHeight <= pageHeight) {
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        let position = 0;
        let remainingHeight = imgHeight;
        let firstPage = true;
        while (remainingHeight > 0) {
          if (!firstPage) pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -position, imgWidth, imgHeight);
          position += pageHeight;
          remainingHeight -= pageHeight;
          firstPage = false;
        }
      }

      const fileName = `Definicion_Metas_Adm_${selectedEmployee.first_name}_${selectedEmployee.last_name}_${definitionDate}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage({ type: 'error', text: 'Error al generar el PDF' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {

    if (!selectedEmployeeId) {
      setMessage({ type: 'error', text: 'Por favor seleccione un empleado' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: goalDef, error: goalDefError } = await supabase
        .from('goal_definitions')
        .insert({
          employee_id: selectedEmployeeId,
          evaluation_period: 'Q1-2026',
          definition_date: definitionDate,
          employee_comments: employeeComments,
          manager_comments: managerComments,
          sub_department: subDepartment.trim() || null,
          status: 'draft',
          created_by: user.id
        })
        .select()
        .single();

      if (goalDefError) throw goalDefError;

      const goalsToInsert = goals
        .filter(g => g.description.trim() || g.measurement.trim())
        .map(g => ({
          goal_definition_id: goalDef.id,
          goal_number: g.number,
          goal_description: g.description,
          measurement_and_expected_results: g.measurement
        }));

      if (goalsToInsert.length > 0) {
        const { error: goalsError } = await supabase
          .from('individual_goals')
          .insert(goalsToInsert);

        if (goalsError) throw goalsError;
      }

      const behaviorsToInsert = behaviors
        .filter(b => b.description.trim())
        .map(b => ({
          goal_definition_id: goalDef.id,
          behavior_number: b.number,
          behavior_description: b.description
        }));

      if (behaviorsToInsert.length > 0) {
        const { error: behaviorsError } = await supabase
          .from('competency_behaviors')
          .insert(behaviorsToInsert);

        if (behaviorsError) throw behaviorsError;
      }

      if (systemUser?.id) {
        await supabase.from('evaluation_audit_logs').insert({
          action_type: 'created',
          evaluation_type: 'administrativa',
          evaluation_id: goalDef.id,
          evaluator_system_user_id: systemUser.id,
          evaluator_employee_id: systemUser.employee_id || null,
          evaluated_employee_id: selectedEmployeeId,
        });
      }

      setMessage({ type: 'success', text: 'Definición de metas guardada exitosamente' });

    } catch (error: any) {
      console.error('Error saving goal definition:', error);
      setMessage({ type: 'error', text: error.message || 'Error al guardar la definición de metas' });
    } finally {
      setLoading(false);
    }
  };

  const handleNewDefinition = () => {
    setGoals([
      { number: 1, description: '', measurement: '' },
      { number: 2, description: '', measurement: '' },
      { number: 3, description: '', measurement: '' },
      { number: 4, description: '', measurement: '' },
      { number: 5, description: '', measurement: '' },
    ]);
    setBehaviors([
      { number: 1, description: '' },
      { number: 2, description: '' },
      { number: 3, description: '' },
      { number: 4, description: '' },
      { number: 5, description: '' },
    ]);
    setManagerComments('');
    setEmployeeComments('');
    setSelectedEmployeeId('');
    setSubDepartment('');
    setDefinitionDate(new Date().toISOString().split('T')[0]);
    setMessage(null);
  };

  return (
    <div className="max-w-[1800px] mx-auto p-6">
      {onBack && (
        <div className="mb-4">
          <button
            onClick={onBack}
            className="flex items-center text-slate-600 hover:text-slate-800 transition-colors print:hidden"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Volver a selección de tipo</span>
          </button>
        </div>
      )}

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'} print:hidden`}>
          <div className="flex items-center justify-between">
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-xl">×</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6 print:grid-cols-1 print:gap-0">
        <div className="col-span-3 print:hidden">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 sticky top-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Seleccione Empleado</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Buscar Colaborador
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!canSelfEvaluate && val === systemUser?.employee_id) {
                    setMessage({ type: 'error', text: 'Usted no se puede evaluar usted mismo.' });
                    return;
                  }
                  setSelectedEmployeeId(val);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              >
                <option value="">-- Seleccionar empleado --</option>
                {employees.map((emp) => (
                  <option
                    key={emp.id}
                    value={emp.id}
                    disabled={!canSelfEvaluate && emp.id === systemUser?.employee_id}
                  >
                    {emp.first_name} {emp.last_name}
                    {!canSelfEvaluate && emp.id === systemUser?.employee_id ? ' (no permitido)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedEmployee && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Información del Colaborador</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Nombre:</span>
                    <p className="text-slate-600">{selectedEmployee.first_name} {selectedEmployee.last_name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Posición:</span>
                    <p className="text-slate-600">{selectedEmployee.position}</p>
                  </div>
                  <div>
                    <span className="font-medium">Departamento:</span>
                    <p className="text-slate-600">{selectedEmployee.department?.name || 'N/A'}</p>
                  </div>
                  {selectedEmployee.sub_department && (
                    <div>
                      <span className="font-medium">Sub-departamento:</span>
                      <p className="text-slate-600">{selectedEmployee.sub_department.name}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Jefe Inmediato:</span>
                    <p className="text-slate-600">
                      {selectedEmployee.manager
                        ? `${selectedEmployee.manager.first_name} ${selectedEmployee.manager.last_name}`
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t pt-4 mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha de Definición
              </label>
              <input
                type="date"
                value={definitionDate}
                onChange={(e) => setDefinitionDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex flex-col gap-2 mt-6">
              <button
                onClick={handleNewDefinition}
                className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors font-medium"
              >
                <FilePlus className="w-4 h-4" />
                Nueva
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !selectedEmployeeId}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={loading || !selectedEmployeeId}
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                {loading ? 'Generando...' : 'Descargar PDF'}
              </button>
              <button
                onClick={handlePrint}
                disabled={!selectedEmployeeId}
                className="flex items-center justify-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-9 print:col-span-12">
          <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden" ref={formRef}>
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
                <div className="col-span-3 flex flex-col justify-center text-[8px]">
                  <div className="border-b border-slate-300 py-1.5 text-center">
                    <span className="font-semibold">Código:</span> PL-RH-P-002-F01
                  </div>
                  <div className="border-b border-slate-300 py-1.5 text-center">
                    <span className="font-semibold">Versión:</span> 01
                  </div>
                  <div className="py-1.5 text-center">
                    <span className="font-semibold">Fecha de Revisión:</span> 09/07/2025
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5 text-[11px]">
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[100px]">Código:</span>
                    <span className="text-slate-600">{selectedEmployee?.employee_code || ''}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[100px]">Nombre:</span>
                    <span className="text-slate-600">{selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : ''}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[100px]">Puesto:</span>
                    <span className="text-slate-600">{selectedEmployee?.position || ''}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[100px]">Departamento:</span>
                    <span className="text-slate-600">{selectedEmployee?.department?.name || ''}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[100px]">Sub Depto:</span>
                    <input
                      type="text"
                      value={subDepartment}
                      onChange={(e) => setSubDepartment(e.target.value)}
                      className="text-slate-600 border border-slate-300 rounded px-2 py-0.5 text-[11px] flex-1"
                      placeholder="Sub-departamento..."
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[120px]">Fecha de Ingreso:</span>
                    <span className="text-slate-600">
                      {selectedEmployee ? new Date(selectedEmployee.hire_date + 'T00:00:00').toLocaleDateString('es-HN') : ''}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[120px]">Jefe Inmediato:</span>
                    <span className="text-slate-600">
                      {selectedEmployee?.manager ? `${selectedEmployee.manager.first_name} ${selectedEmployee.manager.last_name}` : ''}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[120px]">Fecha Definición:</span>
                    <input
                      type="date"
                      value={definitionDate}
                      onChange={(e) => setDefinitionDate(e.target.value)}
                      className="border border-slate-300 rounded px-1 py-0.5 text-slate-600 text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-white bg-blue-900 px-3 py-2 mb-3 text-[11px]">
                  DEFINICIÓN METAS INDIVIDUALES
                </h3>
                <table className="w-full border-2 border-slate-300 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-2 py-1.5 w-10 font-bold">No.</th>
                      <th className="border border-slate-300 px-2 py-1.5 font-bold">Metas Individuales</th>
                      <th className="border border-slate-300 px-2 py-1.5 font-bold">Medición y Resultados Esperados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goals.map((goal, index) => (
                      <tr key={goal.number}>
                        <td className="border border-slate-300 px-2 py-2 text-center font-bold">{goal.number}</td>
                        <td className="border border-slate-300 px-2 py-2">
                          <textarea
                            value={goal.description}
                            onChange={(e) => handleGoalChange(index, 'description', e.target.value)}
                            rows={2}
                            className="w-full border border-slate-200 rounded p-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-[10px]"
                            placeholder="Describa la meta..."
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-2">
                          <textarea
                            value={goal.measurement}
                            onChange={(e) => handleGoalChange(index, 'measurement', e.target.value)}
                            rows={2}
                            className="w-full border border-slate-200 rounded p-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-[10px]"
                            placeholder="Indique medición..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="font-bold text-white bg-blue-900 px-3 py-2 mb-3 text-[11px]">
                  DEFINICIÓN DE COMPETENCIAS CONDUCTUALES/HABILIDADES
                </h3>
                <table className="w-full border-2 border-slate-300 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-2 py-1.5 w-10 font-bold">No.</th>
                      <th className="border border-slate-300 px-2 py-1.5 font-bold">Conductas/Habilidades (Definir las 5 Principales)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {behaviors.map((behavior, index) => (
                      <tr key={behavior.number}>
                        <td className="border border-slate-300 px-2 py-2 text-center font-bold">{behavior.number}</td>
                        <td className="border border-slate-300 px-2 py-2">
                          <textarea
                            value={behavior.description}
                            onChange={(e) => handleBehaviorChange(index, e.target.value)}
                            rows={1}
                            className="w-full border border-slate-200 rounded p-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-[10px]"
                            placeholder="Describa la competencia..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-slate-300">
                  <div className="bg-blue-900 text-white px-3 py-1.5 text-[10px] font-bold">
                    Comentarios Jefe Inmediato
                  </div>
                  <textarea
                    value={managerComments}
                    onChange={(e) => setManagerComments(e.target.value)}
                    rows={4}
                    className="w-full border-0 p-3 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-[10px]"
                    placeholder="Comentarios del jefe..."
                  />
                </div>
                <div className="border-2 border-slate-300">
                  <div className="bg-blue-900 text-white px-3 py-1.5 text-[10px] font-bold">
                    Comentarios del Colaborador
                  </div>
                  <textarea
                    value={employeeComments}
                    onChange={(e) => setEmployeeComments(e.target.value)}
                    rows={4}
                    className="w-full border-0 p-3 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-[10px]"
                    placeholder="Comentarios del colaborador..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 text-[10px] mt-12 pt-8">
                <div className="text-center">
                  <div className="border-t-2 border-slate-800 pt-2 mt-24">
                    <p className="font-bold text-slate-800">Firma Colaborador</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t-2 border-slate-800 pt-2 mt-24">
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
