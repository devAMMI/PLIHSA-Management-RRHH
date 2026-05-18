/*
  # Delete system access for Gerardo Mendoza and Elkjaer Flores

  Removes login/app access completely for both users:
  - Deletes from system_users (app access, roles, permissions)
  - Deletes from user_sidebar_permissions if exists
  - Deletes from auth.users (login credentials)

  Employees records are NOT touched - they remain in the employees table.

  Users:
  - Elkjaer David Flores Flores (elkjaer.flores@plihsa.com)
    auth_id: 547cbba7-4c1a-41f4-b082-055f5fe5026a
    system_user_id: df404e51-e540-4f0c-bd8d-a85d31dd5352

  - Gerardo José Mendoza Rodriguez (gerardo.mendoza@plihsa.com)
    auth_id: 662a5008-403f-4850-bc57-26c0c9e79635
    system_user_id: c119ce08-e770-43e7-942e-8ae3b91cd676
*/

-- Remove sidebar permissions
DELETE FROM user_sidebar_permissions
WHERE system_user_id IN (
  'df404e51-e540-4f0c-bd8d-a85d31dd5352',
  'c119ce08-e770-43e7-942e-8ae3b91cd676'
);

-- Remove system users (app access)
DELETE FROM system_users
WHERE id IN (
  'df404e51-e540-4f0c-bd8d-a85d31dd5352',
  'c119ce08-e770-43e7-942e-8ae3b91cd676'
);

-- Remove auth users (login credentials)
DELETE FROM auth.users
WHERE id IN (
  '547cbba7-4c1a-41f4-b082-055f5fe5026a',
  '662a5008-403f-4850-bc57-26c0c9e79635'
);
