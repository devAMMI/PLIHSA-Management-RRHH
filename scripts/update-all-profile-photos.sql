/*
  Script: Actualizar Fotos de Perfil de Todos los Empleados

  Fecha: 4 de Marzo de 2026
  Hora: 9:00 AM GMT-6 (Honduras)

  Descripción:
  - Actualiza la foto de perfil de TODOS los empleados
  - Excepto Kenneth (kenneth@plihsa.com)
  - Establece la foto por defecto: /Profile-pic-plihsa-logo-foto.jpg

  Estadísticas:
  - Total empleados (sin Kenneth): 100
  - Con foto actual: 79
  - Sin foto: 21
  - Todos serán actualizados a la foto por defecto

  Optimización:
  - Se usa URL local (/Profile-pic-plihsa-logo-foto.jpg)
  - No requiere carga de archivos
  - Sin dependencia de storage externo
  - Carga instantánea desde public folder
*/

-- Actualizar todos los empleados excepto Kenneth
UPDATE employees
SET
  photo_url = '/Profile-pic-plihsa-logo-foto.jpg',
  updated_at = NOW()
WHERE email != 'kenneth@plihsa.com';

-- Verificar resultados
SELECT
  'Empleados actualizados' as status,
  COUNT(*) as total,
  COUNT(CASE WHEN photo_url = '/Profile-pic-plihsa-logo-foto.jpg' THEN 1 END) as con_foto_actualizada,
  COUNT(CASE WHEN photo_url IS NULL THEN 1 END) as sin_foto
FROM employees
WHERE email != 'kenneth@plihsa.com';

-- Verificar que Kenneth no fue afectado
SELECT
  first_name,
  last_name,
  email,
  photo_url as foto_kenneth
FROM employees
WHERE email = 'kenneth@plihsa.com';
