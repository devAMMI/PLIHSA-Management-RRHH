/*
  # Fix RRHH and Manager permissions, update Andrea's role

  ## Changes
  1. Update Andrea Fuentes role from 'admin' to 'rrhh'
  2. Swap permissions between 'rrhh' and 'manager' roles:
     - RRHH: Full employee management (create, read, update, delete) + users read + departments manage
     - Manager: Read-only employees + read users + read departments
*/

-- Update Andrea Fuentes to RRHH role
UPDATE system_users
SET role = 'rrhh', updated_at = now()
WHERE email = 'Andrea.fuentes@plihsa.com';

-- Clear existing rrhh and manager permissions
DELETE FROM role_permissions WHERE role IN ('rrhh', 'manager');

-- RRHH: Full employee management (was manager level before, now correct)
INSERT INTO role_permissions (role, permission) VALUES
  ('rrhh', 'employees.create'),
  ('rrhh', 'employees.read'),
  ('rrhh', 'employees.update'),
  ('rrhh', 'employees.delete'),
  ('rrhh', 'users.read'),
  ('rrhh', 'users.create'),
  ('rrhh', 'users.update'),
  ('rrhh', 'users.reset_password'),
  ('rrhh', 'departments.manage'),
  ('rrhh', 'departments.read');

-- Manager: Read-only access (jefes de departamento, pueden ver pero no administrar)
INSERT INTO role_permissions (role, permission) VALUES
  ('manager', 'employees.read'),
  ('manager', 'users.read'),
  ('manager', 'departments.read');
