-- Script para crear usuarios directamente en la base de datos
-- Nota: Los usuarios serán creados en auth.users con contraseña hasheada

-- Usuario 1: Karla Sagastume
-- Usuario 2: Andrea Fuentes
-- Usuario 3: Practicante

-- IMPORTANTE: Este script debe ejecutarse con privilegios de superadmin
-- La contraseña "Temporal2026" será hasheada por Supabase

-- Las inserciones en auth.users deben hacerse a través de la función admin.create_user
-- Por ahora, insertaremos directamente los registros en system_users con user_ids generados

-- Primero, necesitamos crear los usuarios en auth usando la API de Supabase
-- Este es un placeholder SQL que documenta los usuarios que necesitan crearse
