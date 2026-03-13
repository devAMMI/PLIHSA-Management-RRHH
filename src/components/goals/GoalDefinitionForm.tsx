import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, FileText, Users, Calendar, Building2, MapPin, User, Download, Printer, X, ArrowLeft } from 'lucide-react';
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
  const formRef = useRef<HTMLDivElement>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
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
      setSubDepartment('');
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
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!formRef.current || !selectedEmployee) return;

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

      const fileName = `Definicion_Metas_${selectedEmployee.first_name}_${selectedEmployee.last_name}_${definitionDate}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage({ type: 'error', text: 'Error al generar el PDF' });
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

      setMessage({ type: 'success', text: 'Definición de metas guardada exitosamente' });

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

    } catch (error: any) {
      console.error('Error saving goal definition:', error);
      setMessage({ type: 'error', text: error.message || 'Error al guardar la definición de metas' });
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
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              >
                <option value="">-- Seleccionar empleado --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
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
                onClick={handleSave}
                disabled={loading || !selectedEmployeeId}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={!selectedEmployeeId}
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar PDF
              </button>
              <button
                onClick={() => window.print()}
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
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" ref={formRef}>
        <div className="bg-white border-b-2 border-slate-300">
          <div className="grid grid-cols-12">
            <div className="col-span-3 border-r-2 border-slate-300 p-4 flex items-center justify-center">
              <img
                src="/Logo_PLIHSA_BLUE.png"
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

        <div className="p-8">
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
                  value={subDepartment}
                  onChange={(e) => setSubDepartment(e.target.value)}
                  className="w-full bg-transparent border-0 outline-none print:p-0"
                  placeholder=""
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

          <div className="bg-[#1e5a96] text-white px-4 py-2.5 font-bold text-sm text-center border-b-2 border-t-2 border-slate-300 mt-4">
            DEFINICIÓN METAS INDIVIDUALES
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1e5a96] text-white">
                <th className="border-2 border-slate-300 px-3 py-2 text-sm font-bold text-center w-16">No.</th>
                <th className="border-2 border-slate-300 px-3 py-2 text-sm font-bold text-center">Metas Individuales</th>
                <th className="border-2 border-slate-300 px-3 py-2 text-sm font-bold text-center">Medición y Resultados Esperados</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((goal, index) => (
                <tr key={goal.number}>
                  <td className="border-2 border-slate-300 px-3 py-3 text-center font-semibold text-sm bg-white">
                    {goal.number}
                  </td>
                  <td className="border-2 border-slate-300 px-3 py-2 bg-white">
                    <textarea
                      value={goal.description}
                      onChange={(e) => handleGoalChange(index, 'description', e.target.value)}
                      className="w-full bg-transparent border-0 outline-none resize-none text-sm print:p-0 min-h-[80px]"
                      placeholder=""
                    />
                  </td>
                  <td className="border-2 border-slate-300 px-3 py-2 bg-white">
                    <textarea
                      value={goal.measurement}
                      onChange={(e) => handleGoalChange(index, 'measurement', e.target.value)}
                      className="w-full bg-transparent border-0 outline-none resize-none text-sm print:p-0 min-h-[80px]"
                      placeholder=""
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bg-[#1e5a96] text-white px-4 py-2.5 font-bold text-sm text-center border-b-2 border-t-2 border-slate-300 mt-4">
            DEFINICIÓN DE COMPETENCIAS CONDUCTUALES/HABILIDADES
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1e5a96] text-white">
                <th className="border-2 border-slate-300 px-3 py-2 text-sm font-bold text-center w-16">No.</th>
                <th className="border-2 border-slate-300 px-3 py-2 text-sm font-bold text-center">
                  Conductas/Habilidades (Definir las 5 Principales)
                </th>
              </tr>
            </thead>
            <tbody>
              {behaviors.map((behavior, index) => (
                <tr key={behavior.number}>
                  <td className="border-2 border-slate-300 px-3 py-3 text-center font-semibold text-sm bg-white">
                    {behavior.number}
                  </td>
                  <td className="border-2 border-slate-300 px-3 py-2 bg-white">
                    <textarea
                      value={behavior.description}
                      onChange={(e) => handleBehaviorChange(index, e.target.value)}
                      className="w-full bg-transparent border-0 outline-none resize-none text-sm print:p-0 min-h-[50px]"
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
