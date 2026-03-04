# 📊 ANÁLISIS BASE DE DATOS - PLIHSA

**Fecha:** 4 de Marzo 2026
**Empresa:** PLIHSA (Plasticos Industriales de Honduras S.A.)
**Total Empleados:** 109

---

## 🎯 RESUMEN EJECUTIVO

La base de datos de PLIHSA contiene **109 empleados** distribuidos entre personal **administrativo (55)** y **operativo (54)**.

**⚠️ PROBLEMA CRÍTICO IDENTIFICADO:**
Los 109 empleados NO tienen asignada una `work_location_id` (ubicación física).

---

## 📈 DISTRIBUCIÓN DE EMPLEADOS

### Por Tipo de Empleado
| Tipo | Cantidad | % |
|------|----------|---|
| **Administrativo** | 55 | 50.5% |
| **Operativo** | 54 | 49.5% |
| **TOTAL** | **109** | **100%** |

---

### Por Departamento
| Departamento | Cantidad | Tipo Predominante |
|--------------|----------|-------------------|
| Mantenimiento | 27 | Operativo |
| Inyección | 21 | Operativo |
| Coronas | 20 | Operativo |
| Calidad | 10 | Mixto |
| **SIN DEPARTAMENTO** | **10** | ⚠️ |
| Producción | 8 | Operativo |
| Finanzas | 6 | Administrativo |
| Logística | 3 | Administrativo |
| Dirección | 2 | Administrativo |
| Recursos Humanos | 1 | Administrativo |
| Tecnología de la Información | 1 | Administrativo |
| **TOTAL** | **109** | |

---

### Por Puesto (Top 10)
| Puesto | Cantidad |
|--------|----------|
| Operador de Inyección | 11 |
| Supervisor de Producción | 6 |
| Operador de Empaque | 5 |
| Técnico | 4 |
| Auxiliar de Limpieza | 3 |
| Litógrafo | 3 |
| Operador de Mezclazo | 3 |
| Operador de Moldeo | 3 |
| Operador de Molinos | 3 |
| Otros (70+ puestos únicos) | 68 |

---

## 🏢 UBICACIONES FÍSICAS (work_locations)

### Ubicaciones Creadas ✅
1. **Planta Corona PLIHSA** (tipo: planta)
2. **Planta Inyección PLIHSA** (tipo: planta)
3. **Edificio Administrativo PLIHSA** (tipo: oficina)

### ⚠️ PROBLEMA: Empleados SIN Ubicación Asignada
**109 empleados (100%)** no tienen `work_location_id` asignado.

---

## 🗂️ ESTRUCTURA DE TABLAS - PLIHSA

### Tabla Principal: `employees`
**Campos Clave:**
- ✅ `company_id` → Siempre apunta a PLIHSA
- ✅ `employee_type` → "administrativo" o "operativo"
- ✅ `position` → Puesto (texto libre)
- ✅ `department_id` → FK a `departments`
- ⚠️ `work_location_id` → **TODOS EN NULL**
- ⚠️ `plant_id` → Campo legacy (deprecado)
- ✅ `manager_id` → Jefe directo
- ✅ `sub_department_id` → Sub-departamento (opcional)

### Campos de Identificación
- `national_id` → Identidad anterior
- `national_id_hn` → Nueva identidad hondureña
- `national_id_legacy` → Identidad legacy
- `passport_id` → Pasaporte

### Campos de Catálogos
- `gender_id` → FK a `genders`
- `status_id` → FK a `employee_statuses`

---

## 🔗 TABLAS RELACIONADAS

### Tablas de Datos de Empleados
1. ✅ `employee_education` → Historial educativo
2. ✅ `employee_emergency_contacts` → Contactos de emergencia
3. ✅ `employee_work_history` → Historial laboral
4. ✅ `employee_documents` → Documentos escaneados

### Tablas de Evaluaciones
1. ✅ `administrative_evaluation_templates` → Plantillas admin
2. ✅ `administrative_evaluations` → Evaluaciones admin
3. ✅ `operative_evaluation_templates` → Plantillas operativas
4. ✅ `operative_evaluations` → Evaluaciones operativas

### Catálogos Compartidos (Multi-empresa)
1. ✅ `work_location_types` → Tipos de ubicación
2. ✅ `education_levels` → Niveles educativos
3. ✅ `genders` → Géneros
4. ✅ `employee_statuses` → Estados de empleado
5. ✅ `document_types` → Tipos de documento

---

## 🎯 RECOMENDACIONES INMEDIATAS

### 1. ⚠️ CRÍTICO: Asignar Ubicaciones
**Acción:** Actualizar `work_location_id` para los 109 empleados.

**Reglas sugeridas:**
- **Departamentos de Planta Corona** → `work_location_id` = Planta Corona
  - Coronas
  - Producción

- **Departamentos de Planta Inyección** → `work_location_id` = Planta Inyección
  - Inyección
  - Mantenimiento (si trabajan en inyección)

- **Departamentos Administrativos** → `work_location_id` = Edificio Administrativo
  - Dirección
  - Finanzas
  - Recursos Humanos
  - Tecnología de la Información
  - Calidad
  - Logística

### 2. Limpiar Empleados sin Departamento
10 empleados no tienen `department_id` asignado.

### 3. Normalizar Campo `position`
Actualmente es texto libre. Considerar crear tabla `positions` para estandarizar.

### 4. Deprecar Campo `plant_id`
Ya tenemos `work_location_id`, que es más flexible.

---

## 📋 PRÓXIMOS PASOS

1. **Asignar ubicaciones físicas** a los 109 empleados
2. **Revisar empleados sin departamento** (10 empleados)
3. **Validar datos** de empleados administrativos vs operativos
4. **Documentar reglas de negocio** para cada departamento
5. **Crear reportes** de distribución por ubicación

---

## 🔍 CONSULTAS ÚTILES

### Ver empleados sin ubicación
```sql
SELECT employee_code, first_name, last_name, position,
       d.name as department
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
WHERE e.company_id = (SELECT id FROM companies WHERE code = 'PLIHSA')
  AND e.work_location_id IS NULL;
```

### Ver empleados sin departamento
```sql
SELECT employee_code, first_name, last_name, position
FROM employees
WHERE company_id = (SELECT id FROM companies WHERE code = 'PLIHSA')
  AND department_id IS NULL;
```

### Distribución por ubicación (después de asignar)
```sql
SELECT wl.name, COUNT(*) as empleados
FROM employees e
JOIN work_locations wl ON e.work_location_id = wl.id
WHERE e.company_id = (SELECT id FROM companies WHERE code = 'PLIHSA')
GROUP BY wl.name;
```
