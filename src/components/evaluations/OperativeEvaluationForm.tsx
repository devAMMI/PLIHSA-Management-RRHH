import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface FunctionalFactor {
  factor_number: number;
  job_function: string;
  expected_results: string;
}

interface Competency {
  competency_number: number;
  competency_description: string;
}

interface EvaluationPeriod {
  id: string;
  name: string;
  form_code: string;
  form_version: string;
  start_date: string;
  end_date: string;
}

export function OperativeEvaluationForm() {
  const { employee, systemUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState<EvaluationPeriod | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const [formData, setFormData] = useState({
    department: '',
    sub_department: '',
    definition_date: '',
    manager_comments: '',
    employee_comments: ''
  });

  const [functionalFactors, setFunctionalFactors] = useState<FunctionalFactor[]>(
    Array.from({ length: 5 }, (_, i) => ({
      factor_number: i + 1,
      job_function: '',
      expected_results: ''
    }))
  );

  const [competencies, setCompetencies] = useState<Competency[]>(
    Array.from({ length: 5 }, (_, i) => ({
      competency_number: i + 1,
      competency_description: ''
    }))
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      const emp = employees.find(e => e.id === selectedEmployeeId);
      setSelectedEmployee(emp);
      if (emp) {
        setFormData(prev => ({
          ...prev,
          department: emp.department_name || '',
          sub_department: ''
        }));
      }
    }
  }, [selectedEmployeeId, employees]);

  const loadData = async () => {
    try {
      const { data: periodData } = await supabase
        .from('evaluation_periods')
        .select('*')
        .eq('status', 'active')
        .eq('employee_type', 'operativo')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (periodData) {
        setPeriod(periodData);
      }

      const { data: employeesData } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          email,
          position,
          employee_code,
          employee_type,
          hire_date,
          department_id,
          direct_manager_id,
          departments (
            name
          )
        `)
        .eq('employee_type', 'operativo')
        .eq('company_id', (await supabase.from('companies').select('id').eq('name', 'PLIHSA').maybeSingle()).data?.id)
        .eq('status', 'active')
        .order('first_name');

      const formattedEmployees = (employeesData || []).map(emp => ({
        ...emp,
        department_name: emp.departments?.name || 'Sin departamento'
      }));

      setEmployees(formattedEmployees);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFactorChange = (index: number, field: keyof FunctionalFactor, value: string) => {
    const newFactors = [...functionalFactors];
    newFactors[index] = { ...newFactors[index], [field]: value };
    setFunctionalFactors(newFactors);
  };

  const handleCompetencyChange = (index: number, value: string) => {
    const newCompetencies = [...competencies];
    newCompetencies[index] = { ...newCompetencies[index], competency_description: value };
    setCompetencies(newCompetencies);
  };

  const handleSave = async () => {
    if (!selectedEmployeeId || !period) {
      alert('Por favor seleccione un empleado');
      return;
    }

    setSaving(true);
    try {
      const { data: evaluation, error: evalError } = await supabase
        .from('operative_evaluations')
        .upsert({
          evaluation_period_id: period.id,
          employee_id: selectedEmployeeId,
          employee_position: selectedEmployee?.position,
          department: formData.department,
          sub_department: formData.sub_department,
          hire_date: selectedEmployee?.hire_date,
          manager_id: selectedEmployee?.direct_manager_id,
          definition_date: formData.definition_date || null,
          manager_comments: formData.manager_comments,
          employee_comments: formData.employee_comments,
          status: 'draft'
        }, { onConflict: 'evaluation_period_id,employee_id' })
        .select()
        .single();

      if (evalError) throw evalError;

      for (const factor of functionalFactors) {
        await supabase
          .from('evaluation_functional_factors')
          .upsert({
            evaluation_id: evaluation.id,
            factor_number: factor.factor_number,
            job_function: factor.job_function,
            expected_results: factor.expected_results
          }, { onConflict: 'evaluation_id,factor_number' });
      }

      for (const comp of competencies) {
        await supabase
          .from('operative_evaluation_competencies')
          .upsert({
            evaluation_id: evaluation.id,
            competency_number: comp.competency_number,
            competency_description: comp.competency_description
          }, { onConflict: 'evaluation_id,competency_number' });
      }

      alert('Evaluación guardada exitosamente');
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert('Error al guardar la evaluación');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  if (!period) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">No hay períodos de evaluación activos para empleados operativos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-lg">
                <img src="/Profile-pic-plihsa-logo-foto.jpg" alt="PLIHSA" className="h-12" />
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold">Definición de Factores y Revisión del Desempeño Operativo</h1>
                <p className="text-blue-100 mt-1">Código: {period.form_code} | Versión: {period.form_version}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre del Colaborador *
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccione un colaborador</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} - {emp.position}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Posición del Colaborador
              </label>
              <input
                type="text"
                value={selectedEmployee?.position || ''}
                disabled
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Departamento
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sub-departamento
              </label>
              <input
                type="text"
                value={formData.sub_department}
                onChange={(e) => setFormData({ ...formData, sub_department: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha de Ingreso
              </label>
              <input
                type="date"
                value={selectedEmployee?.hire_date || ''}
                disabled
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha de definición de factores a evaluar
              </label>
              <input
                type="date"
                value={formData.definition_date}
                onChange={(e) => setFormData({ ...formData, definition_date: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-blue-600 text-white px-6 py-3 rounded-lg mb-4">
              <h2 className="text-lg font-bold">DEFINICIÓN DE FACTORES FUNCIONALES</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-700 w-12">No.</th>
                    <th className="border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-700">Funciones del Puesto</th>
                    <th className="border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-700">Resultados Esperados</th>
                  </tr>
                </thead>
                <tbody>
                  {functionalFactors.map((factor, index) => (
                    <tr key={factor.factor_number}>
                      <td className="border border-slate-300 px-4 py-3 text-center font-medium">{factor.factor_number}</td>
                      <td className="border border-slate-300 p-2">
                        <textarea
                          value={factor.job_function}
                          onChange={(e) => handleFactorChange(index, 'job_function', e.target.value)}
                          className="w-full px-3 py-2 border-0 focus:ring-2 focus:ring-blue-500 rounded resize-none"
                          rows={3}
                        />
                      </td>
                      <td className="border border-slate-300 p-2">
                        <textarea
                          value={factor.expected_results}
                          onChange={(e) => handleFactorChange(index, 'expected_results', e.target.value)}
                          className="w-full px-3 py-2 border-0 focus:ring-2 focus:ring-blue-500 rounded resize-none"
                          rows={3}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-blue-600 text-white px-6 py-3 rounded-lg mb-4">
              <h2 className="text-lg font-bold">DEFINICIÓN DE COMPETENCIAS CONDUCTUALES Y HABILIDADES TÉCNICAS</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-700 w-12">No.</th>
                    <th className="border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-700">Conductas y Habilidades Técnicas (Definir las 5 Principales)</th>
                  </tr>
                </thead>
                <tbody>
                  {competencies.map((comp, index) => (
                    <tr key={comp.competency_number}>
                      <td className="border border-slate-300 px-4 py-3 text-center font-medium">{comp.competency_number}</td>
                      <td className="border border-slate-300 p-2">
                        <textarea
                          value={comp.competency_description}
                          onChange={(e) => handleCompetencyChange(index, e.target.value)}
                          className="w-full px-3 py-2 border-0 focus:ring-2 focus:ring-blue-500 rounded resize-none"
                          rows={2}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Comentarios Jefe Inmediato
              </label>
              <textarea
                value={formData.manager_comments}
                onChange={(e) => setFormData({ ...formData, manager_comments: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Comentarios del Colaborador
              </label>
              <textarea
                value={formData.employee_comments}
                onChange={(e) => setFormData({ ...formData, employee_comments: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
            <button
              onClick={handleSave}
              disabled={saving || !selectedEmployeeId}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Guardando...' : 'Guardar Evaluación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
