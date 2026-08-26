/* Agregar PLIHSA a las empresas accesibles de Faustino Duran */
UPDATE system_users
SET accessible_company_ids = ARRAY[
  '7ee95c9d-d7cf-4a5f-afe5-a6112b45bc41'::uuid,  -- PTM
  'ef0cbe1b-06be-4587-a9a3-6233c14795f5'::uuid   -- PLIHSA
]::uuid[],
    updated_at = now()
WHERE email = 'faustino.duran@millfoods.com';
