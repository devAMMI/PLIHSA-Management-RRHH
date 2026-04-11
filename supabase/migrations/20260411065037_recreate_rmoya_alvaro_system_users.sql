/*
  # Recreate system_users for rmoya and alvaro.rivera

  These users were recreated via the Supabase Auth admin API with new UUIDs.
  This migration inserts their system_users records with the correct new auth user IDs.

  - rmoya@ammi.com → new auth id: 5b73b423-852d-471f-a342-94b1afee53fc (role: manager, company: AMMI)
  - alvaro.rivera@plihsa.com → new auth id: 5ca927d4-a309-4fae-8a54-ca6be9ef5f88 (role: manager, company: PLIHSA)
*/

INSERT INTO system_users (user_id, email, role, company_id, is_active)
VALUES
  (
    '5b73b423-852d-471f-a342-94b1afee53fc',
    'rmoya@ammi.com',
    'manager',
    'a193919b-a633-480d-bfaa-0b987c9349dd',
    true
  ),
  (
    '5ca927d4-a309-4fae-8a54-ca6be9ef5f88',
    'alvaro.rivera@plihsa.com',
    'manager',
    'ef0cbe1b-06be-4587-a9a3-6233c14795f5',
    true
  )
ON CONFLICT (user_id) DO NOTHING;
