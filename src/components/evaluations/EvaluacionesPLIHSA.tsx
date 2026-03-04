import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Filter, FileText, Printer, Edit, Calendar, User, Briefcase, MapPin } from 'lucide-react';
import EvaluacionAdministrativa from './EvaluacionAdministrativa';

const PLIHSA_ID = 'ef0cbe1b-06be-4587-a9a3-6233c14795f5';

interface Evaluation {
  id: string;
  status: string;
  created_at: string;
  definition_date: string;
  employee_id: string;
  evaluation_period_id: string;
  employees: {
    first_name: string;
    last_name: string;
    employee_code: string;
    position: string;
    departments: { name: string };
    work_locations: { name: string };
  };
  evaluation_periods: {
    name: string;
    period_number: number;
    year: number;
  };
}

export default function EvaluacionesPLIHSA() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [periods, setPeriods] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadEvaluations();
    loadPeriods();
  }, []);

  useEffect(() => {
    filterEvaluations();
  }, [evaluations, searchTerm, statusFilter, periodFilter]);

  const loadPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluation_periods')
        .select('*')
        .eq('company_id', PLIHSA_ID)
        .eq('employee_type', 'administrativo')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPeriods(data || []);
    } catch (error) {
      console.error('Error loading periods:', error);
    }
  };

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('administrative_evaluations')
        .select(`
          id, status, created_at, definition_date,
          employee_id, evaluation_period_id,
          employees!administrative_evaluations_employee_id_fkey (
            first_name, last_name, employee_code, position,
            departments(name),
            work_locations(name)
          ),
          evaluation_periods(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvaluations(data || []);
    } catch (error) {
      console.error('Error loading evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvaluations = () => {
    let filtered = [...evaluations];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.employees?.first_name?.toLowerCase().includes(term) ||
        e.employees?.last_name?.toLowerCase().includes(term) ||
        e.employees?.employee_code?.toLowerCase().includes(term) ||
        e.employees?.position?.toLowerCase().includes(term)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    if (periodFilter) {
      filtered = filtered.filter(e => e.evaluation_period_id === periodFilter);
    }

    setFilteredEvaluations(filtered);
  };

  const getStats = () => {
    const total = evaluations.length;
    const completed = evaluations.filter(e => e.status === 'completed').length;
    const drafts = evaluations.filter(e => e.status === 'draft').length;
    const pending = evaluations.filter(e =>
      ['pending_employee', 'pending_manager', 'pending_rrhh'].includes(e.status)
    ).length;

    return { total, completed, drafts, pending };
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bg: string }> = {
      draft: { label: 'BORRADOR', color: '#616161', bg: '#f5f5f5' },
      pending_employee: { label: 'PEND. EMPLEADO', color: '#1565c0', bg: '#e3f2fd' },
      pending_manager: { label: 'PEND. JEFE', color: '#6a1b9a', bg: '#f3e5f5' },
      pending_rrhh: { label: 'PEND. RRHH', color: '#e65100', bg: '#fff3e0' },
      completed: { label: 'COMPLETADA', color: '#1b5e20', bg: '#e8f5e9' },
    };
    return configs[status] || configs.draft;
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const handlePrint = (evaluation: Evaluation) => {
    console.log('Print evaluation:', evaluation.id);
  };

  if (editingId) {
    return (
      <div>
        <button
          onClick={() => {
            setEditingId(null);
            loadEvaluations();
          }}
          style={{
            margin: '20px',
            padding: '10px 20px',
            background: '#1a3f6f',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          ← Volver a la lista
        </button>
        <EvaluacionAdministrativa evaluationId={editingId} />
      </div>
    );
  }

  const stats = getStats();

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f8', fontFamily: "'DM Sans', sans-serif", padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a3f6f', marginBottom: '8px' }}>
            Evaluaciones Administrativas PLIHSA
          </h1>
          <p style={{ fontSize: '14px', color: '#616161' }}>
            Gestión de evaluaciones de desempeño para personal administrativo
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            borderLeft: '4px solid #1a3f6f',
          }}>
            <div style={{ fontSize: '13px', color: '#616161', marginBottom: '4px' }}>Total</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a3f6f' }}>{stats.total}</div>
          </div>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            borderLeft: '4px solid #2e7d32',
          }}>
            <div style={{ fontSize: '13px', color: '#616161', marginBottom: '4px' }}>Completadas</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#2e7d32' }}>{stats.completed}</div>
          </div>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            borderLeft: '4px solid #616161',
          }}>
            <div style={{ fontSize: '13px', color: '#616161', marginBottom: '4px' }}>Borradores</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#616161' }}>{stats.drafts}</div>
          </div>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            borderLeft: '4px solid #e65100',
          }}>
            <div style={{ fontSize: '13px', color: '#616161', marginBottom: '4px' }}>Pendientes</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#e65100' }}>{stats.pending}</div>
          </div>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9e9e9e' }} />
              <input
                type="text"
                placeholder="Buscar por nombre, código o posición..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d0d0d0',
                borderRadius: '6px',
                fontSize: '13px',
                minWidth: '150px',
              }}
            >
              <option value="">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="pending_employee">Pend. Empleado</option>
              <option value="pending_manager">Pend. Jefe</option>
              <option value="pending_rrhh">Pend. RRHH</option>
              <option value="completed">Completada</option>
            </select>

            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d0d0d0',
                borderRadius: '6px',
                fontSize: '13px',
                minWidth: '200px',
              }}
            >
              <option value="">Todos los períodos</option>
              {periods.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setPeriodFilter('');
              }}
              style={{
                padding: '10px 16px',
                background: '#f5f5f5',
                border: '1px solid #d0d0d0',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                color: '#616161',
              }}
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9e9e9e' }}>
            Cargando evaluaciones...
          </div>
        ) : filteredEvaluations.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            padding: '40px',
            textAlign: 'center',
          }}>
            <FileText size={48} style={{ color: '#d0d0d0', marginBottom: '16px' }} />
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#616161', marginBottom: '8px' }}>
              No se encontraron evaluaciones
            </div>
            <div style={{ fontSize: '13px', color: '#9e9e9e' }}>
              {searchTerm || statusFilter || periodFilter
                ? 'Intenta cambiar los filtros de búsqueda'
                : 'Aún no hay evaluaciones registradas'}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px',
          }}>
            {filteredEvaluations.map(evaluation => {
              const statusConfig = getStatusConfig(evaluation.status);
              const employee = evaluation.employees;

              return (
                <div
                  key={evaluation.id}
                  style={{
                    background: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: '#1a3f6f',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: '700',
                        flexShrink: 0,
                      }}>
                        {employee?.first_name?.[0]}{employee?.last_name?.[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#1a3f6f',
                          marginBottom: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {employee?.first_name} {employee?.last_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9e9e9e' }}>
                          {employee?.employee_code}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#424242',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <Briefcase size={14} />
                        {employee?.position || 'Sin posición'}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#616161',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                      }}>
                        <MapPin size={12} />
                        {employee?.departments?.name} · {employee?.work_locations?.name}
                      </div>
                    </div>

                    <div style={{
                      padding: '12px',
                      background: '#f5f5f5',
                      borderRadius: '6px',
                      marginBottom: '16px',
                    }}>
                      <div style={{
                        fontSize: '11px',
                        color: '#9e9e9e',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <Calendar size={11} />
                        Período
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#424242' }}>
                        {evaluation.evaluation_periods?.name || 'Sin período'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9e9e9e', marginTop: '8px' }}>
                        Creado: {formatDate(evaluation.created_at)}
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: statusConfig.color,
                        background: statusConfig.bg,
                        letterSpacing: '0.5px',
                      }}>
                        {statusConfig.label}
                      </span>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setEditingId(evaluation.id)}
                          style={{
                            padding: '8px 12px',
                            background: '#1a3f6f',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Edit size={14} />
                          Editar
                        </button>
                        <button
                          onClick={() => handlePrint(evaluation)}
                          style={{
                            padding: '8px',
                            background: '#f5f5f5',
                            color: '#616161',
                            border: '1px solid #d0d0d0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Printer size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
