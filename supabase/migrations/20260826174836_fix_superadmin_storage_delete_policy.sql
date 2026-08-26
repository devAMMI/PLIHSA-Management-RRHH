/*
# Fix superadmin storage delete policy

## Problem
The storage.objects DELETE policy "RRHH and admins can delete signed documents"
checked for role `super_admin` (with underscore) but the actual role stored in
system_users is `superadmin` (no underscore). This meant superadmins could not
delete signed documents from the goal-signed-documents bucket.

## Changes
1. Drop the broken policy "RRHH and admins can delete signed documents".
2. Recreate it with the corrected role check: `superadmin` instead of `super_admin`.
   The policy now allows both `rrhh` and `superadmin` roles to delete signed
   documents from the `goal-signed-documents` bucket.

## Security
- Only authenticated users with role `rrhh` or `superadmin` can delete signed
  documents. No new privileges are granted to other roles.
- All other storage policies remain unchanged.
*/

-- Drop the broken policy that referenced the non-existent 'super_admin' role
DROP POLICY IF EXISTS "RRHH and admins can delete signed documents" ON storage.objects;

-- Recreate with the correct role name ('superadmin', not 'super_admin')
CREATE POLICY "RRHH and admins can delete signed documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'goal-signed-documents'
  AND EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
    AND system_users.role IN ('rrhh', 'superadmin')
  )
);
