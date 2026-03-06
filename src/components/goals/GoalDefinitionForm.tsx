import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, FileText, Users, Calendar, Building2, MapPin, User, Download, Printer } from 'lucide-react';
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

export function GoalDefinitionForm() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" ref={formRef}>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">PLIHSA</span>
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold">Definición de Factores y Revisión del Desempeño Administrativo</h1>
                <div className="flex gap-6 mt-2 text-sm">
                  <span>Código: PL-RH-P-002-F01</span>
                  <span>Versión: 01</span>
                  <span>Fecha de Revisión: 09/07/2025</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2 bg-slate-700 text-white px-4 py-2 rounded">
                  Seleccionar Colaborador
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  required
                >
                  <option value="">-- Seleccionar empleado --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} - {emp.position}
                    </option>
                  ))}
                </select>
              </div>

              {selectedEmployee && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-white bg-slate-700 px-4 py-2 rounded mb-2">
                      Nombre del Colaborador:
                    </label>
                    <div className="px-4 py-3 bg-white border-2 border-slate-300 rounded-lg">
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-white bg-slate-700 px-4 py-2 rounded mb-2">
                      Posición del Colaborador:
                    </label>
                    <div className="px-4 py-3 bg-white border-2 border-slate-300 rounded-lg">
                      {selectedEmployee.position}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-white bg-slate-700 px-4 py-2 rounded mb-2">
                      Departamento:
                    </label>
                    <div className="px-4 py-3 bg-white border-2 border-slate-300 rounded-lg">
                      {selectedEmployee.department?.name || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-white bg-slate-700 px-4 py-2 rounded mb-2">
                      Sub-departamento:
                    </label>
                    <div className="px-4 py-3 bg-white border-2 border-slate-300 rounded-lg">
                      {selectedEmployee.sub_department?.name || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-white bg-slate-700 px-4 py-2 rounded mb-2">
                      Fecha de Ingreso:
                    </label>
                    <div className="px-4 py-3 bg-white border-2 border-slate-300 rounded-lg">
                      {new Date(selectedEmployee.hire_date).toLocaleDateString('es-HN')}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-white bg-slate-700 px-4 py-2 rounded mb-2">
                      Fecha de definición de factores a evaluar:
                    </label>
                    <input
                      type="date"
                      value={definitionDate}
                      onChange={(e) => setDefinitionDate(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>

                  {selectedEmployee.manager && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-white bg-slate-700 px-4 py-2 rounded mb-2">
                        Jefe Inmediato:
                      </label>
                      <div className="px-4 py-3 bg-white border-2 border-slate-300 rounded-lg">
                        {selectedEmployee.manager.first_name} {selectedEmployee.manager.last_name} - {selectedEmployee.manager.position}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white bg-slate-700 px-6 py-3 rounded-lg mb-4 text-center">
              DEFINICIÓN METAS INDIVIDUALES
            </h2>
            <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 bg-slate-700 text-white font-bold">
                <div className="col-span-1 px-4 py-3 border-r border-white text-center">No.</div>
                <div className="col-span-5 px-4 py-3 border-r border-white">Metas Individuales</div>
                <div className="col-span-6 px-4 py-3">Medición y Resultados Esperados</div>
              </div>
              {goals.map((goal, index) => (
                <div key={goal.number} className="grid grid-cols-12 border-b-2 border-slate-300 last:border-b-0">
                  <div className="col-span-1 px-4 py-4 border-r-2 border-slate-300 flex items-center justify-center font-bold text-slate-700">
                    {goal.number}
                  </div>
                  <div className="col-span-5 px-4 py-2 border-r-2 border-slate-300">
                    <textarea
                      value={goal.description}
                      onChange={(e) => handleGoalChange(index, 'description', e.target.value)}
                      className="w-full h-24 px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      placeholder="Descripción de la meta..."
                    />
                  </div>
                  <div className="col-span-6 px-4 py-2">
                    <textarea
                      value={goal.measurement}
                      onChange={(e) => handleGoalChange(index, 'measurement', e.target.value)}
                      className="w-full h-24 px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      placeholder="Medición y resultados esperados..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white bg-slate-700 px-6 py-3 rounded-lg mb-4 text-center">
              DEFINICIÓN DE COMPETENCIAS CONDUCTUALES/HABILIDADES
            </h2>
            <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 bg-slate-700 text-white font-bold">
                <div className="col-span-1 px-4 py-3 border-r border-white text-center">No.</div>
                <div className="col-span-11 px-4 py-3">Conductas/Habilidades (Definir las 5 Principales)</div>
              </div>
              {behaviors.map((behavior, index) => (
                <div key={behavior.number} className="grid grid-cols-12 border-b-2 border-slate-300 last:border-b-0">
                  <div className="col-span-1 px-4 py-4 border-r-2 border-slate-300 flex items-center justify-center font-bold text-slate-700">
                    {behavior.number}
                  </div>
                  <div className="col-span-11 px-4 py-2">
                    <textarea
                      value={behavior.description}
                      onChange={(e) => handleBehaviorChange(index, e.target.value)}
                      className="w-full h-20 px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      placeholder="Descripción de la conducta/habilidad..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-white bg-slate-700 px-4 py-3 rounded-t-lg">
                Comentarios Jefe Inmediato
              </label>
              <textarea
                value={managerComments}
                onChange={(e) => setManagerComments(e.target.value)}
                className="w-full h-32 px-4 py-3 border-2 border-slate-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                placeholder="Comentarios del jefe inmediato..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-white bg-slate-700 px-4 py-3 rounded-t-lg">
                Comentarios del Colaborador
              </label>
              <textarea
                value={employeeComments}
                onChange={(e) => setEmployeeComments(e.target.value)}
                className="w-full h-32 px-4 py-3 border-2 border-slate-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                placeholder="Comentarios del colaborador..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 mb-8">
            <div className="text-center">
              <div className="border-t-2 border-slate-800 pt-3 mt-24">
                <p className="text-sm font-bold text-slate-700">Firma Colaborador</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t-2 border-slate-800 pt-3 mt-24">
                <p className="text-sm font-bold text-slate-700">Firma Jefe Inmediato</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center gap-4 pt-6 border-t-2 border-slate-200">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={!selectedEmployee}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <Download className="w-5 h-5" />
                Guardar PDF
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={!selectedEmployee}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <Printer className="w-5 h-5" />
                Imprimir
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Guardando...' : 'Guardar Definición'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
