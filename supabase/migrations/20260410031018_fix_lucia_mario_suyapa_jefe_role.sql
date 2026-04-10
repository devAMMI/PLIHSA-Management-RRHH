/*
  # Fix jefe role assignment for Lucia, Mario, and add Suyapa

  ## Summary
  - Corrects Lucia Chavez and Mario Guevara roles from 'manager' to 'jefe'
    (previous migration used wrong email format for matching)
  - Confirms Suyapa Cuellar already has 'jefe' role
  - Updates by user_id directly to ensure correct targeting

  ## Users affected
  - Lucia Chavez (lucia.chavez@plihsa.com) -> jefe
  - Mario Guevara (mario.guevara@plihsa.com) -> jefe
  - Suyapa Cuellar (suyapa.cuellar@plihsa.com) -> jefe (already set)
*/

UPDATE system_users
SET role = 'jefe'
WHERE user_id IN (
  '31e7d7f2-101d-409f-900d-ccc0046afae8',
  'a92b5145-615b-42bc-9d45-fbf8cf717bb5',
  '148cea01-58bf-4bda-ba79-aa9bc381a5df'
);
