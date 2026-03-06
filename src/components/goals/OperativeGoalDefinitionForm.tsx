import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Download, Printer, ArrowLeft, X, FileText } from 'lucide-react';
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
  const formRef = useRef<HTMLDivElement>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
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

  const handleSaveGoals = async () => {
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

      setTimeout(() => {
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
        setMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Error saving goals:', error);
      setMessage({ type: 'error', text: 'Error al guardar la definición de factores' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!formRef.current) return;

    try {
      const canvas = await html2canvas(formRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'letter');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Definicion-Factores-Operativo-${selectedEmployee?.employee_code || 'empleado'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage({ type: 'error', text: 'Error al generar PDF' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
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

      <div className="mb-6 print:hidden">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Seleccionar Empleado
        </label>
        <select
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- Seleccione un empleado --</option>
          {employees.map(employee => (
            <option key={employee.id} value={employee.id}>
              {employee.employee_code} - {employee.first_name} {employee.last_name} - {employee.position}
            </option>
          ))}
        </select>
      </div>

      {selectedEmployee && (
        <>
          <div className="bg-white rounded-lg shadow-lg border-2 border-slate-300 overflow-hidden" ref={formRef}>
            <div className="grid grid-cols-12 border-b-2 border-slate-300">
              <div className="col-span-3 border-r-2 border-slate-300 p-4 flex items-center justify-center bg-white">
                <div className="w-full max-w-[160px] bg-[#1e5a96] rounded-full px-6 py-3 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl tracking-wider">PLIHSA</span>
                </div>
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
                    value={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
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
                    value={selectedEmployee.position}
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
                      value={selectedEmployee.department?.name || ''}
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
                      value={selectedEmployee.sub_department?.name || ''}
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
                      value={new Date(selectedEmployee.hire_date).toLocaleDateString('es-HN')}
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
                    value={selectedEmployee.manager ? `${selectedEmployee.manager.first_name} ${selectedEmployee.manager.last_name}` : 'N/A'}
                    readOnly
                    className="w-full bg-transparent border-0 outline-none print:p-0"
                  />
                </div>
              </div>

              <div className="bg-[#1e5a96] text-white px-4 py-2.5 font-bold text-sm text-center border-b-2 border-slate-300">
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

              <div className="border-2 border-t-2 border-slate-300">
                <div className="bg-[#2c4d6f] text-white px-4 py-3 font-bold text-sm">
                  Comentarios Jefe Inmediato
                </div>
                <div className="bg-white px-4 py-3 border-b-2 border-slate-300">
                  <textarea
                    value={managerComments}
                    onChange={(e) => setManagerComments(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none resize-none text-sm print:p-0 min-h-[80px]"
                    placeholder=""
                  />
                </div>
              </div>

              <div className="border-2 border-t-0 border-slate-300">
                <div className="bg-[#2c4d6f] text-white px-4 py-3 font-bold text-sm">
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

              <div className="grid grid-cols-2 gap-8 px-8 py-8 border-2 border-t-0 border-slate-300">
                <div className="text-center">
                  <div className="border-t-2 border-slate-800 pt-2 mb-1">
                    <p className="text-sm font-semibold text-slate-800">Firma Colaborador</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t-2 border-slate-800 pt-2 mb-1">
                    <p className="text-sm font-semibold text-slate-800">Firma Jefe Inmediato</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 print:hidden">
            <button
              onClick={handleSaveGoals}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-[#1e5a96] text-white rounded-lg hover:bg-[#164575] transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed font-medium"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Guardando...' : 'Guardar Definición'}
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              Exportar PDF
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-6 py-3 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium"
            >
              <Printer className="w-5 h-5" />
              Imprimir
            </button>
          </div>
        </>
      )}

      {message && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
          message.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white flex items-center gap-2 print:hidden z-50`}>
          {message.type === 'success' ? (
            <FileText className="w-5 h-5" />
          ) : (
            <X className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}
