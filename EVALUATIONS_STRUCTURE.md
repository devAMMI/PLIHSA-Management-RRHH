# Estructura de Evaluaciones - Sistema de Recursos Humanos

## 🗂️ Relación de Tablas

```
┌─────────────────────────────────────────────────────────────────┐
│                         COMPANIES                                │
│  - id (PK)                                                       │
│  - name (ej: "PLIHSA")                                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ (1 empresa → muchos empleados)
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                         EMPLOYEES                                │
│  - id (PK)                                                       │
│  - company_id (FK → companies)                                   │
│  - department_id (FK → departments)                              │
│  - plant_id (FK → plants)                                        │
│  - employee_type ('administrativo' | 'operativo')                │
│  - first_name, last_name, position, etc.                         │
└────────┬──────────────────────────────────────┬─────────────────┘
         │                                      │
         │                                      │
         │ (evaluado)                           │ (jefe)
         │                                      │
┌────────▼──────────────────────┐    ┌─────────▼──────────────────┐
│  OPERATIVE_EVALUATIONS        │    │ ADMINISTRATIVE_EVALUATIONS │
│  - id (PK)                    │    │  - id (PK)                 │
│  - evaluation_period_id (FK)  │    │  - evaluation_period_id    │
│  - employee_id (FK)           │    │  - employee_id (FK)        │
│  - manager_id (FK)            │    │  - manager_id (FK)         │
│  - status                     │    │  - status                  │
│  - created_at, updated_at     │    │  - created_at, updated_at  │
└───────┬───────────────────────┘    └────────┬───────────────────┘
        │                                     │
        ├─────────────────────────────────────┤
        │                                     │
┌───────▼─────────────────────────────────────▼─────────────────┐
│                    EVALUATION_PERIODS                          │
│  - id (PK)                                                     │
│  - name (ej: "Evaluación Anual 2024")                         │
│  - company_id (FK → companies)                                 │
│  - employee_type ('administrativo' | 'operativo')              │
│  - start_date, end_date                                        │
│  - status ('active' | 'inactive')                              │
│  - form_code, form_version                                     │
└────────────────────────────────────────────────────────────────┘
```

## 📊 Query para obtener evaluaciones de PLIHSA

### Para Empleados OPERATIVOS:

```sql
SELECT
  -- Evaluación
  oe.id as evaluation_id,
  oe.status as evaluation_status,
  oe.created_at,
  oe.definition_date,
  oe.review_date,

  -- Empleado Evaluado
  e.employee_code,
  e.first_name || ' ' || e.last_name as employee_name,
  e.position,

  -- Empresa/Departamento/Planta
  c.name as company_name,
  d.name as department_name,
  p.name as plant_name,

  -- Jefe Directo
  m.first_name || ' ' || m.last_name as manager_name,

  -- Período
  ep.name as period_name,
  ep.start_date,
  ep.end_date

FROM operative_evaluations oe
INNER JOIN employees e ON oe.employee_id = e.id
INNER JOIN companies c ON e.company_id = c.id
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN plants p ON e.plant_id = p.id
LEFT JOIN employees m ON oe.manager_id = m.id
INNER JOIN evaluation_periods ep ON oe.evaluation_period_id = ep.id

WHERE c.name ILIKE '%PLIHSA%'
  AND e.employee_type = 'operativo'
  AND oe.created_at BETWEEN '2024-01-01' AND '2024-12-31'

ORDER BY oe.created_at DESC;
```

### Para Empleados ADMINISTRATIVOS:

```sql
SELECT
  -- Evaluación
  ae.id as evaluation_id,
  ae.status as evaluation_status,
  ae.created_at,
  ae.definition_date,
  ae.review_date,

  -- Empleado Evaluado
  e.employee_code,
  e.first_name || ' ' || e.last_name as employee_name,
  e.position,

  -- Empresa/Departamento/Planta
  c.name as company_name,
  d.name as department_name,
  p.name as plant_name,

  -- Jefe Directo
  m.first_name || ' ' || m.last_name as manager_name,

  -- Período
  ep.name as period_name,
  ep.start_date,
  ep.end_date

FROM administrative_evaluations ae
INNER JOIN employees e ON ae.employee_id = e.id
INNER JOIN companies c ON e.company_id = c.id
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN plants p ON e.plant_id = p.id
LEFT JOIN employees m ON ae.manager_id = m.id
INNER JOIN evaluation_periods ep ON ae.evaluation_period_id = ep.id

WHERE c.name ILIKE '%PLIHSA%'
  AND e.employee_type = 'administrativo'
  AND ae.created_at BETWEEN '2024-01-01' AND '2024-12-31'

ORDER BY ae.created_at DESC;
```

## 🎯 Campos importantes por tabla

### EVALUATIONS (operative/administrative)
- `status`: Estado de la evaluación
  - `'draft'` - Borrador (en progreso)
  - `'submitted'` - Enviada (pendiente revisión)
  - `'completed'` - Completada
  - `'approved'` - Aprobada

- `employee_id`: Empleado evaluado
- `manager_id`: Jefe que realiza la evaluación
- `evaluation_period_id`: Período al que pertenece
- `definition_date`: Fecha de definición de factores
- `review_date`: Fecha de revisión del desempeño

### EMPLOYEES
- `company_id`: Empresa a la que pertenece
- `department_id`: Departamento
- `plant_id`: Planta
- `employee_type`: Tipo de empleado (filtro principal)

### EVALUATION_PERIODS
- `company_id`: Empresa específica
- `employee_type`: Tipo de empleado al que aplica
- `status`: 'active' o 'inactive'
- `start_date`, `end_date`: Rango de fechas del período

## 📍 Dónde visualizar las evaluaciones

### Opción 1: Lista en la sección "Evaluaciones" (RECOMENDADO)
```
Dashboard → Evaluaciones → [Lista de Evaluaciones]
```
Mostrar:
- Filtros: Empresa, Tipo de Empleado, Período, Estado
- Tabla con: Empleado, Posición, Departamento, Estado, Fecha, Acciones
- Botones: Ver, Editar, Eliminar

### Opción 2: Vista por Empleado
```
Dashboard → Empleados → [Seleccionar Empleado] → [Historial de Evaluaciones]
```
Mostrar evaluaciones específicas de ese empleado

### Opción 3: Vista por Período
```
Dashboard → Períodos de Evaluación → [Ver Evaluaciones del Período]
```
Ver todas las evaluaciones de un período específico

## 🔍 Estados de Evaluación

| Estado | Descripción | Acciones Disponibles |
|--------|-------------|---------------------|
| `draft` | Borrador, en progreso | Editar, Eliminar, Enviar |
| `submitted` | Enviada para revisión | Ver, Aprobar, Rechazar |
| `completed` | Completada | Ver, Exportar |
| `approved` | Aprobada por RRHH | Ver, Exportar |

## 📈 Resumen de Datos Actuales

- **Empresas PLIHSA**: 1
- **Empleados Operativos**: 54
- **Períodos Operativos**: 1
- **Evaluaciones Operativas**: 0 (pendientes de crear)
- **Evaluaciones Administrativas**: 1
