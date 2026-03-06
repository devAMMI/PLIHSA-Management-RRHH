import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, FileText, Users, Calendar, Building2, MapPin, User, Download, Printer, X, ArrowLeft, HardHat } from 'lucide-react';
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

  const [operativeGoals, setOperativeGoals] = useState([
    { number: 1, description: '', measurement: '' },
    { number: 2, description: '', measurement: '' },
    { number: 3, description: '', measurement: '' },
    { number: 4, description: '', measurement: '' },
    { number: 5, description: '', measurement: '' },
  ]);

  const [safetyStandards, setSafetyStandards] = useState([
    { number: 1, description: '' },
    { number: 2, description: '' },
    { number: 3, description: '' },
  ]);

  const [qualityIndicators, setQualityIndicators] = useState([
    { number: 1, description: '', target: '' },
    { number: 2, description: '', target: '' },
    { number: 3, description: '', target: '' },
  ]);

  const [managerComments, setManagerComments] = useState('');
  const [employeeComments, setEmployeeComments] = useState('');
  const [workArea, setWorkArea] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      const employee = employees.find(e => e.id === selectedEmployeeId);
      setSelectedEmployee(employee || null);
      setWorkArea(employee?.sub_department?.name || '');
    } else {
      setSelectedEmployee(null);
      setWorkArea('');
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

  const handleOperativeGoalChange = (index: number, field: 'description' | 'measurement', value: string) => {
    const newGoals = [...operativeGoals];
    newGoals[index][field] = value;
    setOperativeGoals(newGoals);
  };

  const handleSafetyStandardChange = (index: number, value: string) => {
    const newStandards = [...safetyStandards];
    newStandards[index].description = value;
    setSafetyStandards(newStandards);
  };

  const handleQualityIndicatorChange = (index: number, field: 'description' | 'target', value: string) => {
    const newIndicators = [...qualityIndicators];
    newIndicators[index][field] = value;
    setQualityIndicators(newIndicators);
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
          work_area: workArea,
          manager_comments: managerComments,
          employee_comments: employeeComments,
          status: 'draft'
        })
        .select()
        .single();

      if (goalError) throw goalError;

      const goalsToInsert = operativeGoals
        .filter(g => g.description.trim() !== '')
        .map(g => ({
          goal_definition_id: goalDefinition.id,
          goal_number: g.number,
          goal_description: g.description,
          measurement_and_expected_results: g.measurement
        }));

      if (goalsToInsert.length > 0) {
        const { error: goalsError } = await supabase
          .from('operative_individual_goals')
          .insert(goalsToInsert);

        if (goalsError) throw goalsError;
      }

      const standardsToInsert = safetyStandards
        .filter(s => s.description.trim() !== '')
        .map(s => ({
          goal_definition_id: goalDefinition.id,
          standard_number: s.number,
          standard_description: s.description
        }));

      if (standardsToInsert.length > 0) {
        const { error: standardsError } = await supabase
          .from('operative_safety_standards')
          .insert(standardsToInsert);

        if (standardsError) throw standardsError;
      }

      const indicatorsToInsert = qualityIndicators
        .filter(i => i.description.trim() !== '')
        .map(i => ({
          goal_definition_id: goalDefinition.id,
          indicator_number: i.number,
          indicator_description: i.description,
          target_value: i.target
        }));

      if (indicatorsToInsert.length > 0) {
        const { error: indicatorsError } = await supabase
          .from('operative_quality_indicators')
          .insert(indicatorsToInsert);

        if (indicatorsError) throw indicatorsError;
      }

      setMessage({ type: 'success', text: 'Definición de metas guardada exitosamente' });

      setTimeout(() => {
        setSelectedEmployeeId('');
        setOperativeGoals([
          { number: 1, description: '', measurement: '' },
          { number: 2, description: '', measurement: '' },
          { number: 3, description: '', measurement: '' },
          { number: 4, description: '', measurement: '' },
          { number: 5, description: '', measurement: '' },
        ]);
        setSafetyStandards([
          { number: 1, description: '' },
          { number: 2, description: '' },
          { number: 3, description: '' },
        ]);
        setQualityIndicators([
          { number: 1, description: '', target: '' },
          { number: 2, description: '', target: '' },
          { number: 3, description: '', target: '' },
        ]);
        setManagerComments('');
        setEmployeeComments('');
        setWorkArea('');
        setMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Error saving goals:', error);
      setMessage({ type: 'error', text: 'Error al guardar la definición de metas' });
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
      pdf.save(`Definicion-Metas-Operativo-${selectedEmployee?.employee_code || 'empleado'}.pdf`);
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" ref={formRef}>
        <div className="bg-white border-b-2 border-slate-300">
          <div className="grid grid-cols-12">
            <div className="col-span-3 border-r-2 border-slate-300 p-4 flex items-center justify-center">
              <img
                src="https://plihsa.com/wp-content/uploads/2023/02/Plihsa_Logo_Azul.svg"
                alt="PLIHSA Logo"
                className="w-full h-auto max-w-[180px]"
              />
            </div>
            <div className="col-span-6 border-r-2 border-slate-300 p-4 flex items-center justify-center">
              <h1 className="text-lg font-bold text-slate-800 text-center">
                Definición de Objetivos y Metas del Personal Operativo
              </h1>
            </div>
            <div className="col-span-3 p-2 text-xs">
              <div className="border-b border-slate-300 px-2 py-1">
                <span className="font-semibold">Código:</span> PL-RH-P-003-F01
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
          <div className="mb-6 print:hidden">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Users className="inline-block w-4 h-4 mr-2" />
              Seleccionar Empleado
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              <div className="bg-slate-50 rounded-lg p-6 mb-6 border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <HardHat className="w-5 h-5 mr-2 text-green-600" />
                  Información del Colaborador
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Código de Empleado</label>
                    <p className="text-sm text-slate-800 font-medium">{selectedEmployee.employee_code}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Completo</label>
                    <p className="text-sm text-slate-800 font-medium">
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Puesto</label>
                    <p className="text-sm text-slate-800 font-medium">{selectedEmployee.position}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Departamento</label>
                    <p className="text-sm text-slate-800 font-medium">
                      {selectedEmployee.department?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Área de Trabajo</label>
                    <input
                      type="text"
                      value={workArea}
                      onChange={(e) => setWorkArea(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm print:border-0 print:p-0"
                      placeholder="Ingrese área de trabajo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Supervisor Inmediato</label>
                    <p className="text-sm text-slate-800 font-medium">
                      {selectedEmployee.manager
                        ? `${selectedEmployee.manager.first_name} ${selectedEmployee.manager.last_name}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de Definición</label>
                    <input
                      type="date"
                      value={definitionDate}
                      onChange={(e) => setDefinitionDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm print:border-0 print:p-0"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-base font-bold text-slate-800 mb-4 bg-green-100 px-4 py-2 rounded-lg border-l-4 border-green-600">
                  I. Objetivos Operativos y Metas de Producción
                </h3>
                <p className="text-sm text-slate-600 mb-4 italic">
                  Defina los objetivos operativos específicos y metas de producción que el colaborador debe alcanzar durante el periodo evaluado.
                </p>
                <div className="space-y-4">
                  {operativeGoals.map((goal, index) => (
                    <div key={goal.number} className="border border-slate-200 rounded-lg p-4 bg-white">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {goal.number}
                        </span>
                        <div className="flex-1 space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Descripción del Objetivo
                            </label>
                            <textarea
                              value={goal.description}
                              onChange={(e) => handleOperativeGoalChange(index, 'description', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none print:border-0"
                              rows={2}
                              placeholder="Ej: Cumplir con la producción diaria de X unidades con calidad estándar"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Forma de Medición y Resultados Esperados
                            </label>
                            <textarea
                              value={goal.measurement}
                              onChange={(e) => handleOperativeGoalChange(index, 'measurement', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none print:border-0"
                              rows={2}
                              placeholder="Ej: Medición diaria mediante reportes de producción, meta: 100 unidades/día"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-base font-bold text-slate-800 mb-4 bg-yellow-100 px-4 py-2 rounded-lg border-l-4 border-yellow-600">
                  II. Normas de Seguridad y Cumplimiento de Procedimientos
                </h3>
                <p className="text-sm text-slate-600 mb-4 italic">
                  Especifique las normas de seguridad y procedimientos operativos que deben cumplirse estrictamente.
                </p>
                <div className="space-y-3">
                  {safetyStandards.map((standard, index) => (
                    <div key={standard.number} className="border border-slate-200 rounded-lg p-4 bg-white">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {standard.number}
                        </span>
                        <div className="flex-1">
                          <textarea
                            value={standard.description}
                            onChange={(e) => handleSafetyStandardChange(index, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none print:border-0"
                            rows={2}
                            placeholder="Ej: Uso obligatorio de equipo de protección personal (EPP) en todo momento"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-base font-bold text-slate-800 mb-4 bg-blue-100 px-4 py-2 rounded-lg border-l-4 border-blue-600">
                  III. Indicadores de Calidad y Eficiencia
                </h3>
                <p className="text-sm text-slate-600 mb-4 italic">
                  Defina los indicadores de calidad y eficiencia que medirán el desempeño del colaborador.
                </p>
                <div className="space-y-4">
                  {qualityIndicators.map((indicator, index) => (
                    <div key={indicator.number} className="border border-slate-200 rounded-lg p-4 bg-white">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {indicator.number}
                        </span>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Indicador
                            </label>
                            <textarea
                              value={indicator.description}
                              onChange={(e) => handleQualityIndicatorChange(index, 'description', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none print:border-0"
                              rows={2}
                              placeholder="Ej: Porcentaje de productos defectuosos"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Meta/Objetivo
                            </label>
                            <input
                              type="text"
                              value={indicator.target}
                              onChange={(e) => handleQualityIndicatorChange(index, 'target', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent print:border-0"
                              placeholder="Ej: Menor al 2%"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-base font-bold text-slate-800 mb-4 bg-purple-100 px-4 py-2 rounded-lg border-l-4 border-purple-600">
                  IV. Comentarios y Observaciones
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Comentarios del Supervisor
                    </label>
                    <textarea
                      value={managerComments}
                      onChange={(e) => setManagerComments(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none print:border-0"
                      rows={4}
                      placeholder="Comentarios adicionales del supervisor sobre los objetivos definidos..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Comentarios del Colaborador
                    </label>
                    <textarea
                      value={employeeComments}
                      onChange={(e) => setEmployeeComments(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none print:border-0"
                      rows={4}
                      placeholder="Comentarios del colaborador sobre los objetivos definidos..."
                    />
                  </div>
                </div>
              </div>

              <div className="border-t-2 border-slate-300 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                  <div className="text-center">
                    <div className="border-t-2 border-slate-400 pt-2 mb-2">
                      <p className="text-sm font-semibold text-slate-700">Firma del Supervisor</p>
                    </div>
                    <p className="text-xs text-slate-600">
                      {selectedEmployee.manager
                        ? `${selectedEmployee.manager.first_name} ${selectedEmployee.manager.last_name}`
                        : 'N/A'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedEmployee.manager?.position || ''}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="border-t-2 border-slate-400 pt-2 mb-2">
                      <p className="text-sm font-semibold text-slate-700">Firma del Colaborador</p>
                    </div>
                    <p className="text-xs text-slate-600">
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </p>
                    <p className="text-xs text-slate-500">{selectedEmployee.position}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 text-center italic">
                  Fecha de definición: {new Date(definitionDate).toLocaleDateString('es-HN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedEmployee && (
        <div className="mt-6 flex flex-wrap gap-4 print:hidden">
          <button
            onClick={handleSaveGoals}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed font-medium"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Guardando...' : 'Guardar Definición de Metas'}
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Download className="w-5 h-5" />
            Exportar PDF
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
          >
            <Printer className="w-5 h-5" />
            Imprimir
          </button>
        </div>
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
