import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Save, Download, Printer, ArrowLeft, X, FileText, FilePlus } from 'lucide-react';
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

interface OperativeGoalDefinitionFormProps {
  onBack?: () => void;
}

export function OperativeGoalDefinitionForm({ onBack }: OperativeGoalDefinitionFormProps) {
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

  const [functionalFactors, setFunctionalFactors] = useState([
    { number: 1, jobFunction: '', expectedResults: '' },
    { number: 2, jobFunction: '', expectedResults: '' },
    { number: 3, jobFunction: '', expectedResults: '' },
    { number: 4, jobFunction: '', expectedResults: '' },
    { number: 5, jobFunction: '', expectedResults: '' },
  ]);

  const [behavioralCompetencies, setBehavioralCompetencies] = useState([
    { number: 1, description: '' },
    { number: 2, description: '' },
    { number: 3, description: '' },
    { number: 4, description: '' },
    { number: 5, description: '' },
  ]);

  const [managerComments, setManagerComments] = useState('');
  const [employeeComments, setEmployeeComments] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      const employee = employees.find(e => e.id === selectedEmployeeId);
      setSelectedEmployee(employee || null);
    } else {
      setSelectedEmployee(null);
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

  const handleFunctionalFactorChange = (index: number, field: 'jobFunction' | 'expectedResults', value: string) => {
    const newFactors = [...functionalFactors];
    newFactors[index][field] = value;
    setFunctionalFactors(newFactors);
  };

  const handleBehavioralCompetencyChange = (index: number, value: string) => {
    const newCompetencies = [...behavioralCompetencies];
    newCompetencies[index].description = value;
    setBehavioralCompetencies(newCompetencies);
  };

  const handleSave = async () => {
    if (!selectedEmployeeId) {
      setMessage({ type: 'error', text: 'Por favor seleccione un empleado' });
      return;
    }

    setLoading(true);
    try {
      const { data: goalDefinition, error: goalError } = await supabase
        .from('operative_goal_definitions')
        .insert({
          employee_id: selectedEmployeeId,
          evaluation_period: 'ENERO 2026',
          definition_date: definitionDate,
          work_area: selectedEmployee?.sub_department?.name || '',
          manager_comments: managerComments,
          employee_comments: employeeComments,
          status: 'draft'
        })
        .select()
        .single();

      if (goalError) throw goalError;

      const goalsToInsert = functionalFactors
        .filter(f => f.jobFunction.trim() !== '')
        .map(f => ({
          goal_definition_id: goalDefinition.id,
          goal_number: f.number,
          goal_description: f.jobFunction,
          measurement_and_expected_results: f.expectedResults
        }));

      if (goalsToInsert.length > 0) {
        const { error: goalsError } = await supabase
          .from('operative_individual_goals')
          .insert(goalsToInsert);

        if (goalsError) throw goalsError;
      }

      const competenciesToInsert = behavioralCompetencies
        .filter(c => c.description.trim() !== '')
        .map(c => ({
          goal_definition_id: goalDefinition.id,
          standard_number: c.number,
          standard_description: c.description
        }));

      if (competenciesToInsert.length > 0) {
        const { error: competenciesError } = await supabase
          .from('operative_safety_standards')
          .insert(competenciesToInsert);

        if (competenciesError) throw competenciesError;
      }

      setMessage({ type: 'success', text: 'Definición de factores guardada exitosamente' });

    } catch (error) {
      console.error('Error saving goals:', error);
      setMessage({ type: 'error', text: 'Error al guardar la definición de factores' });
    } finally {
      setLoading(false);
    }
  };

  const handleNewDefinition = () => {
    setSelectedEmployeeId('');
    setFunctionalFactors([
      { number: 1, jobFunction: '', expectedResults: '' },
      { number: 2, jobFunction: '', expectedResults: '' },
      { number: 3, jobFunction: '', expectedResults: '' },
      { number: 4, jobFunction: '', expectedResults: '' },
      { number: 5, jobFunction: '', expectedResults: '' },
    ]);
    setBehavioralCompetencies([
      { number: 1, description: '' },
      { number: 2, description: '' },
      { number: 3, description: '' },
      { number: 4, description: '' },
      { number: 5, description: '' },
    ]);
    setManagerComments('');
    setEmployeeComments('');
    setDefinitionDate(new Date().toISOString().split('T')[0]);
    setMessage(null);
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
            <title>Imprimir Definicion de Factores Operativo</title>
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

      const fileName = `Definicion_Factores_Op_${selectedEmployee.first_name}_${selectedEmployee.last_name}_${definitionDate}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage({ type: 'error', text: 'Error al generar PDF' });
    } finally {
      setLoading(false);
    }
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
          <div className="bg-white rounded-lg shadow-lg border-2 border-slate-300 overflow-hidden" ref={formRef}>
        <div className="grid grid-cols-12 border-b-2 border-slate-300">
          <div className="col-span-3 border-r-2 border-slate-300 p-4 flex items-center justify-center bg-white">
            <img
              src="https://i.imgur.com/hii0TM1.png"
              alt="PLIHSA Logo"
              className="w-full h-auto max-w-[180px]"
              crossOrigin="anonymous"
            />
          </div>
          <div className="col-span-6 border-r-2 border-slate-300 p-4 flex items-center justify-center bg-white">
            <h1 className="text-base font-bold text-center text-slate-800">
              Definición de Factores y Revisión del Desempeño Operativo
            </h1>
          </div>
          <div className="col-span-3 bg-white">
            <div className="text-xs border-b border-slate-300 px-3 py-1.5">
              <span className="font-normal">Código: PL-RH-P-002-F04</span>
            </div>
            <div className="text-xs border-b border-slate-300 px-3 py-1.5">
              <span className="font-normal">Versión: 01</span>
            </div>
            <div className="text-xs px-3 py-1.5">
              <span className="font-normal">Fecha de Revisión: 09/07/2025</span>
            </div>
          </div>
        </div>

        <div className="p-0">
          <div className="grid grid-cols-12">
            <div className="col-span-12 bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm border-b-2 border-slate-300">
              Nombre del Colaborador:
            </div>
            <div className="col-span-12 bg-slate-100 px-4 py-2 text-sm border-b-2 border-slate-300">
              <input
                type="text"
                value={selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : ''}
                readOnly
                className="w-full bg-transparent border-0 outline-none print:p-0"
              />
            </div>
          </div>

          <div className="grid grid-cols-12">
            <div className="col-span-12 bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm border-b-2 border-slate-300">
              Posición del Colaborador:
            </div>
            <div className="col-span-12 bg-slate-100 px-4 py-2 text-sm border-b-2 border-slate-300">
              <input
                type="text"
                value={selectedEmployee?.position || ''}
                readOnly
                className="w-full bg-transparent border-0 outline-none print:p-0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2">
            <div className="col-span-1 border-r-2 border-slate-300">
              <div className="bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm border-b-2 border-slate-300">
                Departamento:
              </div>
              <div className="bg-slate-100 px-4 py-2 text-sm border-b-2 border-slate-300">
                <input
                  type="text"
                  value={selectedEmployee?.department?.name || ''}
                  readOnly
                  className="w-full bg-transparent border-0 outline-none print:p-0"
                />
              </div>
            </div>
            <div className="col-span-1">
              <div className="bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm border-b-2 border-slate-300">
                Sub-departamento:
              </div>
              <div className="bg-slate-100 px-4 py-2 text-sm border-b-2 border-slate-300">
                <input
                  type="text"
                  value={selectedEmployee?.sub_department?.name || ''}
                  readOnly
                  className="w-full bg-transparent border-0 outline-none print:p-0"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2">
            <div className="col-span-1 border-r-2 border-slate-300">
              <div className="bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm border-b-2 border-slate-300">
                Fecha de Ingreso:
              </div>
              <div className="bg-slate-100 px-4 py-2 text-sm border-b-2 border-slate-300">
                <input
                  type="text"
                  value={selectedEmployee ? new Date(selectedEmployee.hire_date).toLocaleDateString('es-HN') : ''}
                  readOnly
                  className="w-full bg-transparent border-0 outline-none print:p-0"
                />
              </div>
            </div>
            <div className="col-span-1">
              <div className="bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm border-b-2 border-slate-300">
                Fecha de definición de factores a evaluar:
              </div>
              <div className="bg-slate-100 px-4 py-2 text-sm border-b-2 border-slate-300">
                <input
                  type="date"
                  value={definitionDate}
                  onChange={(e) => setDefinitionDate(e.target.value)}
                  className="w-full bg-transparent border-0 outline-none print:p-0"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12">
            <div className="col-span-12 bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm border-b-2 border-slate-300">
              Jefe Inmediato:
            </div>
            <div className="col-span-12 bg-slate-100 px-4 py-2 text-sm border-b-2 border-slate-300">
              <input
                type="text"
                value={selectedEmployee?.manager ? `${selectedEmployee.manager.first_name} ${selectedEmployee.manager.last_name}` : ''}
                readOnly
                className="w-full bg-transparent border-0 outline-none print:p-0"
              />
            </div>
          </div>

          <div className="bg-[#1e5a96] text-white px-4 py-2.5 font-bold text-sm text-center border-b-2 border-t-2 border-slate-300">
            DEFINICIÓN DE FACTORES FUNCIONALES
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1e5a96] text-white">
                <th className="border-2 border-slate-300 px-3 py-2 text-sm font-bold text-center w-16">No.</th>
                <th className="border-2 border-slate-300 px-3 py-2 text-sm font-bold text-center">Funciones del Puesto</th>
                <th className="border-2 border-slate-300 px-3 py-2 text-sm font-bold text-center">Resultados Esperados</th>
              </tr>
            </thead>
            <tbody>
              {functionalFactors.map((factor, index) => (
                <tr key={factor.number}>
                  <td className="border-2 border-slate-300 px-3 py-3 text-center font-semibold text-sm bg-white">
                    {factor.number}
                  </td>
                  <td className="border-2 border-slate-300 px-3 py-2 bg-white">
                    <textarea
                      value={factor.jobFunction}
                      onChange={(e) => handleFunctionalFactorChange(index, 'jobFunction', e.target.value)}
                      className="w-full bg-transparent border-0 outline-none resize-none text-sm print:p-0 min-h-[60px]"
                      placeholder=""
                    />
                  </td>
                  <td className="border-2 border-slate-300 px-3 py-2 bg-white">
                    <textarea
                      value={factor.expectedResults}
                      onChange={(e) => handleFunctionalFactorChange(index, 'expectedResults', e.target.value)}
                      className="w-full bg-transparent border-0 outline-none resize-none text-sm print:p-0 min-h-[60px]"
                      placeholder=""
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bg-[#1e5a96] text-white px-4 py-2.5 font-bold text-sm text-center border-b-2 border-t-2 border-slate-300">
            DEFINICIÓN DE COMPETENCIAS CONDUCTUALES Y HABILIDADES TÉCNICAS
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1e5a96] text-white">
                <th className="border-2 border-slate-300 px-3 py-2 text-sm font-bold text-center w-16">No.</th>
                <th className="border-2 border-slate-300 px-3 py-2 text-sm font-bold text-center">
                  Conductas y Habilidades Técnicas (Definir las 5 Principales)
                </th>
              </tr>
            </thead>
            <tbody>
              {behavioralCompetencies.map((competency, index) => (
                <tr key={competency.number}>
                  <td className="border-2 border-slate-300 px-3 py-3 text-center font-semibold text-sm bg-white">
                    {competency.number}
                  </td>
                  <td className="border-2 border-slate-300 px-3 py-2 bg-white">
                    <textarea
                      value={competency.description}
                      onChange={(e) => handleBehavioralCompetencyChange(index, e.target.value)}
                      className="w-full bg-transparent border-0 outline-none resize-none text-sm print:p-0 min-h-[60px]"
                      placeholder=""
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-2 border-slate-300 mt-4">
            <div className="bg-[#2c5282] text-white px-4 py-3 font-bold text-sm">
              Comentarios Jefe Inmediato
            </div>
            <div className="bg-white px-4 py-3">
              <textarea
                value={managerComments}
                onChange={(e) => setManagerComments(e.target.value)}
                className="w-full bg-transparent border-0 outline-none resize-none text-sm print:p-0 min-h-[80px]"
                placeholder=""
              />
            </div>
          </div>

          <div className="border-2 border-slate-300 mt-4">
            <div className="bg-[#2c5282] text-white px-4 py-3 font-bold text-sm">
              Comentarios del Colaborador
            </div>
            <div className="bg-white px-4 py-3">
              <textarea
                value={employeeComments}
                onChange={(e) => setEmployeeComments(e.target.value)}
                className="w-full bg-transparent border-0 outline-none resize-none text-sm print:p-0 min-h-[80px]"
                placeholder=""
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-32 px-12 py-8 mt-8">
            <div className="text-center">
              <div className="border-t-2 border-slate-800 pt-2 mt-16">
                <p className="text-sm font-semibold text-slate-800">Firma Colaborador</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t-2 border-slate-800 pt-2 mt-16">
                <p className="text-sm font-semibold text-slate-800">Firma Jefe Inmediato</p>
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
