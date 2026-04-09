/*
  # Add June 2026 Evaluation Periods

  ## Summary
  Inserts two evaluation periods for the 2da Evaluacion - Junio 2026 cycle.
  One for administrative employees, one for operative employees.
  Uses the existing PLIHSA company_id and matches the same structure
  as the existing January 2026 periods.

  ## New Records
  - Administrative: PL-RH-P-002-F02, employee_type = 'administrativo'
  - Operative: PL-RH-P-002-F05, employee_type = 'operativo'

  ## Notes
  - company_id is fixed to PLIHSA (ef0cbe1b-06be-4587-a9a3-6233c14795f5)
  - Covers April 1 to June 30, 2026
*/

INSERT INTO evaluation_periods (id, name, company_id, employee_type, form_code, form_version, start_date, end_date, status)
VALUES
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567891',
    'Evaluacion Administrativa - Junio 2026',
    'ef0cbe1b-06be-4587-a9a3-6233c14795f5',
    'administrativo',
    'PL-RH-P-002-F02',
    'v1.0',
    '2026-04-01',
    '2026-06-30',
    'active'
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567892',
    'Evaluacion Operativa - Junio 2026',
    'ef0cbe1b-06be-4587-a9a3-6233c14795f5',
    'operativo',
    'PL-RH-P-002-F05',
    'v1.0',
    '2026-04-01',
    '2026-06-30',
    'active'
  )
ON CONFLICT (id) DO NOTHING;
